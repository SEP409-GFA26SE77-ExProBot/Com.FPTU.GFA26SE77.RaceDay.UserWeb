import { Flag, type LucideIcon } from "lucide-react";

interface PageLoadingProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
}

/** Full-viewport loading — cùng kiểu màn PayOS processing */
export default function PageLoading({
  title = "Đang tải…",
  description = "Vui lòng chờ trong giây lát.",
  icon: Icon = Flag,
}: PageLoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <div className="relative mb-8">
        <div className="h-24 w-24 rounded-full border-4 border-orange-500/20 border-t-orange-500 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon className="h-8 w-8 text-orange-500" />
        </div>
      </div>
      <h2 className="text-2xl font-bold mb-2">{title}</h2>
      <p className="text-muted-foreground max-w-sm text-sm">{description}</p>
    </div>
  );
}
