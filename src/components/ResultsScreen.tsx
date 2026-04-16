import type { IntakeFormData, TierResult } from "@/lib/types";
import { determineTier } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, ArrowRight, Sparkles, Target, Rocket } from "lucide-react";

interface ResultsScreenProps {
  data: IntakeFormData;
}

const tierIcons = {
  tier1: Sparkles,
  tier2: Target,
  tier3: Rocket,
};

const tierColors = {
  tier1: "text-tier-1 bg-tier-1/10 border-tier-1/20",
  tier2: "text-tier-2 bg-tier-2/10 border-tier-2/20",
  tier3: "text-tier-3 bg-tier-3/10 border-tier-3/20",
};

export function ResultsScreen({ data }: ResultsScreenProps) {
  const result: TierResult = determineTier(data);
  const Icon = tierIcons[result.tier];
  const colorClasses = tierColors[result.tier];

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Confirmation */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <div className="bg-primary/5 border-b border-primary/10 p-6 text-center">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-success/10 mb-4">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <h2 className="text-xl font-heading font-semibold text-foreground">Thank You, {data.fullName.split(" ")[0]}!</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            We received your request and will follow up with next steps. Here's what we recommend based on your answers.
          </p>
        </div>

        <CardContent className="p-6 sm:p-8 space-y-6">
          {/* Tier Badge */}
          <div className={`rounded-xl border-2 p-6 ${colorClasses}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background/80">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider opacity-70">Recommended Path</p>
                <h3 className="text-lg font-heading font-bold">{result.label}</h3>
              </div>
            </div>
            <p className="text-sm font-medium">{result.tagline}</p>
          </div>

          {/* Why */}
          <div>
            <h4 className="font-medium text-foreground mb-2">Why this path?</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">{result.reason}</p>
          </div>

          {/* Examples */}
          <div>
            <h4 className="font-medium text-foreground mb-3">What to expect</h4>
            <ul className="space-y-2">
              {result.examples.map((ex) => (
                <li key={ex} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <ArrowRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  {ex}
                </li>
              ))}
            </ul>
          </div>

          {/* Next Step */}
          <div className="rounded-lg bg-muted/50 p-4">
            <h4 className="font-medium text-foreground mb-1">Next Step</h4>
            <p className="text-sm text-muted-foreground">{result.nextStep}</p>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <Link to="/">
          <Button variant="outline" className="gap-2">Back to Home</Button>
        </Link>
      </div>
    </div>
  );
}
