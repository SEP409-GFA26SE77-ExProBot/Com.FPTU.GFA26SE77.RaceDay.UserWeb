import EventPermitRegistration from "@/components/organizer/EventPermitRegistration";

export default function EventRegistrationPage() {
  return (
    <EventPermitRegistration
      backHref="/my-events"
      backLabel="Quay lại giải của tôi"
    />
  );
}
