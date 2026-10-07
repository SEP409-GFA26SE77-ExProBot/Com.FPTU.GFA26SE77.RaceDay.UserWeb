import { Role } from "@/interfaces/role";

export interface MockAccount {
  username: string;
  password: string;
  role: Role;
  name: string;
  userId: number;
}

export const MOCK_ACCOUNTS: MockAccount[] = [
  {
    username: "admin",
    password: "password123",
    role: Role.ADMIN,
    name: "Admin User",
    userId: 1,
  },
  {
    username: "runner",
    password: "password123",
    role: Role.RUNNER,
    name: "Runner Athlete",
    userId: 2,
  },
  {
    username: "coordinator",
    password: "password123",
    role: Role.COORDINATOR,
    name: "Race Coordinator",
    userId: 3,
  },
  {
    username: "staff",
    password: "password123",
    role: Role.STAFF,
    name: "Race Staff",
    userId: 4,
  },
  {
    username: "photographer",
    password: "password123",
    role: Role.PHOTOGRAPHER,
    name: "Race Photographer",
    userId: 5,
  },
  {
    username: "organizer",
    password: "password123",
    role: Role.ORGANIZER,
    name: "Event Organizer",
    userId: 6,
  },
];
