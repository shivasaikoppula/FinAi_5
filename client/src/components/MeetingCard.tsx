import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, MapPin, Users, Mountain, Tent, Compass } from "lucide-react";
import { format } from "date-fns";

interface Participant {
  name: string;
  timezone: string;
  avatar?: string;
}

interface MeetingCardProps {
  id: string;
  title: string;
  type: "hike" | "climb" | "camp" | "meeting";
  date: Date;
  time: string;
  timezone: string;
  participants: Participant[];
  location?: string;
}

const typeIcons = {
  hike: Mountain,
  climb: Compass,
  camp: Tent,
  meeting: Users,
};

const typeColors = {
  hike: "bg-primary/10 text-primary",
  climb: "bg-chart-2/10 text-chart-2",
  camp: "bg-chart-3/10 text-chart-3",
  meeting: "bg-chart-4/10 text-chart-4",
};

export default function MeetingCard({
  id,
  title,
  type,
  date,
  time,
  timezone,
  participants,
  location,
}: MeetingCardProps) {
  const Icon = typeIcons[type];

  const handleCardClick = () => {
    console.log(`Meeting ${id} clicked`);
  };

  return (
    <Card
      className="hover-elevate active-elevate-2 cursor-pointer transition-all"
      onClick={handleCardClick}
      data-testid={`card-meeting-${id}`}
    >
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`p-2 rounded-md ${typeColors[type]}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate" data-testid={`text-meeting-title-${id}`}>
              {title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {format(date, "MMM d, yyyy")}
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="shrink-0">
          {type}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono">{time}</span>
          <span className="text-muted-foreground">{timezone}</span>
        </div>
        
        {location && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{location}</span>
          </div>
        )}

        <div className="flex items-center gap-2 pt-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <div className="flex -space-x-2">
            {participants.slice(0, 3).map((participant, idx) => (
              <Avatar key={idx} className="h-8 w-8 border-2 border-background">
                <AvatarImage src={participant.avatar} />
                <AvatarFallback className="text-xs bg-primary/10">
                  {participant.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
            ))}
            {participants.length > 3 && (
              <div className="h-8 w-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-medium">
                +{participants.length - 3}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
