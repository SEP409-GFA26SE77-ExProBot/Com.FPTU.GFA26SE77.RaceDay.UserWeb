"use client";

import { useState, useEffect } from "react";
import { RaceEventListItemDto } from "@/dto/event.dto";
import { getEvents } from "@/api/events";
import EventCard from "@/components/events/EventCard";
import EventCardSkeleton from "@/components/events/EventCardSkeleton";
import { Search, SlidersHorizontal, X } from "lucide-react";

export default function EventsClient() {
  const [events, setEvents] = useState<RaceEventListItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const filters = [
    { key: "all", label: "All Events" },
    { key: "registration-open", label: "Open" },
    { key: "approved", label: "Approved" },
    { key: "pending", label: "Pending" },
  ];

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getEvents()
      .then((data) => {
        if (!cancelled) {
          // API may return array or object with items — normalize
          const list = Array.isArray(data) ? data : [];
          setEvents(list);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err?.response?.data?.error ||
              "Không thể tải danh sách sự kiện. Vui lòng thử lại."
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Filter events client-side
  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      searchQuery === "" ||
      event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      activeFilter === "all" || event.status === activeFilter;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Discover Events
        </h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Find your next running challenge. Browse upcoming races, trail runs, and marathons
          across Vietnam.
        </p>
      </div>

      {/* Search & Filters */}
      <div className="mb-8 space-y-4">
        {/* Search bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search events, locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-10 text-sm outline-none transition-all focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 placeholder:text-muted-foreground"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-muted text-muted-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground mr-1" />
          {filters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                activeFilter === filter.key
                  ? "bg-orange-500 text-white shadow-md shadow-orange-500/25"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Results count */}
        <p className="text-xs text-muted-foreground">
          Showing {filteredEvents.length} of {events.length} events
        </p>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center mb-8">
          <p className="text-sm text-red-600 font-medium">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Events grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredEvents.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}

        {/* Skeleton loading cards */}
        {loading &&
          Array.from({ length: 6 }).map((_, i) => (
            <EventCardSkeleton key={`skeleton-${i}`} />
          ))}
      </div>

      {/* Empty state */}
      {!loading && filteredEvents.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">
            No events found
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Try adjusting your search or filter to find what you&apos;re looking for.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setActiveFilter("all");
            }}
            className="mt-4 rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}
