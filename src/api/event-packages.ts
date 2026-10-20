import api from "@/config/axios";
import { getApiErrorMessage } from "@/lib/error";
import { invalidateEventCache } from "@/api/events";
import type {
  PackageCatalogDto,
  CreatePackagePurchaseRequest,
  PackagePurchaseDto,
} from "@/dto/event-package.dto";

const EVENT_API = "api/v1/event";

/** GET /packages/catalog — public */
export async function getPackageCatalog(): Promise<PackageCatalogDto> {
  try {
    return (await api.get(`${EVENT_API}/packages/catalog`)) as PackageCatalogDto;
  } catch (e) {
    throw new Error(getApiErrorMessage(e, "Không tải được bảng giá gói tổ chức."));
  }
}

/** POST /organizer/packages/purchases — tạo purchase (authenticated) */
export async function createPackagePurchase(
  data: CreatePackagePurchaseRequest
): Promise<PackagePurchaseDto> {
  try {
    return (await api.post(
      `${EVENT_API}/organizer/packages/purchases`,
      data
    )) as PackagePurchaseDto;
  } catch (e) {
    throw new Error(getApiErrorMessage(e, "Tạo đơn mua gói thất bại."));
  }
}

/** GET /organizer/packages/purchases/{id} */
export async function getPackagePurchase(
  id: string
): Promise<PackagePurchaseDto> {
  try {
    return (await api.get(
      `${EVENT_API}/organizer/packages/purchases/${id}`
    )) as PackagePurchaseDto;
  } catch (e) {
    throw new Error(getApiErrorMessage(e, "Không tải được đơn mua gói."));
  }
}

/** POST /organizer/packages/purchases/{id}/cancel — hủy đơn chờ thanh toán */
export async function cancelPackagePurchase(
  id: string
): Promise<PackagePurchaseDto> {
  try {
    return (await api.post(
      `${EVENT_API}/organizer/packages/purchases/${id}/cancel`
    )) as PackagePurchaseDto;
  } catch (e) {
    throw new Error(getApiErrorMessage(e, "Hủy đơn mua gói thất bại."));
  }
}

/** PUT /organizer/{eventId}/profile — update draft event fields */
export async function updateEventProfile(
  eventId: string,
  data: Record<string, unknown>
): Promise<unknown> {
  try {
    const result = await api.put(`${EVENT_API}/organizer/${eventId}/profile`, data);
    invalidateEventCache(eventId);
    return result;
  } catch (e) {
    throw new Error(getApiErrorMessage(e, "Cập nhật hồ sơ giải thất bại."));
  }
}

/** GET /organizer/{eventId}/distances — cự ly + ticketPricing (organizer setup) */
export async function getOrganizerDistances(
  eventId: string
): Promise<{
  eventId: string;
  status: string;
  distances: Array<{
    id: string;
    name: string;
    distanceKm: number;
    capacity: number;
    registeredCount: number;
    basePrice: number;
    /** @deprecated */
    price?: number;
    currency: string;
    startAt?: string | null;
    endAt?: string | null;
  }>;
  ticketPricing?: unknown;
}> {
  try {
    return await api.get(`${EVENT_API}/organizer/${eventId}/distances`);
  } catch (e) {
    throw new Error(getApiErrorMessage(e, "Không tải được cự ly."));
  }
}

/** PUT /organizer/{eventId}/distances — replace distances (+ optional ticketPricing) */
export async function replaceEventDistances(
  eventId: string,
  data: { distances: Record<string, unknown>[]; ticketPricing?: unknown }
): Promise<unknown> {
  try {
    const result = await api.put(`${EVENT_API}/organizer/${eventId}/distances`, data);
    invalidateEventCache(eventId);
    return result;
  } catch (e) {
    throw new Error(getApiErrorMessage(e, "Cập nhật cự ly thất bại."));
  }
}

/** POST /organizer/{eventId}/open-registration */
export async function openEventRegistration(eventId: string): Promise<unknown> {
  try {
    const result = await api.post(
      `${EVENT_API}/organizer/${eventId}/open-registration`
    );
    invalidateEventCache(eventId);
    return result;
  } catch (e) {
    throw new Error(getApiErrorMessage(e, "Mở đăng ký thất bại."));
  }
}

/** POST /organizer/{eventId}/close-registration */
export async function closeEventRegistration(eventId: string): Promise<unknown> {
  try {
    const result = await api.post(
      `${EVENT_API}/organizer/${eventId}/close-registration`
    );
    invalidateEventCache(eventId);
    return result;
  } catch (e) {
    throw new Error(getApiErrorMessage(e, "Đóng đăng ký thất bại."));
  }
}
