import { createRegistration, getRegistrationById } from "@/api/events";
import { createPackagePurchase, getPackagePurchase } from "@/api/event-packages";
import { createCheckout, createPackageCheckout, getPaymentById, syncPayment } from "@/api/payments";
import type { RegistrationDto } from "@/dto/event.dto";
import type { PackagePurchaseDto } from "@/dto/event-package.dto";
import type { PaymentDto } from "@/dto/payment.dto";

export const CONTINUABLE_PAYMENT_STATUSES = ["pending", "cancelled", "failed", "expired"];

export type PaymentOrder = {
  payment: PaymentDto;
  title: string;
  detail: string;
  registration?: RegistrationDto;
  purchase?: PackagePurchaseDto;
};

export async function loadPaymentOrder(paymentId: string): Promise<PaymentOrder> {
  const payment = await getPaymentById(paymentId);
  if (payment.purpose === "event_package" && payment.referenceId) {
    const purchase = await getPackagePurchase(payment.referenceId);
    return { payment, purchase, title: purchase.orgName, detail: `Gói ${purchase.durationMonths} tháng · ${purchase.participantCap} VĐV` };
  }
  if (payment.registrationId && payment.purpose !== "event_package") {
    const registration = await getRegistrationById(payment.registrationId);
    return { payment, registration, title: registration.eventName || "Đăng ký giải chạy", detail: registration.distanceName || registration.fullName };
  }
  throw new Error("Không tìm thấy đơn đăng ký hoặc đơn mua gói của giao dịch này.");
}

export async function startContinuedPayment(
  order: PaymentOrder,
  origin: string,
  onOrderUpdated: (order: PaymentOrder) => void,
) {
  const payment = await getPaymentById(order.payment.id);
  const current = payment.status === "pending" ? await syncPayment(payment.id) : payment;
  onOrderUpdated({ ...order, payment: current });
  if (!CONTINUABLE_PAYMENT_STATUSES.includes(current.status)) {
    throw new Error("Giao dịch đã thanh toán hoặc hoàn tiền. Không thể thanh toán lại.");
  }
  const cancelUrl = `${origin}/payments/${encodeURIComponent(payment.id)}/continue?cancelled=true`;
  if (order.registration) {
    let registration = await getRegistrationById(order.registration.id);
    if (registration.status === "cancelled") {
      registration = await createRegistration(registration.eventId, {
        distanceId: registration.distanceId,
        fullName: registration.fullName,
        email: registration.email,
        phone: registration.phone,
        dateOfBirth: registration.dateOfBirth,
        gender: registration.gender || "",
        idNumber: registration.idNumber,
        heightCm: registration.heightCm,
        weightKg: registration.weightKg,
        bloodType: registration.bloodType,
        emergencyName: registration.emergencyName || "",
        emergencyPhone: registration.emergencyPhone || "",
        emergencyRelation: registration.emergencyRelation,
        shirtType: registration.shirtType,
        shirtSize: registration.shirtSize,
        shirtColor: registration.shirtColor,
        bibName: registration.bibName,
        medicalCodes: registration.medicalCodes,
        healthCertFileName: registration.healthCertFileName,
        healthCertUrl: registration.healthCertUrl,
        liabilityAccepted: registration.liabilityAccepted === true,
      });
    }
    if (registration.status !== "pending_payment") {
      throw new Error("Đăng ký này không còn chờ thanh toán. Vui lòng kiểm tra Vé / đăng ký của tôi.");
    }
    // Retain the new registration if creating the gateway link fails.
    onOrderUpdated({ ...order, payment: current, registration });
    const successPath = `/events/${encodeURIComponent(registration.eventId)}/pending?regId=${encodeURIComponent(registration.id)}`;
    const returnUrl = `${origin}${successPath}`;
    const checkout = await createCheckout({ registrationId: registration.id, returnUrl, cancelUrl });
    return { checkout, returnUrl, successPath };
  }
  if (order.purchase) {
    let purchase = await getPackagePurchase(order.purchase.id);
    if (purchase.status === "cancelled" || purchase.status === "expired") {
      purchase = await createPackagePurchase({
        orgName: purchase.orgName,
        orgIntro: purchase.orgIntro || "",
        orgAddress: purchase.orgAddress || "",
        invoiceInfo: purchase.invoiceInfo || undefined,
        durationMonths: purchase.durationMonths,
        participantCap: purchase.participantCap,
        promoCode: purchase.promoCode || undefined,
      });
    }
    if (purchase.status !== "pending_payment" || purchase.createdEventId) {
      throw new Error("Gói này không còn chờ thanh toán. Vui lòng kiểm tra Giải của tôi.");
    }
    onOrderUpdated({ ...order, payment: current, purchase });
    const successPath = `/events/create/package-return?purchaseId=${encodeURIComponent(purchase.id)}`;
    const returnUrl = `${origin}${successPath}`;
    const checkout = await createPackageCheckout({ packagePurchaseId: purchase.id, returnUrl, cancelUrl });
    return { checkout, returnUrl, successPath };
  }
  throw new Error("Không tìm thấy thông tin đơn thanh toán.");
}
