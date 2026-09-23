"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  Shirt,
  HeartPulse,
  ChevronRight,
} from "lucide-react";
import { getEventById, formatPrice } from "@/data/mock-events";

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  gender: string;
  dateOfBirth: string;
  tshirtSize: string;
  emergencyContact: string;
  emergencyPhone: string;
  selectedDistanceId: number | null;
}

export default function RegisterPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = Number(params.id);
  const event = getEventById(eventId);

  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    phone: "",
    gender: "",
    dateOfBirth: "",
    tshirtSize: "",
    emergencyContact: "",
    emergencyPhone: "",
    selectedDistanceId: null,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="text-6xl mb-4">🏃</div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Event Not Found</h1>
        <Link
          href="/events"
          className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Events
        </Link>
      </div>
    );
  }

  const selectedDistance = event.distances.find(
    (d) => d.id === formData.selectedDistanceId
  );

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Please enter a valid email";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    if (!formData.gender) newErrors.gender = "Please select your gender";
    if (!formData.dateOfBirth) newErrors.dateOfBirth = "Date of birth is required";
    if (!formData.tshirtSize) newErrors.tshirtSize = "Please select T-shirt size";
    if (!formData.emergencyContact.trim())
      newErrors.emergencyContact = "Emergency contact is required";
    if (!formData.emergencyPhone.trim())
      newErrors.emergencyPhone = "Emergency phone is required";
    if (!formData.selectedDistanceId)
      newErrors.selectedDistanceId = "Please select a race category";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Store registration data for payment page
    const regData = {
      ...formData,
      eventId: event.id,
      eventTitle: event.title,
      distance: selectedDistance,
    };
    sessionStorage.setItem("registration_data", JSON.stringify(regData));
    router.push(`/events/${event.id}/payment`);
  };

  const updateField = (field: keyof FormData, value: string | number | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const inputClass = (field: keyof FormData) =>
    `w-full rounded-xl border ${
      errors[field]
        ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
        : "border-border focus:border-orange-500/50 focus:ring-orange-500/20"
    } bg-background py-2.5 px-4 text-sm outline-none transition-all focus:ring-2 placeholder:text-muted-foreground`;

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link
          href={`/events/${event.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to {event.title}
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          Register for Race
        </h1>
        <p className="mt-1 text-muted-foreground">{event.title}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form fields */}
          <div className="lg:col-span-2 space-y-6">
            {/* Distance selection */}
            <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-white text-xs font-bold">
                  1
                </span>
                Select Race Category
              </h2>
              {errors.selectedDistanceId && (
                <p className="text-xs text-red-500 font-medium">
                  {errors.selectedDistanceId}
                </p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {event.distances.map((d) => {
                  const soldOut = d.registeredSlots >= d.maxSlots;
                  const isSelected = formData.selectedDistanceId === d.id;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      disabled={soldOut}
                      onClick={() => updateField("selectedDistanceId", d.id)}
                      className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                        soldOut
                          ? "border-border/50 bg-muted/50 cursor-not-allowed opacity-60"
                          : isSelected
                          ? "border-orange-500 bg-orange-500/5 shadow-md shadow-orange-500/10"
                          : "border-border hover:border-orange-500/40 hover:bg-orange-500/5"
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-orange-500 flex items-center justify-center">
                          <svg
                            className="h-3 w-3 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      )}
                      <p className="text-sm font-bold text-foreground">{d.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {d.km} km • {d.maxSlots - d.registeredSlots} slots left
                      </p>
                      <p className="text-lg font-extrabold text-orange-600 mt-2">
                        {formatPrice(d.price)}
                      </p>
                      {soldOut && (
                        <span className="absolute top-2 right-2 text-[10px] font-bold text-red-500 uppercase">
                          Sold Out
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Personal info */}
            <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-white text-xs font-bold">
                  2
                </span>
                Personal Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    <User className="inline h-3.5 w-3.5 mr-1 text-orange-500" />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Nguyen Van A"
                    value={formData.fullName}
                    onChange={(e) => updateField("fullName", e.target.value)}
                    className={inputClass("fullName")}
                  />
                  {errors.fullName && (
                    <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    <Mail className="inline h-3.5 w-3.5 mr-1 text-orange-500" />
                    Email *
                  </label>
                  <input
                    type="email"
                    placeholder="email@example.com"
                    value={formData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    className={inputClass("email")}
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    <Phone className="inline h-3.5 w-3.5 mr-1 text-orange-500" />
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    placeholder="0912 345 678"
                    value={formData.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    className={inputClass("phone")}
                  />
                  {errors.phone && (
                    <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
                  )}
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Gender *
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => updateField("gender", e.target.value)}
                    className={inputClass("gender")}
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.gender && (
                    <p className="mt-1 text-xs text-red-500">{errors.gender}</p>
                  )}
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    <Calendar className="inline h-3.5 w-3.5 mr-1 text-orange-500" />
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => updateField("dateOfBirth", e.target.value)}
                    className={inputClass("dateOfBirth")}
                  />
                  {errors.dateOfBirth && (
                    <p className="mt-1 text-xs text-red-500">{errors.dateOfBirth}</p>
                  )}
                </div>

                {/* T-shirt Size */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    <Shirt className="inline h-3.5 w-3.5 mr-1 text-orange-500" />
                    T-shirt Size *
                  </label>
                  <select
                    value={formData.tshirtSize}
                    onChange={(e) => updateField("tshirtSize", e.target.value)}
                    className={inputClass("tshirtSize")}
                  >
                    <option value="">Select size</option>
                    <option value="XS">XS</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="XXL">XXL</option>
                  </select>
                  {errors.tshirtSize && (
                    <p className="mt-1 text-xs text-red-500">{errors.tshirtSize}</p>
                  )}
                </div>
              </div>
            </section>

            {/* Emergency Contact */}
            <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-white text-xs font-bold">
                  3
                </span>
                Emergency Contact
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    <HeartPulse className="inline h-3.5 w-3.5 mr-1 text-orange-500" />
                    Contact Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Emergency contact name"
                    value={formData.emergencyContact}
                    onChange={(e) =>
                      updateField("emergencyContact", e.target.value)
                    }
                    className={inputClass("emergencyContact")}
                  />
                  {errors.emergencyContact && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.emergencyContact}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    <Phone className="inline h-3.5 w-3.5 mr-1 text-orange-500" />
                    Contact Phone *
                  </label>
                  <input
                    type="tel"
                    placeholder="0912 345 678"
                    value={formData.emergencyPhone}
                    onChange={(e) =>
                      updateField("emergencyPhone", e.target.value)
                    }
                    className={inputClass("emergencyPhone")}
                  />
                  {errors.emergencyPhone && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.emergencyPhone}
                    </p>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-lg space-y-4">
                <h3 className="font-bold text-foreground text-base">
                  Registration Summary
                </h3>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Event</span>
                    <span className="font-medium text-foreground text-right max-w-[160px] truncate">
                      {event.title}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date</span>
                    <span className="font-medium text-foreground">
                      {new Date(event.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  {selectedDistance && (
                    <>
                      <div className="h-px bg-border my-2" />
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Category</span>
                        <span className="font-medium text-foreground">
                          {selectedDistance.label}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Distance</span>
                        <span className="font-medium text-foreground">
                          {selectedDistance.km} km
                        </span>
                      </div>
                      <div className="h-px bg-border my-2" />
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-foreground">Total</span>
                        <span className="text-xl font-extrabold text-orange-600">
                          {formatPrice(selectedDistance.price)}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition-all hover:shadow-orange-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  disabled={!selectedDistance}
                >
                  Proceed to Payment
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
