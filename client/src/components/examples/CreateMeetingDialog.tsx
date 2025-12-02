import { useState } from 'react'
import CreateMeetingDialog from '../CreateMeetingDialog'
import { Button } from '@/components/ui/button'

export default function CreateMeetingDialogExample() {
  const [open, setOpen] = useState(false)
  
  return (
    <div className="p-4">
      <Button onClick={() => setOpen(true)}>Open Dialog</Button>
      <CreateMeetingDialog open={open} onOpenChange={setOpen} />
    </div>
  )
}
