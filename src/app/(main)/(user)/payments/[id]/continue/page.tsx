"use client";

import { useParams } from "next/navigation";
import ContinuePaymentCheckout from "@/components/payment/ContinuePaymentCheckout";

export default function ContinuePaymentPage() {
  const { id } = useParams<{ id: string }>();
  return <ContinuePaymentCheckout key={id} paymentId={id} />;
}
