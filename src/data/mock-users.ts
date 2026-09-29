import { Role } from "@/interfaces/role";

export interface MockUser {
  id: number;
  username: string;
  password: string;
  fullName: string;
  email: string;
  role: Role;
  avatarUrl?: string;
  phone?: string;
  description?: string;
}

export const MOCK_USERS: MockUser[] = [
  {
    id: 1,
    username: "runner",
    password: "password123",
    fullName: "Alex Runner",
    email: "runner@raceday.com",
    role: Role.RUNNER,
    phone: "+84 901 234 567",
    description: "Marathon enthusiast and active competitor",
  },
  {
    id: 2,
    username: "admin",
    password: "admin123",
    fullName: "Sarah Admin",
    email: "admin@raceday.com",
    role: Role.ADMIN,
    phone: "+84 902 345 678",
    description: "System and race operations administrator",
  },
  {
    id: 3,
    username: "coordinator",
    password: "coordinator123",
    fullName: "Chris Coordinator",
    email: "coordinator@raceday.com",
    role: Role.COORDINATOR,
    phone: "+84 903 456 789",
    description: "Race day event coordinator and checkpoint supervisor",
  },
  {
    id: 4,
    username: "staff",
    password: "staff123",
    fullName: "Sam Staff",
    email: "staff@raceday.com",
    role: Role.STAFF,
    phone: "+84 904 567 890",
    description: "Check-in point and kit delivery staff",
  },
  {
    id: 5,
    username: "photographer",
    password: "photo123",
    fullName: "Paul Photographer",
    email: "photo@raceday.com",
    role: Role.PHOTOGRAPHER,
    phone: "+84 905 678 901",
    description: "Official event photographer",
  },
  {
    id: 6,
    username: "organizer",
    password: "organizer123",
    fullName: "Olivia Organizer",
    email: "organizer@raceday.com",
    role: Role.ORGANIZER,
    phone: "+84 906 789 012",
    description: "Marathon organizing committee lead",
  },
];

export function findMockUser(username: string): MockUser | undefined {
  const norm = username.trim().toLowerCase();
  return MOCK_USERS.find(
    (u) => u.username.toLowerCase() === norm || u.email.toLowerCase() === norm
  );
}

export function authenticateMockUser(username: string, password: string): MockUser | null {
  const user = findMockUser(username);
  if (!user) return null;
  if (user.password === password) return user;
  return null;
}
