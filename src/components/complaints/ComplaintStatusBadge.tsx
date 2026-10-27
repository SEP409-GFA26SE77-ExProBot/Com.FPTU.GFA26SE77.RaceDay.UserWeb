import { Clock3, CircleCheck, CircleX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ComplaintStatus } from "@/dto/complaint.dto";

const styles = {
  Pending: {
    icon: Clock3,
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  Accepted: {
    icon: CircleCheck,
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  Rejected: {
    icon: CircleX,
    className: "border-red-200 bg-red-50 text-red-700",
  },
};

export default function ComplaintStatusBadge({
  status,
}: {
  status: ComplaintStatus;
}) {
  const { icon: Icon, className } = styles[status];
  return (
    <Badge variant="outline" className={`h-6 gap-1.5 px-2.5 ${className}`}>
      <Icon aria-hidden="true" />
      {status}
    </Badge>
  );
}
