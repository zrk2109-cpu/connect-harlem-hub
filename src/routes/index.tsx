import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import type { IntakeFormData } from "@/lib/types";
import { IntakeForm } from "@/components/IntakeForm";
import { ResultsScreen } from "@/components/ResultsScreen";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Heart, Users, Lightbulb } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Harlem Commonwealth Council — Get the Right Support for Your Business" },
      { name: "description", content: "Answer a few questions so we can connect you to the best resources for your minority or women-owned small business." },
      { property: "og:title", content: "HCC — Get the Right Support for Your Business" },
      { property: "og:description", content: "One simple form to connect you with the right business support." },
    ],
  }),
  component: Index,
});

type View = "landing" | "form" | "results";

function Index() {
  const [view, setView] = useState<View>("landing");
  const [completedData, setCompletedData] = useState<IntakeFormData | null>(null);

  const handleComplete = (data: IntakeFormData) => {
    setCompletedData(data);
    setView("results");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <button onClick={() => setView("landing")} className="font-heading font-bold text-lg text-foreground tracking-tight">
            HCC
          </button>
          <nav className="flex items-center gap-4">
            <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Staff Dashboard
            </Link>
          </nav>
        </div>
      </header>

      {/* Landing View */}
      {view === "landing" && (
        <main>
          {/* Hero */}
          <section className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-warm/5" />
            <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
                <Heart className="h-4 w-4" /> Harlem Commonwealth Council
              </div>
              <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold text-foreground leading-tight max-w-3xl mx-auto">
                Get the Right Support for Your Business
              </h1>
              <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
                Answer a few questions so we can connect you to the best resources for your business. It takes about 5 minutes.
              </p>
              <Button
                variant="hero"
                size="lg"
                className="mt-8 gap-2 h-12 px-8 text-base rounded-xl"
                onClick={() => {
                  setView("form");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                Start Here <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </section>

          {/* Value Props */}
          <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
            <div className="grid sm:grid-cols-3 gap-6">
              {[
                {
                  icon: Users,
                  title: "Built for Our Community",
                  description: "Designed for minority and women-owned small businesses in Harlem and surrounding neighborhoods.",
                },
                {
                  icon: Lightbulb,
                  title: "Personalized Guidance",
                  description: "We match you with the right programs, advisors, and resources based on where your business is today.",
                },
                {
                  icon: Heart,
                  title: "No Cost to You",
                  description: "Our support programs are free. We're here to help your business succeed, no strings attached.",
                },
              ].map((prop) => (
                <div key={prop.title} className="rounded-xl bg-card border p-6 text-center">
                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 mb-4">
                    <prop.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-heading font-semibold text-foreground">{prop.title}</h3>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{prop.description}</p>
                </div>
              ))}
            </div>
          </section>
        </main>
      )}

      {/* Form View */}
      {view === "form" && (
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <IntakeForm onComplete={handleComplete} />
        </main>
      )}

      {/* Results View */}
      {view === "results" && completedData && (
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <ResultsScreen data={completedData} />
        </main>
      )}

      {/* Footer */}
      <footer className="border-t mt-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Harlem Commonwealth Council. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
