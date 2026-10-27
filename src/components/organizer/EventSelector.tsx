"use client";

import { CalendarDays, ChevronDown } from "lucide-react";

export const organizerEvents = [
  "Ho Chi Minh City Marathon 2026",
  "Campus Run powered by FPTU",
  "Mekong Delta Half Marathon",
];

export function EventSelector({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <label className="relative inline-flex w-full md:w-[360px]">
    <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-500" />
    <select value={value} onChange={(event) => onChange(event.target.value)} className="h-12 w-full appearance-none rounded-xl border border-orange-200 bg-white pl-10 pr-10 text-sm font-bold text-slate-800 shadow-sm outline-none focus:ring-2 focus:ring-orange-100">
      {organizerEvents.map((event) => <option key={event}>{event}</option>)}
    </select>
    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
  </label>;
}
