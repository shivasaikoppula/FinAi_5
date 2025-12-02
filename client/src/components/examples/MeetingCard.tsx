import MeetingCard from '../MeetingCard'

export default function MeetingCardExample() {
  return (
    <div className="p-4 max-w-sm">
      <MeetingCard
        id="1"
        title="Summit Planning Session"
        type="hike"
        date={new Date(2025, 11, 28)}
        time="09:00 AM"
        timezone="PST"
        location="Virtual"
        participants={[
          { name: "Alex Chen", timezone: "PST" },
          { name: "Sarah Kim", timezone: "EST" },
          { name: "Max Weber", timezone: "CET" },
          { name: "Yuki Tanaka", timezone: "JST" }
        ]}
      />
    </div>
  )
}
