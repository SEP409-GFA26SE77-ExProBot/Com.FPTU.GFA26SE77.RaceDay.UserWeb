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
    fullName: "Nguyễn Văn An",
    email: "runner@raceday.vn",
    role: Role.RUNNER,
    phone: "0901234567",
    description: "VĐV marathon nghiệp dư, thích trail và đường phố",
  },
  {
    id: 2,
    username: "admin",
    password: "admin123",
    fullName: "Trần Thị Bình",
    email: "admin@raceday.vn",
    role: Role.ADMIN,
    phone: "0902345678",
    description: "Quản trị viên hệ thống RaceDay",
  },
  {
    id: 3,
    username: "coordinator",
    password: "coordinator123",
    fullName: "Lê Minh Châu",
    email: "coordinator@raceday.vn",
    role: Role.COORDINATOR,
    phone: "0903456789",
    description: "Điều phối viên ngày đua",
  },
  {
    id: 4,
    username: "staff",
    password: "staff123",
    fullName: "Phạm Quốc Dũng",
    email: "staff@raceday.vn",
    role: Role.STAFF,
    phone: "0904567890",
    description: "Nhân sự check-in và phát BIB",
  },
  {
    id: 5,
    username: "photographer",
    password: "photo123",
    fullName: "Hoàng Nhật Em",
    email: "photo@raceday.vn",
    role: Role.PHOTOGRAPHER,
    phone: "0905678901",
    description: "Nhiếp ảnh viên sự kiện chính thức",
  },
  {
    id: 6,
    username: "organizer",
    password: "organizer123",
    fullName: "Vũ Thanh Phong",
    email: "organizer@raceday.vn",
    role: Role.ORGANIZER,
    phone: "0906789012",
    description: "Ban tổ chức giải chạy cộng đồng",
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
