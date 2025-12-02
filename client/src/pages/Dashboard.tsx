import { useState } from "react";
import Navbar from "@/components/Navbar";
import MeetingCard from "@/components/MeetingCard";
import EmptyState from "@/components/EmptyState";
import CreateMeetingDialog from "@/components/CreateMeetingDialog";
import TimezoneDisplay from "@/components/TimezoneDisplay";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Calendar, Clock } from "lucide-react";

export default function Dashboard() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  
  const meetings = [
    {
      id: "1",
      title: "Summit Planning Session",
      type: "hike" as const,
      date: new Date(2025, 11, 28),
      time: "09:00 AM",
      timezone: "PST",
      location: "Virtual",
      participants: [
        { name: "Alex Chen", timezone: "PST" },
        { name: "Sarah Kim", timezone: "EST" },
        { name: "Max Weber", timezone: "CET" },
      ]
    },
    {
      id: "2",
      title: "Gear Review & Preparation",
      type: "climb" as const,
      date: new Date(2025, 11, 30),
      time: "14:00 PM",
      timezone: "EST",
      location: "Zoom",
      participants: [
        { name: "Jordan Lee", timezone: "PST" },
        { name: "Emma Stone", timezone: "GMT" },
      ]
    },
    {
      id: "3",
      title: "Base Camp Coordination",
      type: "camp" as const,
      date: new Date(2026, 0, 5),
      time: "10:30 AM",
      timezone: "CET",
      participants: [
        { name: "Lucas Schmidt", timezone: "CET" },
        { name: "Nina Patel", timezone: "IST" },
        { name: "Tom Anderson", timezone: "PST" },
        { name: "Sofia Rodriguez", timezone: "ART" },
      ]
    },
  ];

  const timezones = [
    { location: "San Francisco", timezone: "PST", time: "09:00 AM", offset: "UTC-8" },
    { location: "New York", timezone: "EST", time: "12:00 PM", offset: "UTC-5" },
    { location: "London", timezone: "GMT", time: "05:00 PM", offset: "UTC+0" },
    { location: "Tokyo", timezone: "JST", time: "02:00 AM", offset: "UTC+9" },
  ];

  const handleCreateMeeting = () => {
    setCreateDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-serif font-bold text-3xl md:text-4xl mb-2">
              Your Adventures
            </h1>
            <p className="text-muted-foreground">
              Manage your meetings and expeditions across timezones
            </p>
          </div>
          <Button
            onClick={handleCreateMeeting}
            className="gap-2"
            data-testid="button-create-meeting"
          >
            <Plus className="h-4 w-4" />
            Create Meeting
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Upcoming Meetings
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{meetings.length}</div>
              <p className="text-xs text-muted-foreground">
                Next in 2 days
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Participants
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">
                Across 8 timezones
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                This Month
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">
                Meetings scheduled
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="font-serif font-semibold text-xl">Upcoming Meetings</h2>
            {meetings.length > 0 ? (
              <div className="grid gap-4">
                {meetings.map((meeting) => (
                  <MeetingCard key={meeting.id} {...meeting} />
                ))}
              </div>
            ) : (
              <EmptyState onCreateMeeting={handleCreateMeeting} />
            )}
          </div>

          <div className="space-y-4">
            <h2 className="font-serif font-semibold text-xl">World Clock</h2>
            <TimezoneDisplay timezones={timezones} />
          </div>
        </div>
      </div>

      <CreateMeetingDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  );
}
