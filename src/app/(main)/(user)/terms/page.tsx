import { PAGE_SHELL } from "@/lib/page-shell";
import TermsTableOfContents from "./TermsTableOfContents";

const SECTIONS = [
  { id: "dieu-1", title: "1. Giới thiệu và chấp thuận" },
  { id: "dieu-2", title: "2. Tài khoản và thông tin cá nhân" },
  { id: "dieu-3", title: "3. Điều kiện sức khỏe và an toàn" },
  { id: "dieu-4", title: "4. Đăng ký giải và lựa chọn cự ly" },
  { id: "dieu-5", title: "5. Thanh toán qua PayOS" },
  { id: "dieu-6", title: "6. Hủy đăng ký, đổi cự ly, chuyển nhượng và hoàn tiền" },
  { id: "dieu-7", title: "7. BIB, mã QR và nhận vật phẩm" },
  { id: "dieu-8", title: "8. Chip RFID, checkpoint và thời gian thi đấu" },
  { id: "dieu-9", title: "9. Quy tắc thi đấu và kết quả" },
  { id: "dieu-10", title: "10. Hình ảnh sự kiện và tìm ảnh theo BIB" },
  { id: "dieu-11", title: "11. Dữ liệu cá nhân và quyền riêng tư" },
  { id: "dieu-12", title: "12. Hành vi bị nghiêm cấm" },
  { id: "dieu-13", title: "13. Khiếu nại và hỗ trợ" },
  { id: "dieu-14", title: "14. Thay đổi, hoãn hoặc hủy giải" },
  { id: "dieu-15", title: "15. Giới hạn trách nhiệm và giải quyết tranh chấp" },
  { id: "dieu-16", title: "16. Cập nhật điều khoản và hiệu lực" },
] as const;

const SECTION_HEADING =
  "scroll-mt-24 rounded-sm text-lg font-bold leading-relaxed tracking-tight text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-600 sm:text-xl";

