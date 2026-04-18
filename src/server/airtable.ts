import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SubmissionSchema = z.object({
  fullName: z.string().min(1).max(200),
  businessName: z.string().max(200).optional().default(""),
  email: z.string().email().max(200),
  phone: z.string().max(50).optional().default(""),
  preferredContact: z.string().max(20).optional().default(""),
  businessStage: z.string().max(50).optional().default(""),
  businessType: z.string().max(100).optional().default(""),
  employeeCount: z.string().max(50).optional().default(""),
  borough: z.string().max(100).optional().default(""),
  supportNeeds: z.array(z.string().max(100)).max(10).default([]),
  biggestChallenge: z.string().max(2000).optional().default(""),
  urgency: z.string().max(50).optional().default(""),
  workedWithHcc: z.string().max(20).optional().default(""),
  previousService: z.string().max(500).optional().default(""),
  tier: z.string().max(20),
});

const AIRTABLE_API = "https://api.airtable.com/v0";

async function airtableRequest(baseId: string, token: string, table: string, body: unknown) {
  const res = await fetch(`${AIRTABLE_API}/${baseId}/${encodeURIComponent(table)}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    /* keep raw text */
  }
  if (!res.ok) {
    const msg = data?.error?.message || data?.error || text || res.statusText;
    throw new Error(`Airtable ${table} [${res.status}]: ${typeof msg === "string" ? msg : JSON.stringify(msg)}`);
  }
  return data;
}

export const submitToAirtable = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SubmissionSchema.parse(input))
  .handler(async ({ data }) => {
    const token = process.env.AIRTABLE_TOKEN;
    const baseId = process.env.AIRTABLE_BASE_ID;
    if (!token) throw new Error("AIRTABLE_TOKEN is not configured");
    if (!baseId) throw new Error("AIRTABLE_BASE_ID is not configured");

    // Split full name into first / last
    const trimmed = data.fullName.trim().replace(/\s+/g, " ");
    const parts = trimmed.split(" ");
    const firstName = parts[0] ?? "";
    const lastName = parts.length > 1 ? parts.slice(1).join(" ") : "";

    const hasPriorHcc =
      data.workedWithHcc === "yes"
        ? "Yes"
        : data.workedWithHcc === "no"
          ? "No"
          : data.workedWithHcc === "not-sure"
            ? "Not Sure"
            : "";

    // 1. Create Client record
    const clientRes = await airtableRequest(baseId, token, "Clients", {
      fields: {
        "First Name": firstName,
        "Last Name": lastName,
        Email: data.email,
        Phone: data.phone,
        "Business Name": data.businessName,
        "Business Stage": data.businessStage,
        Borough: data.borough,
        "Has Prior HCC Engagement": hasPriorHcc,
        Industry: data.businessType,
        Neighborhood: data.borough,
      },
      typecast: true,
    });

    const clientId: string = clientRes?.id;
    if (!clientId) throw new Error("Airtable Clients: no record ID returned");

    const submissionName = `${trimmed || data.email} — ${new Date().toISOString().slice(0, 10)}`;

    // 2. Create Intake_Submissions record linked to client
    const submissionRes = await airtableRequest(baseId, token, "Intake_Submissions", {
      fields: {
        "Submission Name": submissionName,
        Client: [clientId],
        Status: "Submitted",
        "Is Draft": false,
        "Urgency Level": data.urgency,
        "Biggest Challenge": data.biggestChallenge,
        "Source Channel": "Web Intake Form",
        "Submission Date": new Date().toISOString(),
        "Service Needs": data.supportNeeds,
      },
      typecast: true,
    });

    return {
      success: true as const,
      clientId,
      submissionId: submissionRes?.id as string,
    };
  });
