export interface IntakeFormData {
  // Step 1
  fullName: string;
  businessName: string;
  email: string;
  phone: string;
  preferredContact: "email" | "phone" | "text" | "";

  // Step 2
  businessStage: string;
  businessType: string;
  employeeCount: string;
  borough: string;

  // Step 3
  supportNeeds: string[];

  // Step 4
  biggestChallenge: string;
  urgency: string;

  // Step 5
  workedWithHcc: string;
  previousService: string;
}

export type SupportTier = "tier1" | "tier2" | "tier3";

export interface TierResult {
  tier: SupportTier;
  label: string;
  tagline: string;
  reason: string;
  nextStep: string;
  examples: string[];
}

export type SubmissionStatus = "New" | "In Review" | "Routed" | "Closed";

export interface Submission extends IntakeFormData {
  id: string;
  submittedAt: string;
  tier: SupportTier;
  status: SubmissionStatus;
  assignedTo: string;
  notes: string;
}

export const SUPPORT_OPTIONS = [
  { value: "planning", label: "Business Planning & Strategy Support", description: "Help creating or refining your business plan, setting goals, and mapping out your next steps." },
  { value: "financial", label: "Financial Management & Accounting Support", description: "Help with bookkeeping, budgeting, cash flow, and understanding your numbers." },
  { value: "capital", label: "Access to Capital & Financing Support", description: "Help finding loans, grants, investors, or other funding for your business." },
  { value: "workforce", label: "People, Hiring & Workforce Support", description: "Help with hiring, managing employees, payroll, and building your team." },
  { value: "marketing", label: "Marketing & Customer Outreach Support", description: "Help getting the word out, branding, social media, and reaching more customers." },
  { value: "sales", label: "Sales & Revenue Growth Support", description: "Help increasing sales, pricing your products or services, and growing revenue." },
  { value: "operations", label: "Operations & Day-to-Day Business Support", description: "Help with inventory, supply chain, processes, and running things more smoothly." },
  { value: "legal", label: "Legal, Compliance & Contracts Support", description: "Help with business registration, permits, contracts, and staying compliant." },
  { value: "technology", label: "Technology & Digital Tools Support", description: "Help with websites, software, online tools, and using technology to grow." },
  { value: "other", label: "Other", description: "Something else not listed above — tell us more in the next step." },
] as const;

export const BUSINESS_STAGES = [
  { value: "idea", label: "Idea stage" },
  { value: "prelaunch", label: "Pre-launch" },
  { value: "under2", label: "Less than 2 years operating" },
  { value: "2to5", label: "2–5 years operating" },
  { value: "established", label: "Established and growing" },
] as const;

export const URGENCY_OPTIONS = [
  { value: "soon", label: "Need help soon" },
  { value: "months", label: "Need help in the next few months" },
  { value: "exploring", label: "Just exploring options" },
] as const;

export function determineTier(data: IntakeFormData): TierResult {
  const stage = data.businessStage;
  const needs = data.supportNeeds;

  // Tier 1: Very early stage or mainly education needs
  if (
    stage === "idea" ||
    stage === "prelaunch" ||
    (stage === "under2" && needs.length <= 1 && (needs.includes("planning") || needs.includes("legal")))
  ) {
    return {
      tier: "tier1",
      label: "Foundational Access",
      tagline: "Building your business foundation",
      reason: "Based on your business stage and needs, we recommend starting with our foundational programs. These are designed to help you build a strong base before scaling.",
      nextStep: "A member of our team will reach out within 3–5 business days to schedule an introductory session and connect you with upcoming workshops.",
      examples: [
        "Free business planning workshops",
        "One-on-one startup coaching sessions",
        "Legal basics & business registration guidance",
        "Financial literacy and budgeting classes",
      ],
    };
  }

  // Tier 3: Established businesses with deep needs
  if (
    stage === "established" ||
    (stage === "2to5" && needs.length >= 3) ||
    (stage === "2to5" && (needs.includes("capital") || needs.includes("workforce")))
  ) {
    return {
      tier: "tier3",
      label: "Ongoing Support",
      tagline: "Sustained growth partnership",
      reason: "Your business is at a stage where deeper, ongoing support can make the biggest impact. We'll pair you with dedicated advisors for sustained guidance.",
      nextStep: "A senior advisor will contact you within 2–3 business days to discuss your goals and set up a recurring support plan.",
      examples: [
        "Dedicated business advisor assignments",
        "Access to capital readiness programs",
        "Advanced financial management consulting",
        "Workforce development and hiring support",
        "Long-term strategic planning sessions",
      ],
    };
  }

  // Tier 2: Default — operating businesses needing targeted help
  return {
    tier: "tier2",
    label: "Targeted Support",
    tagline: "Focused help where you need it most",
    reason: "Your business is up and running and could benefit from targeted expertise in specific areas. We'll connect you with the right specialists.",
    nextStep: "An HCC advisor will reach out within 3–5 business days to match you with the right technical assistance program.",
    examples: [
      "One-on-one advisory sessions with subject matter experts",
      "Marketing and branding technical assistance",
      "Technology adoption and digital tools training",
      "Operations improvement consulting",
      "Sales strategy and revenue growth coaching",
    ],
  };
}
