import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";

interface CreateMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateMeetingDialog({
  open,
  onOpenChange,
}: CreateMeetingDialogProps) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [type, setType] = useState("");
  const [participants, setParticipants] = useState<string[]>([]);
  const [newParticipant, setNewParticipant] = useState("");

  const handleAddParticipant = () => {
    if (newParticipant.trim()) {
      setParticipants([...participants, newParticipant.trim()]);
      setNewParticipant("");
    }
  };

  const handleRemoveParticipant = (index: number) => {
    setParticipants(participants.filter((_, i) => i !== index));
  };

  const handleCreate = () => {
    console.log('Creating meeting:', { title, date, time, type, participants });
    onOpenChange(false);
    setTitle("");
    setDate("");
    setTime("");
    setType("");
    setParticipants([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" data-testid="dialog-create-meeting">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Create New Meeting</DialogTitle>
          <DialogDescription>
            Schedule your next adventure or team sync across timezones
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Meeting Title</Label>
            <Input
              id="title"
              placeholder="Summit Planning Session"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              data-testid="input-meeting-title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Meeting Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger data-testid="select-meeting-type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hike">Hike</SelectItem>
                <SelectItem value="climb">Climb</SelectItem>
                <SelectItem value="camp">Camp</SelectItem>
                <SelectItem value="meeting">Meeting</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                data-testid="input-meeting-date"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                data-testid="input-meeting-time"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Participants</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter email"
                value={newParticipant}
                onChange={(e) => setNewParticipant(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddParticipant()}
                data-testid="input-participant-email"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={handleAddParticipant}
                data-testid="button-add-participant"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {participants.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {participants.map((participant, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="gap-1"
                    data-testid={`badge-participant-${idx}`}
                  >
                    {participant}
                    <button
                      onClick={() => handleRemoveParticipant(idx)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!title || !date || !time || !type}
            data-testid="button-create-meeting"
          >
            Create Meeting
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
