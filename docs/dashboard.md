# Dashboard Organizer

## Đường dẫn

- `/organizer`: **Dashboard** toàn bộ giải đang sở hữu. Mở từ menu tài khoản, Giải của tôi hoặc sidebar Organizer.
- `/organizer/events/{eventId}`: tab **Tổng quan** của một giải.
- `/my-events` vẫn là danh sách giải; các luồng duyệt đăng ký, khiếu nại và giải ngân dùng màn hình hiện có.

## API

| Màn hình | GET API |
| --- | --- |
| Tổng quan | `/api/v1/event/organizer/dashboard` |
| Tổng quan một giải | `/api/v1/event/organizer/{eventId}/dashboard` |
| Đơn mới theo ngày/cự ly | `/api/v1/event/organizer/{eventId}/dashboard/registrations-trend?from=&to=` |
| Thu/hoàn tiền | `/api/v1/finance/organizer/revenue-trend?eventId=&from=&to=` |
| Ví tổng | `/api/v1/finance/organizer/wallet` |
| Tài chính một giải | `/api/v1/finance/organizer/events/{eventId}/summary` |

Bỏ `eventId` ở revenue-trend để xem toàn bộ giải thuộc tài khoản. Không truyền tùy ý OrganizerId từ trình duyệt.

## Cách dùng

1. Xem việc đang chờ; bấm nút để duyệt đăng ký hoặc xử lý khiếu nại của đúng giải.
2. Mở giải để xem đăng ký, check-in, thi đấu, sức chứa, BIB, tài liệu, bản đồ và nhân sự.
3. Chọn từ/đến ngày rồi **Áp dụng**, hoặc chọn nhanh 7/30/90 ngày. Khoảng tối đa 366 ngày, tính theo UTC+7.
4. Chọn cự ly ở biểu đồ đăng ký; mở **Xem bảng số liệu theo ngày** để xem số chính xác.
5. **Làm mới** tải lại dữ liệu. Khi một khối lỗi, **Thử lại** tải lại riêng khối đó.

Đơn mới gồm cả chưa thanh toán/đã hủy. Chỗ đang giữ khác vé bán. Dòng tiền ròng chưa trừ phí và khác số tiền có thể rút. KPI hiện tại và ví không chịu bộ lọc ngày biểu đồ.

Giao diện có thông báo nếu ví/summary đang dùng `NEXT_PUBLIC_FINANCE_USE_MOCK=true`. Mặc định dùng API thật; dashboard và biểu đồ mới không dùng mock.

Code: `src/components/dashboard/`, `src/api/dashboard.ts`, `src/dto/dashboard.dto.ts`.

Kiểm tra: `node --test tests/dashboard.test.mjs`, `npx tsc --noEmit`, `npm run build`.

Tài liệu tổng thể và sơ đồ ở repo WebAPI: `docs/dashboard-ui.md`; chi tiết backend: `docs/dashboard-api.md`.

