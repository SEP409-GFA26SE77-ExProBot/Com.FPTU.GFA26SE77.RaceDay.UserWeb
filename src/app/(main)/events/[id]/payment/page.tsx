"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CreditCard,
  Shield,
  Lock,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { getEventById, formatPrice } from "@/data/mock-events";

type PaymentState = "form" | "processing" | "success";

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = Number(params.id);
  const event = getEventById(eventId);

  const [paymentState, setPaymentState] = useState<PaymentState>("form");
  const [regData, setRegData] = useState<{
    fullName: string;
    email: string;
    eventTitle: string;
    distance: { id: number; label: string; km: number; price: number };
  } | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("registration_data");
    if (stored) {
      setRegData(JSON.parse(stored));
    }
  }, []);

  const handlePay = () => {
    setPaymentState("processing");

    // Auto-success after 3 seconds
    setTimeout(() => {
      setPaymentState("success");

      // Generate mock confirmation data
      const confirmationData = {
        user_id: Math.floor(Math.random() * 10000) + 1,
        bib: Math.floor(Math.random() * 9000) + 1000,
        event_id: eventId,
        distance: regData?.distance?.km || 5,
        fullName: regData?.fullName || "Runner",
        email: regData?.email || "",
        eventTitle: regData?.eventTitle || event?.title || "",
        distanceLabel: regData?.distance?.label || "",
        price: regData?.distance?.price || 0,
        registeredAt: new Date().toISOString(),
      };
      sessionStorage.setItem(
        "confirmation_data",
        JSON.stringify(confirmationData)
      );

      // Navigate to confirmation after brief success display
      setTimeout(() => {
        router.push(`/events/${eventId}/confirmation`);
      }, 1500);
    }, 3000);
  };

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

  // Processing state
  if (paymentState === "processing") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <div className="relative mb-8">
          <div className="h-24 w-24 rounded-full border-4 border-orange-500/20 border-t-orange-500 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <CreditCard className="h-8 w-8 text-orange-500" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Processing Payment...
        </h2>
        <p className="text-muted-foreground max-w-sm">
          Please wait while we securely process your payment. Do not close this page.
        </p>
        <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
          <Lock className="h-3.5 w-3.5" />
          <span>256-bit SSL encrypted</span>
        </div>
      </div>
    );
  }

  // Success state (brief flash before redirect)
  if (paymentState === "success") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <div className="relative mb-6">
          <div className="h-24 w-24 rounded-full bg-emerald-500/10 flex items-center justify-center animate-in zoom-in-50 duration-500">
            <CheckCircle2 className="h-14 w-14 text-emerald-500" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2 animate-in fade-in-0 duration-500">
          Payment Successful!
        </h2>
        <p className="text-muted-foreground animate-in fade-in-0 duration-700">
          Redirecting to your confirmation...
        </p>
        <Loader2 className="mt-4 h-5 w-5 text-muted-foreground animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link
          href={`/events/${event.id}/register`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Registration
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          Complete Payment
        </h1>
        <p className="mt-1 text-muted-foreground">
          Review your order and complete payment to confirm your registration.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Payment form */}
        <div className="lg:col-span-3 space-y-6">
          {/* Mock payment card */}
          <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-orange-500" />
              <h2 className="text-lg font-bold text-foreground">Payment Method</h2>
            </div>

            {/* Mock card form */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Card Number
                </label>
                <input
                  type="text"
                  placeholder="4242 4242 4242 4242"
                  defaultValue="4242 4242 4242 4242"
                  className="w-full rounded-xl border border-border bg-background py-2.5 px-4 text-sm outline-none transition-all focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    defaultValue="12/28"
                    className="w-full rounded-xl border border-border bg-background py-2.5 px-4 text-sm outline-none transition-all focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    CVV
                  </label>
                  <input
                    type="text"
                    placeholder="123"
                    defaultValue="123"
                    className="w-full rounded-xl border border-border bg-background py-2.5 px-4 text-sm outline-none transition-all focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  placeholder="NGUYEN VAN A"
                  defaultValue={regData?.fullName?.toUpperCase() || "NGUYEN VAN A"}
                  className="w-full rounded-xl border border-border bg-background py-2.5 px-4 text-sm outline-none transition-all focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
            </div>

            {/* Security badges */}
            <div className="flex items-center gap-4 pt-2 border-t border-border/60">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Shield className="h-3.5 w-3.5 text-emerald-500" />
                <span>Secure Payment</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="h-3.5 w-3.5 text-emerald-500" />
                <span>SSL Encrypted</span>
              </div>
            </div>
          </div>

          {/* Mock payment note */}
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4">
            <p className="text-xs text-amber-700 font-medium">
              ⚡ <strong>Demo Mode:</strong> This is a mock payment. Click
              &quot;Pay Now&quot; to simulate a successful payment. No real charges will be made.
            </p>
          </div>
        </div>

        {/* Order summary */}
        <div className="lg:col-span-2">
          <div className="sticky top-24 rounded-2xl border border-border bg-card p-6 shadow-lg space-y-4">
            <h3 className="font-bold text-foreground text-base">Order Summary</h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Event</span>
                <span className="font-medium text-foreground text-right max-w-[160px] truncate">
                  {regData?.eventTitle || event.title}
                </span>
              </div>
              {regData?.distance && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category</span>
                  <span className="font-medium text-foreground">
                    {regData.distance.label}
                  </span>
                </div>
              )}
              {regData?.distance && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Distance</span>
                  <span className="font-medium text-foreground">
                    {regData.distance.km} km
                  </span>
                </div>
              )}
              {regData?.fullName && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Runner</span>
                  <span className="font-medium text-foreground">
                    {regData.fullName}
                  </span>
                </div>
              )}
              <div className="h-px bg-border" />
              <div className="flex justify-between items-center">
                <span className="font-bold text-foreground">Total</span>
                <span className="text-2xl font-extrabold text-orange-600">
                  {formatPrice(regData?.distance?.price || 0)}
                </span>
              </div>
            </div>

            <button
              onClick={handlePay}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition-all hover:shadow-orange-500/40 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Lock className="h-4 w-4" />
              Pay Now
            </button>

            <p className="text-[10px] text-muted-foreground text-center">
              By clicking Pay Now, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
