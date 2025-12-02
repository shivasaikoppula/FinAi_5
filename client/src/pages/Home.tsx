import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="font-serif font-bold text-3xl md:text-4xl mb-4">
            Why Adventure Teams Choose Us
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Built for outdoor enthusiasts, expedition planners, and global teams who refuse to let timezones slow them down
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-serif font-semibold text-xl">Automatic Conversion</h3>
              <ul className="space-y-3">
                {[
                  "See meeting times in everyone's local timezone",
                  "Visual timeline showing optimal meeting windows",
                  "Conflict detection for overlapping schedules",
                  "Support for 400+ timezones worldwide"
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-serif font-semibold text-xl">Smart Reminders</h3>
              <ul className="space-y-3">
                {[
                  "Email notifications before each meeting",
                  "Customizable reminder timing",
                  "Automatic timezone adjustment for travelers",
                  "Integration with calendar apps"
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="bg-primary/5 rounded-xl p-8 md:p-12 text-center">
          <h2 className="font-serif font-bold text-3xl mb-4">
            Ready to Plan Your Next Adventure?
          </h2>
          <p className="text-muted-foreground mb-6 text-lg">
            Join thousands of teams coordinating across continents
          </p>
          <Button size="lg" className="gap-2" data-testid="button-cta-signup">
            Start Free Today
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </section>

      <footer className="border-t bg-muted/30 mt-16">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 AdventureSync. Making global coordination effortless.</p>
        </div>
      </footer>
    </div>
  );
}
