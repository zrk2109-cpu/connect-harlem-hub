import { useState, useCallback } from "react";
import { toast } from "sonner";
import type { IntakeFormData } from "@/lib/types";
import { SUPPORT_OPTIONS, BUSINESS_STAGES, URGENCY_OPTIONS, BOROUGHS, EMPLOYEE_COUNTS, determineTier } from "@/lib/types";
import { getEmptyForm, saveFormProgress, loadFormProgress, clearFormProgress, addSubmission } from "@/lib/store";
import { submitToAirtable } from "@/server/airtable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, ChevronLeft, ChevronRight, Send, AlertCircle } from "lucide-react";

const TOTAL_STEPS = 6;

interface IntakeFormProps {
  onComplete: (data: IntakeFormData) => void;
}

export function IntakeForm({ onComplete }: IntakeFormProps) {
  const saved = loadFormProgress();
  const [step, setStep] = useState(saved?.step ?? 1);
  const [form, setForm] = useState<IntakeFormData>(saved?.data ?? getEmptyForm());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = useCallback(<K extends keyof IntakeFormData>(key: K, value: IntakeFormData[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      saveFormProgress(next, step);
      return next;
    });
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, [step]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (step === 1) {
      if (!form.fullName.trim()) errs.fullName = "Please enter your name";
      if (!form.email.trim()) errs.email = "Please enter your email";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Please enter a valid email";
      if (!form.preferredContact) errs.preferredContact = "Please select a contact method";
    }
    if (step === 2) {
      if (!form.businessStage) errs.businessStage = "Please select your business stage";
    }
    if (step === 3) {
      if (form.supportNeeds.length === 0) errs.supportNeeds = "Please select at least one area of support";
    }
    if (step === 4) {
      if (!form.urgency) errs.urgency = "Please select how urgent your need is";
    }
    if (step === 5) {
      if (!form.workedWithHcc) errs.workedWithHcc = "Please select an option";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const next = () => {
    if (!validate()) return;
    const newStep = Math.min(step + 1, TOTAL_STEPS);
    setStep(newStep);
    saveFormProgress(form, newStep);
  };

  const back = () => {
    const newStep = Math.max(step - 1, 1);
    setStep(newStep);
    saveFormProgress(form, newStep);
  };

  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    const tierResult = determineTier(form);
    try {
      await submitToAirtable({
        data: {
          fullName: form.fullName,
          businessName: form.businessName,
          email: form.email,
          phone: form.phone,
          preferredContact: form.preferredContact,
          businessStage: form.businessStage,
          businessType: form.businessType,
          employeeCount: form.employeeCount,
          borough: form.borough,
          neighborhood: form.neighborhood,
          supportNeeds: form.supportNeeds,
          biggestChallenge: form.biggestChallenge,
          urgency: form.urgency,
          workedWithHcc: form.workedWithHcc,
          previousService: form.previousService,
          tier: tierResult.tier,
        },
      });
      addSubmission(form);
      clearFormProgress();
      toast.success("Thank you! We received your request.");
      onComplete(form);
    } catch (err) {
      console.error("Airtable submission failed:", err);
      toast.error(
        err instanceof Error
          ? `Submission failed: ${err.message}`
          : "Submission failed. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const toggleNeed = (value: string) => {
    setForm((prev) => {
      const needs = prev.supportNeeds.includes(value)
        ? prev.supportNeeds.filter((n) => n !== value)
        : prev.supportNeeds.length < 3
          ? [...prev.supportNeeds, value]
          : prev.supportNeeds;
      const next = { ...prev, supportNeeds: needs };
      saveFormProgress(next, step);
      return next;
    });
    setErrors((prev) => {
      const next = { ...prev };
      delete next.supportNeeds;
      return next;
    });
  };

  const progressPercent = ((step - 1) / (TOTAL_STEPS - 1)) * 100;

  const stepLabels = ["About You", "Your Business", "Support Needs", "Challenges", "Experience", "Review"];

  const FieldError = ({ name }: { name: string }) =>
    errors[name] ? (
      <p className="flex items-center gap-1 text-sm text-destructive mt-1">
        <AlertCircle className="h-3.5 w-3.5" />
        {errors[name]}
      </p>
    ) : null;

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-medium text-muted-foreground">
            Step {step} of {TOTAL_STEPS}
          </span>
          <span className="text-sm font-medium text-primary">{stepLabels[step - 1]}</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
        <div className="flex justify-between mt-2">
          {stepLabels.map((label, i) => (
            <span
              key={label}
              className={`text-xs hidden sm:inline ${i < step ? "text-primary font-medium" : "text-muted-foreground"}`}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      <Card className="border-0 shadow-lg">
        <CardContent className="p-6 sm:p-8">
          {/* Step 1: About You */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-heading font-semibold text-foreground">About You</h2>
                <p className="text-sm text-muted-foreground mt-1">Let's start with some basic information so we can reach you.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input id="fullName" placeholder="Your full name" value={form.fullName} onChange={(e) => update("fullName", e.target.value)} className="mt-1.5" />
                  <FieldError name="fullName" />
                </div>
                <div>
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input id="businessName" placeholder="If you have one" value={form.businessName} onChange={(e) => update("businessName", e.target.value)} className="mt-1.5" />
                  <p className="text-xs text-muted-foreground mt-1">Leave blank if you haven't named your business yet.</p>
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" type="email" placeholder="your@email.com" value={form.email} onChange={(e) => update("email", e.target.value)} className="mt-1.5" />
                  <FieldError name="email" />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" type="tel" placeholder="(212) 555-0100" value={form.phone} onChange={(e) => update("phone", e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <Label>Preferred Contact Method *</Label>
                  <RadioGroup value={form.preferredContact} onValueChange={(v) => update("preferredContact", v as IntakeFormData["preferredContact"])} className="mt-2 grid grid-cols-3 gap-3">
                    {[
                      { value: "email", label: "Email" },
                      { value: "phone", label: "Phone" },
                      { value: "text", label: "Text" },
                    ].map((opt) => (
                      <label key={opt.value} className={`flex items-center gap-2 rounded-lg border p-3 cursor-pointer transition-colors ${form.preferredContact === opt.value ? "border-primary bg-primary/5" : "border-input hover:border-primary/40"}`}>
                        <RadioGroupItem value={opt.value} />
                        <span className="text-sm">{opt.label}</span>
                      </label>
                    ))}
                  </RadioGroup>
                  <FieldError name="preferredContact" />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: About Your Business */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-heading font-semibold text-foreground">About Your Business</h2>
                <p className="text-sm text-muted-foreground mt-1">Tell us where your business is today so we can find the right fit.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <Label>Business Stage *</Label>
                  <RadioGroup value={form.businessStage} onValueChange={(v) => update("businessStage", v)} className="mt-2 space-y-2">
                    {BUSINESS_STAGES.map((stage) => (
                      <label key={stage.value} className={`flex items-center gap-3 rounded-lg border p-3.5 cursor-pointer transition-colors ${form.businessStage === stage.value ? "border-primary bg-primary/5" : "border-input hover:border-primary/40"}`}>
                        <RadioGroupItem value={stage.value} />
                        <span className="text-sm">{stage.label}</span>
                      </label>
                    ))}
                  </RadioGroup>
                  <FieldError name="businessStage" />
                </div>
                <div>
                  <Label htmlFor="businessType">Business Type / Industry</Label>
                  <Input id="businessType" placeholder="e.g. Food & Beverage, Retail, Tech" value={form.businessType} onChange={(e) => update("businessType", e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <Label>Number of Employees</Label>
                  <Select value={form.employeeCount} onValueChange={(v) => update("employeeCount", v)}>
                    <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {EMPLOYEE_COUNTS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Borough</Label>
                  <Select value={form.borough} onValueChange={(v) => update("borough", v)}>
                    <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select borough" /></SelectTrigger>
                    <SelectContent>
                      {BOROUGHS.map((b) => (
                        <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="neighborhood">Neighborhood</Label>
                  <Input id="neighborhood" placeholder="e.g. Harlem, Williamsburg" value={form.neighborhood} onChange={(e) => update("neighborhood", e.target.value)} className="mt-1.5" />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Support Needs */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-heading font-semibold text-foreground">What Kind of Support Do You Need?</h2>
                <p className="text-sm text-muted-foreground mt-1">Select up to 3 areas where you'd like help. Don't worry — you can always update this later.</p>
              </div>
              <div className="space-y-2">
                {SUPPORT_OPTIONS.map((opt) => {
                  const selected = form.supportNeeds.includes(opt.value);
                  const disabled = !selected && form.supportNeeds.length >= 3;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={disabled}
                      onClick={() => toggleNeed(opt.value)}
                      className={`w-full text-left rounded-lg border p-4 transition-all ${
                        selected
                          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                          : disabled
                            ? "border-input opacity-50 cursor-not-allowed"
                            : "border-input hover:border-primary/40 cursor-pointer"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${selected ? "bg-primary border-primary" : "border-muted-foreground/30"}`}>
                          {selected && <Check className="h-3.5 w-3.5 text-primary-foreground" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{opt.label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <FieldError name="supportNeeds" />
              <p className="text-xs text-muted-foreground">{form.supportNeeds.length}/3 selected</p>
            </div>
          )}

          {/* Step 4: Challenges */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-heading font-semibold text-foreground">Current Challenges</h2>
                <p className="text-sm text-muted-foreground mt-1">Help us understand what's on your mind right now.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="challenge">What is the biggest challenge your business is facing right now?</Label>
                  <Textarea
                    id="challenge"
                    placeholder="Tell us in your own words — there's no wrong answer."
                    value={form.biggestChallenge}
                    onChange={(e) => update("biggestChallenge", e.target.value)}
                    className="mt-1.5 min-h-[100px]"
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-right">{form.biggestChallenge.length}/500</p>
                </div>
                <div>
                  <Label>How urgent is your need? *</Label>
                  <RadioGroup value={form.urgency} onValueChange={(v) => update("urgency", v)} className="mt-2 space-y-2">
                    {URGENCY_OPTIONS.map((opt) => (
                      <label key={opt.value} className={`flex items-center gap-3 rounded-lg border p-3.5 cursor-pointer transition-colors ${form.urgency === opt.value ? "border-primary bg-primary/5" : "border-input hover:border-primary/40"}`}>
                        <RadioGroupItem value={opt.value} />
                        <span className="text-sm">{opt.label}</span>
                      </label>
                    ))}
                  </RadioGroup>
                  <FieldError name="urgency" />
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Experience with HCC */}
          {step === 5 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-heading font-semibold text-foreground">Your Experience with HCC</h2>
                <p className="text-sm text-muted-foreground mt-1">Let us know if you've worked with us or our partners before.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <Label>Have you worked with HCC, HEF, or SBS before? *</Label>
                  <RadioGroup value={form.workedWithHcc} onValueChange={(v) => update("workedWithHcc", v)} className="mt-2 space-y-2">
                    {[
                      { value: "yes", label: "Yes" },
                      { value: "no", label: "No" },
                      { value: "not-sure", label: "Not sure" },
                    ].map((opt) => (
                      <label key={opt.value} className={`flex items-center gap-3 rounded-lg border p-3.5 cursor-pointer transition-colors ${form.workedWithHcc === opt.value ? "border-primary bg-primary/5" : "border-input hover:border-primary/40"}`}>
                        <RadioGroupItem value={opt.value} />
                        <span className="text-sm">{opt.label}</span>
                      </label>
                    ))}
                  </RadioGroup>
                  <FieldError name="workedWithHcc" />
                </div>
                {form.workedWithHcc === "yes" && (
                  <div>
                    <Label htmlFor="previousService">What type of service did you use before?</Label>
                    <Input id="previousService" placeholder="e.g. Business planning workshop, financial coaching" value={form.previousService} onChange={(e) => update("previousService", e.target.value)} className="mt-1.5" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 6: Review */}
          {step === 6 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-heading font-semibold text-foreground">Review Your Information</h2>
                <p className="text-sm text-muted-foreground mt-1">Take a moment to review everything before submitting.</p>
              </div>
              <div className="space-y-4 text-sm">
                <ReviewSection title="About You">
                  <ReviewItem label="Name" value={form.fullName} />
                  <ReviewItem label="Business" value={form.businessName || "—"} />
                  <ReviewItem label="Email" value={form.email} />
                  <ReviewItem label="Phone" value={form.phone || "—"} />
                  <ReviewItem label="Contact Method" value={form.preferredContact} />
                </ReviewSection>
                <ReviewSection title="Your Business">
                  <ReviewItem label="Stage" value={BUSINESS_STAGES.find((s) => s.value === form.businessStage)?.label || "—"} />
                  <ReviewItem label="Industry" value={form.businessType || "—"} />
                  <ReviewItem label="Employees" value={form.employeeCount || "—"} />
                  <ReviewItem label="Location" value={[form.neighborhood, form.borough].filter(Boolean).join(", ") || "—"} />
                </ReviewSection>
                <ReviewSection title="Support Needs">
                  <div className="flex flex-wrap gap-2">
                    {form.supportNeeds.map((need) => (
                      <span key={need} className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                        {SUPPORT_OPTIONS.find((o) => o.value === need)?.label}
                      </span>
                    ))}
                  </div>
                </ReviewSection>
                <ReviewSection title="Challenges">
                  <ReviewItem label="Biggest Challenge" value={form.biggestChallenge || "—"} />
                  <ReviewItem label="Urgency" value={URGENCY_OPTIONS.find((u) => u.value === form.urgency)?.label || "—"} />
                </ReviewSection>
                <ReviewSection title="HCC Experience">
                  <ReviewItem label="Worked with HCC" value={form.workedWithHcc === "yes" ? "Yes" : form.workedWithHcc === "no" ? "No" : "Not sure"} />
                  {form.workedWithHcc === "yes" && <ReviewItem label="Previous Service" value={form.previousService || "—"} />}
                </ReviewSection>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            {step > 1 ? (
              <Button variant="outline" onClick={back} className="gap-2">
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
            ) : (
              <div />
            )}
            {step < TOTAL_STEPS ? (
              <Button onClick={next} className="gap-2">
                Continue <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button variant="hero" onClick={submit} size="lg" className="gap-2" disabled={submitting}>
                <Send className="h-4 w-4" /> {submitting ? "Submitting..." : "Submit My Request"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-muted/50 p-4">
      <h3 className="font-medium text-foreground mb-2">{title}</h3>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-muted-foreground shrink-0">{label}:</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}
