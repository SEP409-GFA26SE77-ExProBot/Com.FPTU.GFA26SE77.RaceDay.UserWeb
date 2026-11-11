# Staff workspace

RaceStaff đăng nhập được chuyển tới `/staff`. Các alias Coordinator/Volunteer cùng ánh xạ về `RACE-STAFF`; quyền backend vẫn kiểm tra phân công Active và tài khoản liên kết.

- `/staff`: danh sách phân công từ API hiện có `/api/v1/event/staff/me`.
- `/staff/events/[eventId]/checkpoint`: checkpoint simulation được giao, thống kê, tìm BIB/tên, lọc/phân trang, bản đồ, DNF/DNS/báo cáo DQ và lịch sử nháp.
- Layout riêng tại `src/app/(staff)/staff/layout.tsx`, xác thực server qua `requireServerUser`; proxy chặn role không phù hợp.
- API tập trung tại `src/api/staff-simulation.ts`; realtime tại `src/hooks/useStaffCheckpoint.ts`. Hook dùng SignalR stream `WatchCheckpoint(eventId)` và xóa dữ liệu khi mất quyền/kết nối.
- Organizer xử lý báo cáo tại `SimulationDecisionPanel` trong RaceSimulator. Đã bỏ auto-commit; cần duyệt/từ chối hết Pending trước khi ghi kết quả.

Backend cần bật `Simulation__Enabled=true`. `NEXT_PUBLIC_API_URL` phải trỏ tới host API có hub SignalR và CORS cho UserWeb. HTTP tiếp tục đi qua BFF/cookie HttpOnly; token hub lấy qua endpoint hiện có, không lưu vào browser storage.

Luồng thử: organizer mời staff và gán checkpoint → đăng nhập tài khoản staff → mở phân công → organizer tạo/chạy lượt → staff ghi DNF hoặc báo DQ → organizer duyệt và commit. DNS thử tại Start trước khi chạy. Thử thêm mất kết nối, Reset/New và thu hồi phân công.

Lượt và báo cáo nháp ở bộ nhớ backend; restart/Reset sẽ mất. Quyết định cuối được lưu cùng audit khi commit, không lưu toàn bộ bằng chứng/báo cáo. Đây là workspace **simulation**, mobile và quy trình trọng tài thực tế chưa thuộc bản này.

Kiểm tra:

```powershell
npx.cmd tsc --noEmit
npm.cmd run build
node --test tests/auth-store.test.mjs tests/auth-http.test.mjs tests/staff-auth.test.mjs
```

Test auth HTTP thật cần biến `AUTH_TEST_ORIGIN`, `AUTH_TEST_USERNAME`, `AUTH_TEST_PASSWORD`; mặc định được skip. Kiểm tra UI ở màn hình rộng/hẹp và keyboard cần thực hiện trên trình duyệt.
