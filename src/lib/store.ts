import { type IntakeFormData, type Submission, type SubmissionStatus, determineTier } from "./types";

const STORAGE_KEY = "hcc_submissions";
const FORM_PROGRESS_KEY = "hcc_form_progress";

export function getEmptyForm(): IntakeFormData {
  return {
    fullName: "",
    businessName: "",
    email: "",
    phone: "",
    preferredContact: "",
    businessStage: "",
    businessType: "",
    employeeCount: "",
    borough: "",
    neighborhood: "",
    supportNeeds: [],
    biggestChallenge: "",
    urgency: "",
    workedWithHcc: "",
    previousService: "",
  };
}

export function saveFormProgress(data: IntakeFormData, step: number) {
  try {
    localStorage.setItem(FORM_PROGRESS_KEY, JSON.stringify({ data, step }));
  } catch {}
}

export function loadFormProgress(): { data: IntakeFormData; step: number } | null {
  try {
    const raw = localStorage.getItem(FORM_PROGRESS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearFormProgress() {
  try {
    localStorage.removeItem(FORM_PROGRESS_KEY);
  } catch {}
}

export function getSubmissions(): Submission[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getMockSubmissions();
    return JSON.parse(raw);
  } catch {
    return getMockSubmissions();
  }
}

export function addSubmission(data: IntakeFormData): Submission {
  const tierResult = determineTier(data);
  const submission: Submission = {
    ...data,
    id: crypto.randomUUID(),
    submittedAt: new Date().toISOString(),
    tier: tierResult.tier,
    status: "New",
    assignedTo: "",
    notes: "",
  };
  const existing = getSubmissions();
  existing.unshift(submission);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  return submission;
}

export function updateSubmission(id: string, updates: Partial<Pick<Submission, "status" | "assignedTo" | "notes">>) {
  const subs = getSubmissions();
  const idx = subs.findIndex((s) => s.id === id);
  if (idx >= 0) {
    subs[idx] = { ...subs[idx], ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subs));
  }
  return subs;
}

function getMockSubmissions(): Submission[] {
  return [
    {
      id: "mock-1",
      fullName: "Maria Santos",
      businessName: "Santos Catering Co.",
      email: "maria@santoscatering.com",
      phone: "212-555-0101",
      preferredContact: "email",
      businessStage: "2to5",
      businessType: "Food & Beverage",
      employeeCount: "3-5",
      borough: "Manhattan",
      neighborhood: "Harlem",
      supportNeeds: ["marketing", "capital"],
      biggestChallenge: "Need help reaching more customers outside my neighborhood.",
      urgency: "soon",
      workedWithHcc: "yes",
      previousService: "Business planning workshop",
      submittedAt: "2026-04-14T10:30:00Z",
      tier: "tier2",
      status: "In Review",
      assignedTo: "James W.",
      notes: "Strong candidate for marketing TA program.",
    },
    {
      id: "mock-2",
      fullName: "Kwame Johnson",
      businessName: "",
      email: "kwame.j@gmail.com",
      phone: "347-555-0202",
      preferredContact: "phone",
      businessStage: "idea",
      businessType: "Technology",
      employeeCount: "0",
      borough: "Manhattan",
      neighborhood: "Central Harlem",
      supportNeeds: ["planning"],
      biggestChallenge: "I have a great app idea but don't know where to start.",
      urgency: "months",
      workedWithHcc: "no",
      previousService: "",
      submittedAt: "2026-04-13T14:15:00Z",
      tier: "tier1",
      status: "New",
      assignedTo: "",
      notes: "",
    },
    {
      id: "mock-3",
      fullName: "Aisha Williams",
      businessName: "Williams Beauty Studio",
      email: "aisha@williamsbeauty.com",
      phone: "646-555-0303",
      preferredContact: "text",
      businessStage: "established",
      businessType: "Beauty & Personal Care",
      employeeCount: "6-10",
      borough: "Manhattan",
      neighborhood: "East Harlem",
      supportNeeds: ["workforce", "capital", "operations"],
      biggestChallenge: "Scaling to a second location and managing a bigger team.",
      urgency: "soon",
      workedWithHcc: "yes",
      previousService: "Financial management advisory",
      submittedAt: "2026-04-12T09:00:00Z",
      tier: "tier3",
      status: "Routed",
      assignedTo: "Patricia M.",
      notes: "Connected with capital readiness program. Follow up April 20.",
    },
    {
      id: "mock-4",
      fullName: "Carlos Reyes",
      businessName: "Reyes Construction LLC",
      email: "carlos@reyesconstruction.com",
      phone: "917-555-0404",
      preferredContact: "email",
      businessStage: "under2",
      businessType: "Construction",
      employeeCount: "1-2",
      borough: "Manhattan",
      neighborhood: "Washington Heights",
      supportNeeds: ["legal", "financial"],
      biggestChallenge: "Understanding permits and licenses for NYC construction.",
      urgency: "soon",
      workedWithHcc: "not-sure",
      previousService: "",
      submittedAt: "2026-04-11T16:45:00Z",
      tier: "tier2",
      status: "New",
      assignedTo: "",
      notes: "",
    },
    {
      id: "mock-5",
      fullName: "Fatima Diallo",
      businessName: "Diallo African Fashion",
      email: "fatima@diallodesigns.com",
      phone: "212-555-0505",
      preferredContact: "email",
      businessStage: "2to5",
      businessType: "Retail & Fashion",
      employeeCount: "3-5",
      borough: "Manhattan",
      neighborhood: "Harlem",
      supportNeeds: ["technology", "marketing", "sales"],
      biggestChallenge: "Moving from in-person only to also selling online.",
      urgency: "months",
      workedWithHcc: "yes",
      previousService: "Marketing workshop",
      submittedAt: "2026-04-10T11:20:00Z",
      tier: "tier3",
      status: "In Review",
      assignedTo: "James W.",
      notes: "Great fit for e-commerce technical assistance.",
    },
  ];
}
