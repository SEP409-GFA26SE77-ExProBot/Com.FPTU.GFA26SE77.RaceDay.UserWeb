export interface DashboardCount {
  status: string;
  count: number;
}
export interface DailyCount {
  date: string;
  count: number;
}
export interface OrganizerEventWorkDto {
  eventId: string;
  name: string;
  status: string;
  eventDate: string;
  pendingRegistrations: number;
  pendingComplaints: number;
  pendingTasks: number;
}
export interface OrganizerDashboardDto {
  totalEvents: number;
  eventsByStatus: DashboardCount[];
  pendingRegistrations: number;
  pendingComplaints: number;
  upcomingEvents: OrganizerEventWorkDto[];
  eventsWithPendingTasks: OrganizerEventWorkDto[];
  generatedAtUtc: string;
}
export interface EventDashboardDto {
  eventId: string;
  totalRegistrations: number;
  registrationsByStatus: DashboardCount[];
  checkInSummary: { eligible: number; checkedIn: number };
  raceByStatus: DashboardCount[];
  pendingComplaints: number;
  distances: {
    distanceId: string;
    name: string;
    capacity: number;
    reservedSlots: number;
    confirmedRegistrations: number;
  }[];
  preparation: {
    totalDistances: number;
    distancesWithBib: number;
    missingDocumentKeys: string[];
    coursesReady: number;
    coursesWithCheckpoints: number;
    activeStaff: number;
    assignedStaff: number;
  };
  generatedAtUtc: string;
}
export interface RegistrationTrendDto {
  eventId: string;
  from: string;
  to: string;
  timeZone: string;
  generatedAtUtc: string;
  totalRegistrations: number;
  days: DailyCount[];
  distances: { distanceId: string; name: string; days: DailyCount[] }[];
}
export interface RevenueTrendDto {
  eventId: string | null;
  from: string;
  to: string;
  timeZone: string;
  generatedAtUtc: string;
  series: {
    currency: string;
    totalCollected: number;
    totalRefunded: number;
    netCashFlow: number;
    days: {
      date: string;
      collected: number;
      refunded: number;
      netCashFlow: number;
    }[];
  }[];
}
