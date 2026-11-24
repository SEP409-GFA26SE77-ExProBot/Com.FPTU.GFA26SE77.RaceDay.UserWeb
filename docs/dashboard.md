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

Dòng tiền hiển thị hai mục mở/thu gọn **+ Tiền vào**, **− Tiền ra** và chênh lệch có dấu. Đây là thu trừ hoàn thành công trong kỳ, chưa trừ phí. Ví là số dư hiện tại. Nhiều tiền tệ được chọn riêng trên tổng quan và hiển thị đầy đủ ở trang chi tiết; không cộng các tiền tệ với nhau. Bảng tổng hợp theo ngày nằm ở **Xem chi tiết**; file xuất vẫn giữ đủ các sheet như trước.

### Mở/thu gọn tiền vào, tiền ra

- Áp dụng cho khối dòng tiền ở tổng quan, trang chi tiết và dashboard một giải. Hai mục mặc định đóng; bấm tiêu đề hoặc nhấn Enter/Space để mở/đóng.
- **+ Tiền vào**: tổng tiền vé đã thu thành công trong kỳ. Mở ra xem định nghĩa và các ngày có phát sinh, mỗi số tiền mang dấu `+`.
- **− Tiền ra**: tổng tiền hoàn vé thành công trong kỳ. Mở ra xem các ngày hoàn, mỗi số tiền mang dấu `−`. Phí nền tảng và tiền rút ví được theo dõi riêng, không cộng vào con số hoàn vé này.
- **Chênh lệch = tiền vào − tiền ra**: hiển thị cả phép tính bằng số. Ví dụ thu 100, hoàn 30 → `+70`; thu 100, hoàn 300 → `−200`. Số 0 hiển thị bình thường, không có `−0`.
- Danh sách mở rộng chỉ hiện ngày có phát sinh; khu vực này cuộn riêng tối đa 160px. Số ngày không phải số giao dịch. Nếu chưa có thu/hoàn, hiển thị thông báo cụ thể.
- Khi đổi tiền tệ, các mục thu gọn lại và dùng số liệu riêng của tiền tệ vừa chọn. API và số liệu Excel/PDF giữ nguyên; dấu trên giao diện biểu thị chiều dòng tiền.

Đã đối chiếu tổng thu/hoàn với API thật, kiểm tra mở/đóng bằng bàn phím và chuột ở 375/768/1280px, số tiền từng ngày, trường hợp âm/0, nhiều tiền tệ, trang chi tiết và tải Excel thật. TypeScript, ESLint hai component dòng tiền và production build đạt. Khi thu gọn, phần tổng quan kết thúc khoảng 1.200px trên màn hình 1280×900.

## Điều hướng và đề xuất Tổng quan từng giải

Đã bỏ thanh tab dưới banner gồm Tổng quan / Duyệt đăng ký / Tài chính. Trang giải mặc định hiển thị Tổng quan; Duyệt đăng ký vẫn truy cập qua sidebar và các liên kết xử lý đăng ký (`?tab=approvals`). Tài chính chi tiết truy cập **Ví & giải ngân** hoặc **Lịch sử giải ngân** ở sidebar; URL cũ `?tab=finance` hiển thị Tổng quan. Không thay đổi API hay nghiệp vụ duyệt, thu/hoàn tiền và giải ngân.

Đề xuất bên dưới **chưa triển khai**, dành cho lần rút gọn nội dung Tổng quan:

| Khối hiện tại | Đề xuất | Lý do |
| --- | --- | --- |
| Banner, tên, trạng thái, ngày và địa điểm | Giữ thông tin, giảm chiều cao banner và gộp ngày/địa điểm vào hàng thông tin | Nhận diện giải nhanh, ít chiếm chiều cao |
| KPI đăng ký, check-in, khiếu nại | Giữ đăng ký xác nhận, chờ duyệt, check-in và khiếu nại chờ; chuyển tổng đơn sang chi tiết | Ưu tiên vé hợp lệ và việc cần xử lý; tổng đơn gồm cả hủy/chưa trả tiền |
| Trạng thái đăng ký và tình hình thi đấu | Rút gọn trạng thái đăng ký; chuyển bảng thi đấu sang Kết quả giải | Tránh dàn nhiều nhóm trạng thái trên Tổng quan |
| Sức chứa theo cự ly và bảng Cự ly cuối trang | Gộp thành một bảng ngắn tên cự ly / chỗ giữ / sức chứa / đăng ký xác nhận | Hiện đang lặp thông tin; giá vé xem tại Cự ly & giá vé |
| Công tác chuẩn bị | Chỉ hiện việc còn thiếu kèm liên kết xử lý | Các mục đã hoàn tất không cần chiếm nhiều diện tích |
| Tài chính tích lũy và dòng tiền theo ngày | Một khối tiền vào / tiền hoàn ra / chênh lệch theo kỳ, giữ collapse; chi tiết phí và có thể rút xem ở Ví & giải ngân | Hai phạm vi số liệu hiện tại dễ nhầm; chênh lệch chưa trừ phí, không phải lợi nhuận/số dư ví |
| Hai biểu đồ và bảng theo ngày | Một biểu đồ gọn, chuyển đổi Đăng ký / Dòng tiền; bảng ngày chỉ mở khi cần | Giảm cuộn nhưng vẫn xem được số chính xác |
| Xuất Excel/PDF, lọc ngày, làm mới | Đặt chung một thanh công cụ | Dễ tìm, nêu rõ kỳ áp dụng cho xu hướng/dòng tiền |

Mục tiêu là Tổng quan vận hành của **một giải**, không lặp ví tổng hoặc thống kê toàn bộ giải ở Dashboard chung. Bỏ khối khỏi Tổng quan không có nghĩa xóa dữ liệu hay trạng thái nghiệp vụ.

Kiểm tra bỏ tab: TypeScript và production build đạt; auth 20 đạt, 1 bỏ qua vì thiếu khóa ký cho ca JWT hết hạn. Trình duyệt với backend thật xác nhận mất thanh tab, sidebar duyệt đăng ký mở bằng bàn phím và tải lại được, link tài chính cũ về Tổng quan, trang ví vẫn mở được, khách chưa đăng nhập về đăng nhập. ESLint còn 1 lỗi `set-state-in-effect` và 2 cảnh báo dependency đã tồn tại trong cùng file ở HEAD. Kiểm tra 375/768/1280px phát hiện khối thông tin ngày/địa điểm chưa sửa có tràn ngang ở 375px (nội dung 432px); nên xử lý khi rút gọn Tổng quan. Next.js vẫn có cảnh báo bảo mật phiên bản đang cài, chưa thay dependency trong thay đổi này.

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

