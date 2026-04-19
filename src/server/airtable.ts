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

const TIER_LABEL_MAP: Record<string, string> = {
  tier1: "Foundational",
  tier2: "Targeted",
  tier3: "Ongoing",
};

// FIX 2: Hardcoded Service Need Record IDs — no live fetch, no fragile label matching
const SERVICE_NEED_ID_MAP: Record<string, string> = {
  planning:   "recQhI30si23KCUxn",
  financial:  "recGAlPpcr6Cs7Go4",
  capital:    "recoOmoSDUXBcDGyi",
  workforce:  "recdtXys0jWUzq8su",
  marketing:  "recIrffknVD5uKc2I",
  sales:      "rec780jJeUDGJFCUg",
  operations: "recKQTLeIeVcf188O",
  legal:      "recFAeO4PqdQ4RxwQ",
  technology: "reczcVWXVyLz7Dgss",
  other:      "recusUJAOQG0jHLoM",
};

// --- Core Airtable request helper ---
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
  try { data = text ? JSON.parse(text) : null; } catch { /* keep raw */ }
  if (!res.ok) {
    const msg = data?.error?.message || data?.error || text || res.statusText;
    const err = `Airtable ${table} [${res.status}]: ${typeof msg === "string" ? msg : JSON.stringify(msg)}`;
    console.error(err);
    throw new Error(err);
  }
  return data;
}

// FIX 1: Find existing client by email — returns record ID or null
async function findClientByEmail(
  baseId: string,
  token: string,
  email: string,
): Promise<string | null> {
  const formula = `{Email}="${email.replace(/"/g, '\\"')}"`;
  const query = `filterByFormula=${encodeURIComponent(formula)}&pageSize=1`;
  const res = await airtableRequest(baseId, token, "Clients", {
    method: "GET",
    query,
  });
  const records: Array<{ id: string }> = res?.records ?? [];
  return records.length > 0 ? records[0].id : null;
}

export const submitToAirtable = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SubmissionSchema.parse(input))
  .handler(async ({ data }) => {
    const token = process.env.AIRTABLE_TOKEN;
    const baseId = process.env.AIRTABLE_BASE_ID;
    if (!token) throw new Error("AIRTABLE_TOKEN is not configured");
    if (!baseId) throw new Error("AIRTABLE_BASE_ID is not configured");

    // Split full name
    const trimmed = data.fullName.trim().replace(/\s+/g, " ");
    const firstSpace = trimmed.indexOf(" ");
    const firstName = firstSpace === -1 ? trimmed : trimmed.slice(0, firstSpace);
    const lastName = firstSpace === -1 ? "" : trimmed.slice(firstSpace + 1);
    const fullName = [firstName, lastName].filter(Boolean).join(" ").trim() || data.email;

    const businessStageMapped = BUSINESS_STAGE_MAP[data.businessStage] ?? "";
    const urgencyMapped = URGENCY_MAP[data.urgency] ?? "";
    const hasPriorHcc = HCC_MAP[data.workedWithHcc] ?? "";
    const tierLabel = TIER_LABEL_MAP[data.tier] ?? data.tier;
    const priority = PRIORITY_MAP[urgencyMapped] ?? "Medium";
    const today = new Date().toISOString().slice(0, 10);

    // FIX 2: Map support needs to hardcoded Record IDs — fast, no API call needed
    const serviceNeedIds = data.supportNeeds
      .map((v) => SERVICE_NEED_ID_MAP[v])
      .filter((id): id is string => Boolean(id));

    // STEP 1: Find or create Client (FIX 1 — deduplication)
    let clientId = await findClientByEmail(baseId, token, data.email);
    if (!clientId) {
      const clientRes = await airtableRequest(baseId, token, "Clients", {
        method: "POST",
        body: {
          fields: {
            "First Name": firstName,
            "Last Name": lastName,
            Email: data.email,
            Phone: data.phone,
            "Preferred Contact Method": data.preferredContact, // FIX 4
            "Business Name": data.businessName,
            "Business Stage": businessStageMapped,
            "Employee Count Range": data.employeeCount,
            Borough: data.borough,
            Neighborhood: data.neighborhood,
            Industry: data.businessType,
            "Has Prior HCC Engagement": hasPriorHcc,
            "Prior Service Details": data.previousService,
            "Created On": today,
          },
          typecast: true,
        },
      });
      clientId = clientRes?.id;
      if (!clientId) throw new Error("Airtable Clients: no record ID returned");
    }

    // STEP 2: Create Intake Submission linked to Client
    const submissionName = `${fullName} — ${today}`;
    const submissionRes = await airtableRequest(baseId, token, "Intake Submissions", {
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
          "Recommended Tier": tierLabel, // FIX 3
          "Assigned Tier": tierLabel,    // FIX 3
          "Submission Date": new Date().toISOString(),
          "Service Needs": serviceNeedIds,
          "Raw Form Data": JSON.stringify(data), // FIX 5
        },
        typecast: true,
      },
    });
    const submissionId: string = submissionRes?.id;
    if (!submissionId) throw new Error("Airtable Intake Submissions: no record ID returned");

    // STEP 3: Create Case linked to Client + Submission
    const caseName = `CASE — ${fullName}`;
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
    const caseId: string = caseRes?.id;
    if (!caseId) throw new Error("Airtable Cases: no record ID returned");

    return {
      success: true as const,
      clientId,
      submissionId,
      caseId,
      isExistingClient: !!clientId,
    };
  });
