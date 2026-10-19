import { Suspense } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import OrganizerShell from "@/components/organizer/OrganizerShell";

export default function OrganizerDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f7f5f1] text-sm text-slate-500">
          Đang tải workspace…
        </div>
      }
    >
      <OrganizerShell>
        {children}
        <ToastContainer
          position="top-center"
          autoClose={5000}
          closeOnClick
          pauseOnHover
          draggable
          hideProgressBar
          icon={false}
          toastClassName="organizer-toast"
        />
      </OrganizerShell>
    </Suspense>
  );
}
