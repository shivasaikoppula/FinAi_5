import TimezoneDisplay from '../TimezoneDisplay'

export default function TimezoneDisplayExample() {
  return (
    <div className="p-4 max-w-md">
      <TimezoneDisplay
        timezones={[
          { location: "San Francisco", timezone: "PST", time: "09:00 AM", offset: "UTC-8" },
          { location: "New York", timezone: "EST", time: "12:00 PM", offset: "UTC-5" },
          { location: "London", timezone: "GMT", time: "05:00 PM", offset: "UTC+0" },
          { location: "Tokyo", timezone: "JST", time: "02:00 AM", offset: "UTC+9" }
        ]}
      />
    </div>
  )
}