// Content transcribed verbatim from public/RaceDay_Dieu_khoan_su_dung_Runner.md.
// Keep the native JSX in sync with that source when the document is updated.
export default function TermsPage() {
  return (
    <div className={`${PAGE_SHELL} py-8 sm:py-10`}>
      <header className="mb-6 rounded-2xl border border-orange-500/15 bg-gradient-to-br from-orange-50/80 via-white to-amber-50/40 p-5 sm:mb-8 sm:p-8">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-orange-700">
          Pháp lý
        </p>
        <h1
          id="terms-title"
          className="max-w-4xl text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl"
        >
          Điều khoản sử dụng dành cho Runner — RaceDay
        </h1>
        <dl className="mt-6 flex flex-col gap-3 text-sm sm:flex-row sm:flex-wrap sm:gap-x-8 sm:gap-y-4">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <dt className="font-semibold">Trạng thái:</dt>
            <dd className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-amber-900">
              Dự thảo phục vụ đồ án tốt nghiệp
            </dd>
          </div>
          <div className="flex items-center gap-2">
            <dt className="font-semibold">Ngày soạn:</dt>
            <dd>
              <time dateTime="2026-10-28">28/10/2026</time>
            </dd>
          </div>
          <div className="flex items-center gap-2">
            <dt className="font-semibold">Đối tượng áp dụng:</dt>
            <dd>Runner</dd>
          </div>
        </dl>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-8">
        <aside className="min-w-0 lg:sticky lg:top-24">
          <TermsTableOfContents sections={SECTIONS} />
        </aside>

        <article
          aria-labelledby="terms-title"
          className="min-w-0 divide-y divide-border rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-8 lg:p-10 [&>section]:py-8 [&>section:first-child]:pt-0 [&>section:last-child]:pb-0 [&_p]:mt-4 [&_p]:text-[15px] [&_p]:leading-7 [&_p]:text-foreground/85 sm:[&_p]:text-base sm:[&_p]:leading-8"
        >
          <section aria-labelledby="dieu-1">
            <h2 id="dieu-1" tabIndex={-1} className={SECTION_HEADING}>
              1. Giới thiệu và chấp thuận
            </h2>
            <p>
              RaceDay là nền tảng hỗ trợ người chạy bộ (Runner) tìm kiếm và đăng ký các giải chạy do Ban tổ chức (Organizer) độc lập tổ chức; quản lý thanh toán, BIB, check-in, dữ liệu checkpoint, kết quả và tìm kiếm ảnh sự kiện. RaceDay cung cấp công cụ công nghệ, không mặc nhiên là Ban tổ chức hoặc đơn vị y tế, cứu hộ.
            </p>
            <p>
              Khi tạo tài khoản hoặc xác nhận đăng ký một giải, Runner cần đọc và chấp thuận điều khoản này cùng điều lệ, chính sách và thông báo riêng của giải. Nếu không đồng ý, Runner không nên tiếp tục đăng ký. Việc chấp thuận phải được ghi nhận bằng thao tác xác nhận rõ ràng trên hệ thống.
            </p>
          </section>

          <section aria-labelledby="dieu-2">
            <h2 id="dieu-2" tabIndex={-1} className={SECTION_HEADING}>
              2. Tài khoản và thông tin cá nhân
            </h2>
            <p>
              Runner phải cung cấp thông tin chính xác, đầy đủ và cập nhật khi đăng ký; bảo mật thông tin đăng nhập và thông báo khi phát hiện truy cập trái phép. Không được sử dụng danh tính người khác hoặc tạo hồ sơ gian lận.
            </p>
            <p>
              Người chưa thành niên chỉ tham gia khi đáp ứng điều kiện độ tuổi của giải và các yêu cầu đồng ý hoặc đại diện hợp pháp tương ứng; RaceDay không mặc nhiên cho phép mọi độ tuổi tham gia mọi cự ly.
            </p>
          </section>

          <section aria-labelledby="dieu-3">
            <h2 id="dieu-3" tabIndex={-1} className={SECTION_HEADING}>
              3. Điều kiện sức khỏe và an toàn
            </h2>
            <p>
              Runner có trách nhiệm tìm hiểu yêu cầu sức khỏe, độ tuổi, cự ly, địa hình, thời tiết, thời gian giới hạn và các rủi ro của môn chạy bộ. Nếu có lo ngại về sức khỏe, Runner nên tham khảo ý kiến chuyên môn trước khi đăng ký hoặc thi đấu.
            </p>
            <p>
              Runner phải khai báo trung thực thông tin sức khỏe bắt buộc theo biểu mẫu của giải, tuân thủ hướng dẫn an toàn, chỉ dẫn của nhân sự có thẩm quyền và chủ động dừng thi đấu khi có dấu hiệu nguy hiểm. Việc hệ thống tiếp nhận hồ sơ không phải là giấy chứng nhận đủ sức khỏe.
            </p>
            <p>
              Trong trường hợp khẩn cấp, Runner cần liên hệ trực tiếp nhân viên hiện trường hoặc dịch vụ cấp cứu khi có thể. Chức năng SOS trên RaceDay chỉ hỗ trợ chuyển cảnh báo và có thể chậm hoặc gián đoạn do thiết bị, kết nối hay hệ thống.
            </p>
          </section>

          <section aria-labelledby="dieu-4">
            <h2 id="dieu-4" tabIndex={-1} className={SECTION_HEADING}>
              4. Đăng ký giải và lựa chọn cự ly
            </h2>
            <p>
              Runner cần kiểm tra tên giải, thời gian, địa điểm, cự ly, mức phí, quyền lợi, giới hạn số lượng, điều kiện tham gia và điều lệ trước khi xác nhận. Mỗi hồ sơ đăng ký gắn với cự ly được chọn và thông tin định danh theo quy trình RaceDay.
            </p>
            <p>
              Việc gửi biểu mẫu không tự động đồng nghĩa đăng ký đã được thanh toán hoặc bảo đảm suất tham gia. Số chỗ phụ thuộc giới hạn sức chứa và trạng thái xác nhận trên hệ thống.
            </p>
          </section>

          <section aria-labelledby="dieu-5">
            <h2 id="dieu-5" tabIndex={-1} className={SECTION_HEADING}>
              5. Thanh toán qua PayOS
            </h2>
            <p>
              RaceDay sử dụng PayOS cho các khoản thanh toán đăng ký có thu phí. Runner phải kiểm tra số tiền, nội dung giao dịch và thông tin đơn đăng ký trước khi thanh toán.
            </p>
            <p>
              Đăng ký trả phí chỉ được xác nhận thanh toán sau khi backend RaceDay xác minh giao dịch PayOS qua cơ chế xác thực phía máy chủ, bao gồm thông báo giao dịch/webhook hợp lệ. Màn hình chuyển hướng hoặc ảnh chụp giao dịch không phải bằng chứng duy nhất để xác nhận thanh toán.
            </p>
            <p>
              Nếu đã bị trừ tiền nhưng trạng thái chưa cập nhật, Runner cần giữ mã giao dịch và gửi yêu cầu hỗ trợ; không tự ý thanh toán lặp khi chưa kiểm tra trạng thái. Các giao dịch bất thường được đối soát theo dữ liệu thực tế.
            </p>
          </section>

          <section aria-labelledby="dieu-6">
            <h2 id="dieu-6" tabIndex={-1} className={SECTION_HEADING}>
              6. Hủy đăng ký, đổi cự ly, chuyển nhượng và hoàn tiền
            </h2>
            <p>
              Điều kiện hoàn tiền, mức phí, thời hạn yêu cầu, cách xử lý khi giải bị hoãn hoặc hủy được áp dụng theo chính sách hoàn tiền cấp nền tảng RaceDay đã công bố và các điều kiện hợp lệ của giải. Không mặc nhiên bảo đảm mọi yêu cầu đều được hoàn tiền hoặc mọi khoản phí đều không hoàn lại.
            </p>
            <p>
              Đổi cự ly hoặc chuyển nhượng chỉ được phép nếu điều lệ giải và hệ thống hỗ trợ, được phê duyệt khi cần thiết và hoàn tất ít nhất 07 ngày trước ngày thi đấu theo quy tắc nghiệp vụ hiện tại, trừ ngoại lệ được công bố. Giao dịch chuyển nhượng ngoài quy trình RaceDay có thể không được công nhận.
            </p>
            <p>
              Yêu cầu hoàn tiền được phân biệt với trạng thái đang xử lý và hoàn tiền đã hoàn tất; việc gửi yêu cầu không có nghĩa tiền đã được chuyển trả.
            </p>
          </section>

          <section aria-labelledby="dieu-7">
            <h2 id="dieu-7" tabIndex={-1} className={SECTION_HEADING}>
              7. BIB, mã QR và nhận vật phẩm
            </h2>
            <p>
              Sau khi thanh toán được xác minh, hệ thống có thể cấp BIB theo định dạng được RaceDay tạo tự động và mã QR xác nhận. Runner không được tự ý sửa, làm giả, nhân bản hoặc sử dụng BIB của người khác.
            </p>
            <p>
              Runner phải bảo quản BIB và QR, thực hiện check-in theo hướng dẫn của Organizer và cung cấp thông tin xác minh phù hợp khi nhận BIB hoặc vật phẩm. Khi mất hoặc sai BIB, cần yêu cầu hỗ trợ theo quy trình của giải; không tự ý sử dụng mã thay thế.
            </p>
          </section>

          <section aria-labelledby="dieu-8">
            <h2 id="dieu-8" tabIndex={-1} className={SECTION_HEADING}>
              8. Chip RFID, checkpoint và thời gian thi đấu
            </h2>
            <p>
              Tùy cấu hình giải, chip/thẻ RFID được gắn với BIB và các đầu đọc tại checkpoint ghi nhận lượt đi qua, thời gian và dữ liệu hỗ trợ kết quả. Runner phải đeo và bảo quản BIB/chip đúng hướng dẫn, không tráo chip hoặc cố ý gây nhiễu, giả mạo lượt quét.
            </p>
            <p>
              Dữ liệu RFID có thể thiếu, trùng, trễ hoặc sai do vị trí đeo, thiết bị, sóng hoặc kết nối. Khi có bất thường, Organizer có thể đối chiếu với dữ liệu checkpoint, nhật ký và chứng cứ hợp lệ khác trước khi công bố kết quả chính thức. Một lượt đọc RFID đơn lẻ không mặc nhiên quyết định mọi tranh chấp.
            </p>
          </section>

          <section aria-labelledby="dieu-9">
            <h2 id="dieu-9" tabIndex={-1} className={SECTION_HEADING}>
              9. Quy tắc thi đấu và kết quả
            </h2>
            <p>
              Runner phải tuân thủ tuyến đường, checkpoint, cut-off time và quy tắc thi đấu do Organizer công bố; không gian lận, đi tắt, nhờ người khác chạy thay hoặc can thiệp dữ liệu.
            </p>
            <p>
              Kết quả hiển thị trong thời gian diễn ra giải có thể là tạm thời. Kết quả chính thức, xếp hạng và các trạng thái DNS (không xuất phát), DNF (không hoàn thành), DQ (bị loại) do người có thẩm quyền xác nhận theo điều lệ và dữ liệu kiểm chứng.
            </p>
            <p>
              RaceDay có thể cung cấp chứng nhận hoàn thành dạng số dựa trên kết quả đã được xác nhận; chứng nhận có thể được điều chỉnh khi kết quả chính thức thay đổi.
            </p>
          </section>

          <section aria-labelledby="dieu-10">
            <h2 id="dieu-10" tabIndex={-1} className={SECTION_HEADING}>
              10. Hình ảnh sự kiện và tìm ảnh theo BIB
            </h2>
            <p>
              Ảnh do Photographer hoặc người được phân công tải lên có thể được xử lý bằng OCR/AI để gợi ý BIB xuất hiện trong ảnh, giúp Runner tìm kiếm hình ảnh của mình. Công nghệ nhận diện có thể bỏ sót hoặc gắn sai BIB; kết quả không phải xác nhận chắc chắn danh tính.
            </p>
            <p>
              Runner có thể yêu cầu kiểm tra, chỉnh sửa liên kết BIB–ảnh hoặc báo cáo hình ảnh không phù hợp theo quy trình công bố. Việc dùng ảnh cho mục đích quảng bá riêng cần có cơ sở pháp lý và sự đồng ý phù hợp, không được suy ra chỉ từ việc Runner đăng ký giải.
            </p>
          </section>

          <section aria-labelledby="dieu-11">
            <h2 id="dieu-11" tabIndex={-1} className={SECTION_HEADING}>
              11. Dữ liệu cá nhân và quyền riêng tư
            </h2>
            <p>
              RaceDay có thể xử lý dữ liệu tài khoản, thông tin đăng ký, giao dịch, BIB/QR, RFID checkpoint, kết quả, ảnh và dữ liệu cần thiết cho an toàn, hỗ trợ hoặc khiếu nại. Dữ liệu y tế và vị trí, nếu được thu thập, cần có mục đích rõ ràng và biện pháp bảo vệ phù hợp.
            </p>
            <p>
              Dữ liệu chỉ được chia sẻ với Organizer, nhân sự được phân quyền, PayOS hoặc nhà cung cấp kỹ thuật trong phạm vi cần thiết và theo chính sách quyền riêng tư áp dụng. Runner có thể gửi yêu cầu về quyền dữ liệu cá nhân theo quy trình được công bố; phạm vi xử lý phụ thuộc nghĩa vụ lưu giữ hợp pháp.
            </p>
            <p>
              Thông tin về thời hạn lưu trữ, đầu mối liên hệ, quyền và cơ chế rút lại đồng ý cần được hoàn thiện trong chính sách quyền riêng tư trước khi vận hành thực tế.
            </p>
          </section>

          <section aria-labelledby="dieu-12">
            <h2 id="dieu-12" tabIndex={-1} className={SECTION_HEADING}>
              12. Hành vi bị nghiêm cấm
            </h2>
            <p>
              Không giả mạo tài khoản, thanh toán, BIB, QR, chip RFID, dữ liệu checkpoint hoặc kết quả; không truy cập trái phép tài khoản và hệ thống; không khai thác, phát tán dữ liệu người khác; không quấy rối, gian lận hoặc lạm dụng SOS.
            </p>
            <p>
              RaceDay có thể xác minh, cảnh báo, hạn chế chức năng hoặc tạm khóa tài khoản theo mức độ vi phạm và quy trình công bố. Việc xử lý tài khoản không tự động xóa bỏ nghĩa vụ thanh toán hoặc quyền khiếu nại hợp lệ.
            </p>
          </section>

          <section aria-labelledby="dieu-13">
            <h2 id="dieu-13" tabIndex={-1} className={SECTION_HEADING}>
              13. Khiếu nại và hỗ trợ
            </h2>
            <p>
              Runner có thể khiếu nại về đăng ký, giao dịch, BIB, check-in, checkpoint, kết quả hoặc hình ảnh, kèm mã đăng ký và bằng chứng phù hợp. Theo chính sách dự án hiện tại, khiếu nại liên quan đến giải phải gửi trong vòng 30 ngày kể từ ngày giải kết thúc; thời điểm chốt chính xác cần được công bố.
            </p>
            <p>
              RaceDay có thể tiếp nhận và chuyển các vấn đề thuộc trách nhiệm Organizer để xác minh. Quyết định kết quả thi đấu thuộc người có thẩm quyền của giải; các vấn đề giao dịch cần đối chiếu dữ liệu thanh toán thực tế.
            </p>
          </section>

          <section aria-labelledby="dieu-14">
            <h2 id="dieu-14" tabIndex={-1} className={SECTION_HEADING}>
              14. Thay đổi, hoãn hoặc hủy giải
            </h2>
            <p>
              Organizer chịu trách nhiệm công bố thay đổi quan trọng về thời gian, địa điểm, cự ly, quyền lợi, điều lệ hoặc quyết định hoãn/hủy giải. RaceDay hỗ trợ cập nhật trạng thái và thông báo qua kênh khả dụng.
            </p>
            <p>
              Quyền lợi, phương án chuyển đăng ký và hoàn tiền được giải quyết theo chính sách đã công bố, điều kiện thực tế và pháp luật áp dụng; không mặc nhiên mất quyền lợi chỉ vì sự kiện thay đổi.
            </p>
          </section>

          <section aria-labelledby="dieu-15">
            <h2 id="dieu-15" tabIndex={-1} className={SECTION_HEADING}>
              15. Giới hạn trách nhiệm và giải quyết tranh chấp
            </h2>
            <p>
              RaceDay là nền tảng công nghệ, không bảo đảm mọi dữ liệu thiết bị, RFID, GPS, AI, mạng hoặc thông báo luôn chính xác và liên tục. Organizer chịu trách nhiệm đối với các hoạt động tổ chức và an toàn thực tế trong phạm vi của mình. Các quy định này không loại trừ trách nhiệm bắt buộc theo pháp luật.
            </p>
            <p>
              Các bên ưu tiên xử lý vấn đề thông qua quy trình hỗ trợ và khiếu nại công bố; nếu không đạt được giải pháp, tranh chấp được giải quyết theo pháp luật có liên quan.
            </p>
          </section>

          <section aria-labelledby="dieu-16">
            <h2 id="dieu-16" tabIndex={-1} className={SECTION_HEADING}>
              16. Cập nhật điều khoản và hiệu lực
            </h2>
            <p>
              RaceDay có thể cập nhật điều khoản khi tính năng hoặc chính sách thay đổi, đồng thời công bố phiên bản và thời điểm áp dụng. Thay đổi quan trọng ảnh hưởng quyền lợi Runner cần được thông báo và yêu cầu xác nhận lại khi phù hợp.
            </p>
            <p>
              Tài liệu này là bản dự thảo dành cho đồ án tốt nghiệp, chưa phải văn bản pháp lý hoàn chỉnh. Chủ thể vận hành, thông tin liên hệ chính thức, quy tắc hoàn tiền chi tiết, lưu giữ dữ liệu và thủ tục chấp thuận cần được xác nhận trước khi sử dụng thương mại.
            </p>
            <p>
              Nguồn tham khảo: Điều khoản sử dụng iRace.vn (tham khảo cấu trúc); RaceDay — Điều khoản sử dụng phiên bản 1.4 (23/10/2026). Nội dung đã được biên soạn riêng cho chức năng Runner của RaceDay.
            </p>
          </section>
        </article>
      </div>
    </div>
  );
}
