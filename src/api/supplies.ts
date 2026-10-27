import api from "@/config/axios";
import { getApiErrorMessage } from "@/lib/error";
import type {
  EventSupplyItemDto,
  UpdateEventSuppliesRequest,
} from "@/dto/organizer.dto";

const EVENT_API = "api/v1/event";
const STORAGE_KEY_PREFIX = "raceday_event_supplies_";

export type { EventSupplyItemDto, UpdateEventSuppliesRequest };

function getLocalSupplies(eventId: string): EventSupplyItemDto[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${eventId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as EventSupplyItemDto[];
      }
    }
  } catch {
    /* ignore parse error */
  }
  return [];
}

function saveLocalSupplies(eventId: string, supplies: EventSupplyItemDto[]) {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(
        `${STORAGE_KEY_PREFIX}${eventId}`,
        JSON.stringify(supplies)
      );
    } catch {
      /* ignore storage error */
    }
  }
}

/**
 * GET /organizer/{eventId}/supplies — Lấy danh sách vật phẩm tiếp tế của sự kiện
 */
export async function getEventSupplies(
  eventId: string
): Promise<EventSupplyItemDto[]> {
  try {
    const res = await api.get(`${EVENT_API}/organizer/${eventId}/supplies`);
    const data = res as unknown as EventSupplyItemDto[];
    if (Array.isArray(data) && data.length > 0) {
      saveLocalSupplies(eventId, data);
      return data;
    }
    // Nếu BE trả về mảng rỗng thì thử kiểm tra local cache trước khi trả về rỗng
    const cached = getLocalSupplies(eventId);
    if (cached.length > 0) return cached;
    return Array.isArray(data) ? data : [];
  } catch (e) {
    const cached = getLocalSupplies(eventId);
    if (cached.length > 0) {
      return cached;
    }
    throw new Error(
      getApiErrorMessage(e, "Không tải được danh sách vật phẩm tiếp tế.")
    );
  }
}

/**
 * PUT /organizer/{eventId}/supplies — Cập nhật / lưu danh sách vật phẩm tiếp tế (đơn vị: thùng)
 */
export async function updateEventSupplies(
  eventId: string,
  supplies: EventSupplyItemDto[]
): Promise<EventSupplyItemDto[]> {
  // Luôn lưu cache localStorage để giữ trạng thái người dùng
  saveLocalSupplies(eventId, supplies);

  try {
    const res = await api.put(`${EVENT_API}/organizer/${eventId}/supplies`, {
      supplies,
    });
    return (res as unknown as EventSupplyItemDto[]) || supplies;
  } catch (e) {
    console.warn("Backend supplies API not available yet, saved locally:", e);
    return supplies;
  }
}

/**
 * POST /organizer/{eventId}/supplies — Thêm 1 thẻ vật phẩm tiếp tế mới
 */
export async function addEventSupply(
  eventId: string,
  item: Omit<EventSupplyItemDto, "id"> & { id?: string }
): Promise<EventSupplyItemDto> {
  const newItem: EventSupplyItemDto = {
    ...item,
    id: item.id || `sup-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    unit: "thùng",
  };

  const current = getLocalSupplies(eventId);
  const updated = [newItem, ...current.filter((c) => c.id !== newItem.id)];
  saveLocalSupplies(eventId, updated);

  try {
    const res = await api.post(`${EVENT_API}/organizer/${eventId}/supplies`, newItem);
    return (res as unknown as EventSupplyItemDto) || newItem;
  } catch (e) {
    console.warn("Backend supplies POST not available yet, saved locally:", e);
    return newItem;
  }
}

/**
 * DELETE /organizer/{eventId}/supplies/{supplyId} — Xóa 1 thẻ vật phẩm tiếp tế
 */
export async function deleteEventSupply(
  eventId: string,
  supplyId: string
): Promise<void> {
  const current = getLocalSupplies(eventId);
  saveLocalSupplies(
    eventId,
    current.filter((item) => item.id !== supplyId)
  );

  try {
    await api.delete(`${EVENT_API}/organizer/${eventId}/supplies/${supplyId}`);
  } catch (e) {
    console.warn("Backend supplies DELETE not available yet, removed locally:", e);
  }
}
