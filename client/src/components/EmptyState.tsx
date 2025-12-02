import { Button } from "@/components/ui/button";
import { Compass, Plus } from "lucide-react";

interface EmptyStateProps {
  onCreateMeeting?: () => void;
}

export default function EmptyState({ onCreateMeeting }: EmptyStateProps) {
  const handleCreate = () => {
    console.log('Create meeting clicked');
    onCreateMeeting?.();
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <Compass className="h-12 w-12 text-primary" />
      </div>
      <h3 className="font-serif font-semibold text-2xl mb-2">
        No Adventures Scheduled
      </h3>
      <p className="text-muted-foreground mb-6 max-w-md">
        Start planning your next expedition! Create a meeting to coordinate with your team across any timezone.
      </p>
      <Button onClick={handleCreate} className="gap-2" data-testid="button-create-first-meeting">
        <Plus className="h-4 w-4" />
        Create Your First Meeting
      </Button>
    </div>
  );
}
