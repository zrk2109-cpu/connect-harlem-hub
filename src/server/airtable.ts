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
  neighborhood: z.string().max(200).optional().default(""),
  supportNeeds: z.array(z.string().max(200)).max(10).default([]),
  biggestChallenge: z.string().max(2000).optional().default(""),
  urgency: z.string().max(50).optional().default(""),
  workedWithHcc: z.string().max(20).optional().default(""),
  previousService: z.string().max(500).optional().default(""),
  tier: z.string().max(20),
});

const AIRTABLE_API = "https://api.airtable.com/v0";

// --- Mappings ---
const BUSINESS_STAGE_MAP: Record<string, string> = {
  idea: "Idea Stage",
  prelaunch: "Idea Stage",
  under2: "Startup",
  "2to5": "Early Growth",
  established: "Established",
  scaling: "Scaling",
};

const URGENCY_MAP: Record<string, string> = {
  days: "Critical",
  soon: "High",
  months: "Medium",
  exploring: "Low",
};

const PRIORITY_MAP: Record<string, string> = {
  Critical: "Urgent",
  High: "High",
  Medium: "Medium",
  Low: "Low",
};

const HCC_MAP: Record<string, string> = {
  yes: "Yes",
  no: "No",
  "not-sure": "Not sure",
};

// Form support-need value -> Airtable Service_Needs Label (must match exactly)
const SERVICE_NEED_LABEL_MAP: Record<string, string> = {
  planning: "Business Planning & Strategy Support",
  financial: "Financial Management & Accounting Support",
  capital: "Access to Capital & Financing Support",
  workforce: "People, Hiring & Workforce Support",
  marketing: "Marketing & Customer Outreach Support",
  sales: "Sales & Revenue Growth Support",
  operations: "Operations & Day-to-Day Business Support",
  legal: "Legal, Compliance & Contracts Support",
  technology: "Technology & Digital Tools Support",
  other: "Other",
};

async function airtableRequest(
  baseId: string,
  token: string,
  table: string,
  init: { method: string; body?: unknown; query?: string },
) {
  const url = `${AIRTABLE_API}/${baseId}/${encodeURIComponent(table)}${init.query ? `?${init.query}` : ""}`;
  const res = await fetch(url, {
    method: init.method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
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
    const err = `Airtable ${table} [${res.status}]: ${typeof msg === "string" ? msg : JSON.stringify(msg)}`;
    console.error(err);
    throw new Error(err);
  }
  return data;
}

async function fetchServiceNeedIds(
  baseId: string,
  token: string,
  labels: string[],
): Promise<string[]> {
  if (labels.length === 0) return [];
  // Build OR(...) filter on {Label}
  const orParts = labels.map((l) => `{Label}="${l.replace(/"/g, '\\"')}"`);
  const formula = orParts.length === 1 ? orParts[0] : `OR(${orParts.join(",")})`;
  const query = `filterByFormula=${encodeURIComponent(formula)}&pageSize=100`;
  const res = await airtableRequest(baseId, token, "Service_Needs", {
    method: "GET",
    query,
  });
  const records: Array<{ id: string; fields: Record<string, unknown> }> = res?.records ?? [];
  const byLabel = new Map<string, string>();
  for (const rec of records) {
    const label = String(rec.fields["Label"] ?? "");
    if (label) byLabel.set(label, rec.id);
  }
  const ids: string[] = [];
  for (const l of labels) {
    const id = byLabel.get(l);
    if (id) ids.push(id);
    else console.warn(`Service_Needs: no record found for Label="${l}"`);
  }
  return ids;
}

export const submitToAirtable = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SubmissionSchema.parse(input))
  .handler(async ({ data }) => {
    const token = process.env.AIRTABLE_TOKEN;
    const baseId = process.env.AIRTABLE_BASE_ID;
    if (!token) throw new Error("AIRTABLE_TOKEN is not configured");
    if (!baseId) throw new Error("AIRTABLE_BASE_ID is not configured");

    // Split full name on first space
    const trimmed = data.fullName.trim().replace(/\s+/g, " ");
    const firstSpace = trimmed.indexOf(" ");
    const firstName = firstSpace === -1 ? trimmed : trimmed.slice(0, firstSpace);
    const lastName = firstSpace === -1 ? "" : trimmed.slice(firstSpace + 1);

    const businessStageMapped = BUSINESS_STAGE_MAP[data.businessStage] ?? "";
    const urgencyMapped = URGENCY_MAP[data.urgency] ?? "";
    const hasPriorHcc = HCC_MAP[data.workedWithHcc] ?? "";

    // 1. Resolve Service_Needs record IDs by Label
    const labels = data.supportNeeds
      .map((v) => SERVICE_NEED_LABEL_MAP[v])
      .filter((l): l is string => Boolean(l));
    const serviceNeedIds = await fetchServiceNeedIds(baseId, token, labels);

    // 2. Create Client record
    const clientFields: Record<string, unknown> = {
      "Created On": new Date().toISOString().slice(0, 10),
      "First Name": firstName,
      "Last Name": lastName,
      Email: data.email,
      Phone: data.phone,
      "Business Name": data.businessName,
      "Business Stage": businessStageMapped,
      "Employee Count Range": data.employeeCount,
      Borough: data.borough,
      Neighborhood: data.neighborhood,
      Industry: data.businessType,
      "Has Prior HCC Engagement": hasPriorHcc,
      "Prior Service Details": data.previousService,
    };
    const clientRes = await airtableRequest(baseId, token, "Clients", {
      method: "POST",
      body: { fields: clientFields, typecast: true },
    });
    const clientId: string = clientRes?.id;
    if (!clientId) throw new Error("Airtable Clients: no record ID returned");

    // 3. Create Intake_Submissions record linked to client
    const submissionName = `${trimmed || data.email} — ${new Date().toISOString().slice(0, 10)}`;
    const submissionRes = await airtableRequest(baseId, token, "Intake_Submissions", {
      method: "POST",
      body: {
        fields: {
          "Submission Name": submissionName,
          Client: [clientId],
          Status: "Submitted",
          "Is Draft": false,
          "Urgency Level": urgencyMapped,
          "Biggest Challenge": data.biggestChallenge,
          "Source Channel": "Website",
          "Submission Date": new Date().toISOString(),
          "Service Needs": serviceNeedIds,
        },
        typecast: true,
      },
    });
    const submissionId: string = submissionRes?.id;
    if (!submissionId) throw new Error("Airtable Intake_Submissions: no record ID returned");

    // 4. Create Cases record
    const today = new Date().toISOString().slice(0, 10);
    const caseName = `CASE - ${[firstName, lastName].filter(Boolean).join(" ").trim() || data.email}`;
    const priority = PRIORITY_MAP[urgencyMapped] ?? "";
    const caseRes = await airtableRequest(baseId, token, "Cases", {
      method: "POST",
      body: {
        fields: {
          "Case Name": caseName,
          Client: [clientId],
          "Intake Submission": [submissionId],
          Status: "New",
          Priority: priority,
          "Created On": today,
        },
        typecast: true,
      },
    });

    return {
      success: true as const,
      clientId,
      submissionId,
      caseId: caseRes?.id as string,
    };
  });
