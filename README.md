This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

Dashboard Organizer: [đường dẫn, luồng sử dụng và API](docs/dashboard.md).

## Duyệt báo cáo DQ khi giả lập

Organizer mở **Giả lập đua** (`/organizer/events/{eventId}/race-simulation`), chọn cự ly và bấm nút **Báo cáo DQ** trên thanh điều khiển. Nút hiển thị số báo cáo chờ duyệt; danh sách mở trong hộp thoại riêng để giữ diện tích bản đồ. Hộp thoại có **Chờ duyệt** và **Đã xử lý**, BIB/tên VĐV, checkpoint, người báo cáo, lý do, bằng chứng và giờ thực tế/giả lập. Chọn duyệt/từ chối để nhập lý do ngay trong hộp thoại; **Hủy** trở về danh sách.

- **Duyệt DQ** hoặc **Từ chối** đều yêu cầu lý do (tối đa 1000 ký tự). Duyệt loại VĐV; từ chối giữ trạng thái thi đấu hiện tại. Mỗi lần xử lý có bản ghi riêng trong nhật ký checkpoint của staff.
- Khi lỗi gửi, form giữ nội dung; thử lại cùng nội dung dùng cùng `operationId`. Mất kết nối khóa duyệt đến khi nhận snapshot mới; đổi lượt/reset đóng form cũ.
- Chỉ bấm **Ghi kết quả** khi lượt kết thúc và đã xử lý hết DQ chờ duyệt. Màn không tự ghi kết quả khi kết thúc. Trước khi ghi, có thể reset và chạy thử lại; sau khi ghi, reset không hoàn tác kết quả chính thức.

Staff xem **Nhật ký thao tác** trên AdminWeb tại `/checkpoint/events/{eventId}`: DNS, DNF, DQ trực tiếp, gửi/duyệt/từ chối DQ, gửi báo cáo checkpoint; có người thực hiện/vai trò, BIB/tên, trạng thái trước/sau, lý do/bằng chứng, giờ thực và giờ giả lập. Có lọc lượt/hành động/người/BIB/tên và 25 bản ghi mỗi trang. Nhật ký lưu ngay vào database, còn sau reset/restart; khác với kết quả chính thức chỉ ghi khi organizer bấm nút. Diễn biến qua mốc nằm ở tab riêng, không lưu từng tick vị trí vào nhật ký nghiệp vụ.

Kiểm thử hai FE với API và database seed riêng: từ AdminWeb chạy `STAFF_CHECKPOINT_E2E=1`, `E2E_BACKEND`, `E2E_ORIGIN` (AdminWeb), `E2E_USER_ORIGIN` (UserWeb), rồi `npx playwright test e2e/organizer-dq-review.spec.ts`. Không bấm ghi kết quả trong kịch bản này.
Nếu dùng cổng FE khác mặc định, đặt `ALLOWS_CORS` trên API bằng danh sách origin của hai FE, phân cách bằng dấu phẩy.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
