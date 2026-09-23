export default function EventCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm">
      {/* Banner skeleton */}
      <div className="relative h-48 bg-muted overflow-hidden">
        <div className="skeleton-shimmer absolute inset-0" />
        {/* Status badge skeleton */}
        <div className="absolute top-3 left-3">
          <div className="h-6 w-28 rounded-full bg-white/20 backdrop-blur-sm" />
        </div>
        {/* Distance badges skeleton */}
        <div className="absolute bottom-3 left-3 flex gap-1.5">
          <div className="h-5 w-10 rounded-md bg-white/30" />
          <div className="h-5 w-10 rounded-md bg-white/30" />
          <div className="h-5 w-10 rounded-md bg-white/30" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <div className="space-y-1.5">
          <div className="h-4 w-4/5 rounded-md bg-muted skeleton-shimmer" />
          <div className="h-4 w-3/5 rounded-md bg-muted skeleton-shimmer" />
        </div>

        {/* Date & Location */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="h-3.5 w-3.5 rounded bg-muted skeleton-shimmer shrink-0" />
            <div className="h-3.5 w-36 rounded-md bg-muted skeleton-shimmer" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3.5 w-3.5 rounded bg-muted skeleton-shimmer shrink-0" />
            <div className="h-3.5 w-28 rounded-md bg-muted skeleton-shimmer" />
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="h-3 w-24 rounded-md bg-muted skeleton-shimmer" />
            <div className="h-3 w-8 rounded-md bg-muted skeleton-shimmer" />
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted skeleton-shimmer" />
        </div>

        {/* Price & Tags */}
        <div className="flex items-center justify-between pt-1">
          <div className="h-4 w-20 rounded-md bg-muted skeleton-shimmer" />
          <div className="flex gap-1">
            <div className="h-4 w-12 rounded-md bg-muted skeleton-shimmer" />
            <div className="h-4 w-12 rounded-md bg-muted skeleton-shimmer" />
          </div>
        </div>
      </div>
    </div>
  );
}
