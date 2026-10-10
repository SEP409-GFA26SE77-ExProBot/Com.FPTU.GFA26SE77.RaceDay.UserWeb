import OrganizerPrototype from "@/components/organizer/OrganizerPrototype";

type ModuleKey = "events" | "registration" | "participants" | "race-day" | "results" | "photos";

const moduleKeys: ModuleKey[] = ["events", "registration", "participants", "race-day", "results", "photos"];

export default async function OrganizerModulePage({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  const selected = moduleKeys.includes(module as ModuleKey) ? (module as ModuleKey) : "events";
  return <OrganizerPrototype module={selected} />;
}
