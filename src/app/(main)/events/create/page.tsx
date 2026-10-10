import EventPermitRegistration from "@/components/organizer/EventPermitRegistration";
import { PAGE_SHELL_FORM } from "@/lib/page-shell";

export const metadata = {
  title: "Tạo giải chạy – RaceDay",
  description: "Đăng ký tổ chức giải chạy trên RaceDay",
};

export default function CreateEventPage() {
  return (
    <div className={`${PAGE_SHELL_FORM} py-8 sm:py-10`}>
      <EventPermitRegistration
        backHref="/events"
        backLabel="Quay lại danh sách giải"
      />
    </div>
  );
}
