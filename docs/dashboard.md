# Dashboard Organizer

## Nhóm trạng thái và xuất báo cáo

- Trạng thái giải gom 6 nhóm: đang chuẩn bị, chờ duyệt, đang mở đăng ký, đã đóng đăng ký, đã hoàn thành và cần chú ý.
- Đăng ký gom 4 nhóm: chờ thanh toán, chờ duyệt, đã xác nhận (Confirmed + Finished), hủy/từ chối. DNS/DNF/DQ ở phần thi đấu vẫn tách riêng.
- Ẩn nhóm 0; dashboard tổng dùng thanh tỷ lệ ngang và số lượng. Dashboard từng giải vẫn có **Xem tất cả trạng thái**. Các mã trạng thái backend giữ nguyên.
- Dashboard tổng có 4 chỉ số: tổng giải, giải đang mở đăng ký, đăng ký chờ duyệt và khiếu nại chờ xử lý.
- **Excel / PDF** ở thanh công cụ dashboard tổng và **Xuất Excel / Xuất PDF** ở trang chi tiết/từng giải gọi `GET /api/v1/event/organizer/dashboard/export` hoặc `GET /api/v1/event/organizer/{eventId}/dashboard/export`.
- Tham số `format=xlsx|pdf`, `from`, `to`; dashboard một giải truyền `distanceId` theo cự ly đang chọn. Cự ly chỉ lọc biểu đồ đăng ký, các chỉ số khác và dòng tiền vẫn tính toàn giải.
- File là số liệu được backend tải lại khi xuất, theo quyền chủ giải. Mỗi phần ghi rõ số liệu hiện tại hoặc theo kỳ. Không hỗ trợ xuất khi dùng dữ liệu tài chính mô phỏng.
- Chi tiết luồng, nội dung file và quyền: repo WebAPI `docs/dashboard-export.md`.

## Đường dẫn

- `/my-events`: **Quản lý giải của tôi**, mở mặc định tab **Dashboard** cho Organizer. Dashboard hiển thị bản tổng hợp gọn của chỉ số, việc cần xử lý, trạng thái, ví, biểu đồ và xuất Excel/PDF.
- `/my-events?tab=events`: tab **Danh sách giải**, giữ bộ lọc trạng thái, phân trang, tạo giải và mở chi tiết giải. Hai tab dùng URL để tải lại hoặc quay lại đúng tab; tài khoản chưa có vai trò Organizer tiếp tục thấy danh sách giải.
- `/organizer`: đường dẫn cũ chuyển về `/my-events`; menu tài khoản và sidebar dùng mục **Quản lý giải của tôi**, bỏ mục Dashboard riêng.
- `/organizer/events/{eventId}`: tab **Tổng quan** của một giải.
- `/my-events/revenue?from=YYYY-MM-DD&to=YYYY-MM-DD`: trang **Chi tiết dòng tiền**, có bộ lọc, biểu đồ và bảng theo ngày cho từng tiền tệ, làm mới và xuất toàn dashboard. **Quay lại Dashboard** giữ kỳ đang xem.
- `/my-events/tasks`: trang **Việc cần xử lý**, hiển thị đầy đủ các giải có việc chờ và liên kết duyệt đăng ký/xử lý khiếu nại. Hai trang chi tiết yêu cầu đăng nhập bằng tài khoản Organizer.
- `/my-events?tab=events&filter=upcoming`: bộ lọc **Sắp diễn ra**, lấy mọi giải đã duyệt/mở/đóng đăng ký có ngày tổ chức từ hôm nay (UTC+7), sắp theo ngày tăng dần và phân trang. Không giới hạn 5 giải như khối lịch cũ.
- `/my-events?tab=events&filter=registration-open`: bộ lọc **Mở đăng ký**, được mở khi bấm chỉ số tương ứng. Các bộ lọc danh sách dùng URL để tải lại/quay lại đúng trạng thái.
- Các luồng duyệt đăng ký, khiếu nại và giải ngân dùng màn hình hiện có.

## Bố cục tổng quan gọn

1. Thanh công cụ: kỳ dòng tiền, áp dụng/chọn nhanh ngày, làm mới, Excel/PDF. Tên nút xuất vẫn được đọc là **Xuất Excel/PDF** bằng công cụ hỗ trợ.
2. Một hàng 4 chỉ số trên desktop (2 cột trên mobile), bấm để mở danh sách hoặc việc cần xử lý.
3. Hai cột khoảng 60/40: **Dòng tiền vé** và **Việc cần xử lý**. Biểu đồ cao 200px từ tablet; mobile dùng tỷ lệ tự nhiên. Công việc tối đa 5 dòng, **Xem tất cả** mở trang đầy đủ.
4. Hàng cuối: **Ví ban tổ chức** và **Trạng thái các giải**. Không lặp tiêu đề Dashboard hoặc khối lịch giải trên trang tổng quan.

Dòng tiền hiển thị **+ Đã thu**, **− Đã hoàn** và chênh lệch có dấu. Đây là thu trừ hoàn thành công trong kỳ, chưa trừ phí. Ví là số dư hiện tại. Nhiều tiền tệ được chọn riêng trên tổng quan và hiển thị đầy đủ ở trang chi tiết; không cộng các tiền tệ với nhau. Bảng theo ngày chuyển sang **Xem chi tiết**; file xuất vẫn giữ đủ các sheet như trước.

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

Kiểm tra luồng hai tab: build/TypeScript đạt; 5 test dashboard đạt; test auth với backend thật đạt 20, bỏ qua 1 trường hợp cần khóa ký JWT. Đã kiểm tra trình duyệt ở 375/768/1280px, phím mũi tên, tải lại/quay lại, bộ lọc/phân trang, mở giải, chuyển hướng cũ, menu mobile, trạng thái rỗng/lỗi/thử lại và tải Excel/PDF thật. ESLint các file thay đổi vẫn có 3 lỗi `set-state-in-effect` và 2 cảnh báo đã tồn tại trong bản trước ở `MyEventsClient`/`OrganizerShell`; các file còn lại đạt.

Kiểm tra bản gọn: đã mở dòng tiền/việc cần xử lý, giữ kỳ khi quay lại, tải file thật từ cả tổng quan và chi tiết, đối chiếu bộ lọc sắp diễn ra với API thật. Dữ liệu kiểm thử trên trình duyệt bổ sung trường hợp 8 giải có tên dài (tổng quan 5 dòng, chi tiết 8 dòng), dòng tiền âm, nhiều tiền tệ, lỗi/thử lại, rỗng và truy cập chưa đăng nhập. Các khối đều nằm trong chiều ngang 375/768/1280px. Không sửa dữ liệu backend để tạo các tình huống này.

Bản gọn đạt TypeScript, ESLint các component dashboard mới/sửa và production build. Next.js có nhắc nâng cấp bảo mật cho phiên bản đang cài; lần build đầu bị chặn ở bước nhắc, chạy lại cùng lệnh đạt. Chưa thay đổi dependency trong phạm vi chỉnh dashboard.

Tài liệu tổng thể và sơ đồ ở repo WebAPI: `docs/dashboard-ui.md`; chi tiết backend: `docs/dashboard-api.md`.

