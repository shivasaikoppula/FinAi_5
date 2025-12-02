import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";

interface TimezoneInfo {
  location: string;
  timezone: string;
  time: string;
  offset: string;
}

interface TimezoneDisplayProps {
  timezones: TimezoneInfo[];
}

export default function TimezoneDisplay({ timezones }: TimezoneDisplayProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Participant Timezones
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {timezones.map((tz, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-3 rounded-md bg-muted/50"
            data-testid={`timezone-${idx}`}
          >
            <div>
              <p className="font-medium">{tz.location}</p>
              <p className="text-sm text-muted-foreground">{tz.timezone}</p>
            </div>
            <div className="text-right">
              <p className="font-mono font-semibold">{tz.time}</p>
              <p className="text-sm text-muted-foreground">{tz.offset}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
