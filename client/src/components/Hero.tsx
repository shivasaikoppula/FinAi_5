import { Button } from "@/components/ui/button";
import { ArrowRight, Globe, Users, Clock } from "lucide-react";
import heroImage from '@assets/generated_images/mountain_summit_adventure_hero.png';

export default function Hero() {
  const handleGetStarted = () => {
    console.log('Get started clicked');
    window.location.href = '/dashboard';
  };

  return (
    <div className="relative">
      <div
        className="h-[600px] bg-cover bg-center relative"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />
        
        <div className="relative h-full max-w-7xl mx-auto px-6 flex flex-col items-center justify-center text-center">
          <h1 className="font-serif font-bold text-5xl md:text-6xl text-white mb-6">
            Plan Adventures Across<br />Any Time Zone
          </h1>
          <p className="text-xl text-white/90 mb-8 max-w-2xl">
            Coordinate meetings with your global team or adventure crew. 
            Smart timezone conversion makes scheduling effortless.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button
              size="lg"
              onClick={handleGetStarted}
              className="gap-2 bg-primary/90 backdrop-blur hover:bg-primary border border-primary-border"
              data-testid="button-get-started"
            >
              Get Started Free
              <ArrowRight className="h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="gap-2 bg-background/20 backdrop-blur border-white/30 text-white hover:bg-background/30"
              data-testid="button-learn-more"
            >
              Learn More
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-background border-b">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-md bg-primary/10 text-primary mb-4">
                <Globe className="h-6 w-6" />
              </div>
              <h3 className="font-serif font-semibold text-xl mb-2">Smart Timezone Magic</h3>
              <p className="text-muted-foreground">
                Automatically converts meeting times to all participants' local timezones
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-md bg-primary/10 text-primary mb-4">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="font-serif font-semibold text-xl mb-2">Timely Reminders</h3>
              <p className="text-muted-foreground">
                Get email notifications before meetings so you never miss an adventure
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-md bg-primary/10 text-primary mb-4">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="font-serif font-semibold text-xl mb-2">Team Collaboration</h3>
              <p className="text-muted-foreground">
                Coordinate with outdoor groups and remote teams across continents
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
