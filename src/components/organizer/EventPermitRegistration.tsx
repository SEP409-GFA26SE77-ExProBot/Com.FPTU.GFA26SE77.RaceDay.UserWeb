"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Info,
  LockKeyhole,
  ShieldCheck,
  Upload,
} from "lucide-react";

const requiredDocuments = [
  { id: "plan", title: "Kế hoạch tổ chức sự kiện", description: "Mục tiêu, quy mô, thời gian, địa điểm và các đơn vị phối hợp.", required: true },
  { id: "program", title: "Chương trình và nội dung thi đấu", description: "Lịch trình, nội dung cự ly, khung giờ xuất phát và đích.", required: true },
  { id: "rules", title: "Điều lệ giải và trọng tài", description: "Điều lệ thi đấu, bộ phận chuyên môn và danh sách trọng tài.", required: true },
  { id: "official-letter", title: "Công văn đề nghị cấp phép", description: "Văn bản của doanh nghiệp gửi UBND Thành phố/Sở Văn hóa và Thể thao.", required: true },
  { id: "foreign-list", title: "Danh sách người nước ngoài tham dự", description: "Họ tên, quốc tịch, hộ chiếu và đơn vị liên hệ (nếu có).", required: false },
  { id: "security", title: "Phương án an ninh, trật tự và PCCC", description: "Bảo vệ, phân luồng, y tế, phòng cháy chữa cháy và môi trường.", required: true },
];

const safetyConditions = [
  "Đã có phương án bảo đảm an ninh, trật tự và phân luồng giao thông.",
  "Đã chuẩn bị phương án phòng cháy, chữa cháy và lối thoát hiểm.",
  "Đã bố trí y tế, xe cấp cứu và điểm hỗ trợ trên đường chạy.",
  "Đã có phương án thu gom rác và hoàn trả mặt bằng sau sự kiện.",
  "Đã lập danh sách người nước ngoài và đầu mối làm việc với cơ quan chức năng (nếu có).",
];

export default function EventPermitRegistration() {
  const [step, setStep] = useState(1);
  const [files, setFiles] = useState<Record<string, string>>({});
  const [conditions, setConditions] = useState<boolean[]>(safetyConditions.map(() => false));
  const [toast, setToast] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  };

  const uploadFile = (id: string, file?: File) => {
    if (file) setFiles((current) => ({ ...current, [id]: file.name }));
  };

  const canContinue = step === 1 || (step === 2 && requiredDocuments.filter((item) => item.required).every((item) => files[item.id])) || (step === 3 && conditions.every(Boolean)) || step === 4;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {toast && <div className="fixed right-5 top-24 z-50 flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-xs font-bold text-white shadow-xl"><CheckCircle2 className="h-4 w-4 text-emerald-400" />{toast}</div>}
      <section className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <Link href="/organizer/events" className="mb-5 inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-orange-600"><ArrowLeft className="h-3.5 w-3.5" /> Quay lại Events</Link>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-orange-600">Event application</p>
          <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Đăng ký tổ chức giải chạy</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Tạo hồ sơ xin cấp phép cho giải chạy. Hồ sơ sẽ được kiểm tra trước khi sự kiện được công khai.</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600"><LockKeyhole className="h-4 w-4 text-emerald-600" /> Lưu nháp tự động</div>
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-6">
        <div className="grid gap-3 md:grid-cols-4">{["Thông tin giải", "Hồ sơ bắt buộc", "Điều kiện an toàn", "Rà soát & gửi"].map((label, index) => { const current = index + 1; return <button key={label} onClick={() => current <= step && setStep(current)} className={`flex items-center gap-3 rounded-xl p-3 text-left transition ${step === current ? "bg-orange-50 text-orange-700" : current < step ? "text-emerald-700 hover:bg-emerald-50" : "text-slate-400"}`}><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black ${step === current ? "bg-orange-500 text-white" : current < step ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"}`}>{current < step ? <Check className="h-4 w-4" /> : current}</span><span><strong className="block text-xs">{label}</strong><small className="mt-0.5 block text-[10px] opacity-70">Bước {current}/4</small></span></button>; })}</div>
      </section>

      {submitted ? <SuccessState /> : <>
        {step === 1 && <BasicInfoStep />}
        {step === 2 && <DocumentsStep files={files} onUpload={uploadFile} />}
        {step === 3 && <SafetyStep conditions={conditions} onChange={(index) => setConditions((current) => current.map((checked, item) => item === index ? !checked : checked))} />}
        {step === 4 && <ReviewStep files={files} conditions={conditions} />}

        <div className="flex flex-col-reverse justify-between gap-3 sm:flex-row">
          <button onClick={() => step > 1 ? setStep(step - 1) : showToast("Bản nháp đã được lưu")} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:border-orange-300 hover:text-orange-600">{step > 1 ? <><ArrowLeft className="h-4 w-4" /> Quay lại</> : "Lưu bản nháp"}</button>
          <button disabled={!canContinue} onClick={() => step < 4 ? setStep(step + 1) : setSubmitted(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-slate-950/15 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-40">{step < 4 ? <>Tiếp tục <ArrowRight className="h-4 w-4" /></> : <>Gửi hồ sơ thẩm định <ClipboardCheck className="h-4 w-4" /></>}</button>
        </div>
      </>}
    </div>
  );
}

function BasicInfoStep() {
  return <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm"><div className="mb-6 flex items-start gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600"><Info className="h-5 w-5" /></span><div><h2 className="text-lg font-black text-slate-950">Thông tin giải chạy</h2><p className="mt-1 text-xs text-slate-500">Các thông tin sẽ xuất hiện trong hồ sơ xin phép và trang công khai sự kiện.</p></div></div><div className="grid gap-5 md:grid-cols-2"><Field label="Tên giải chạy *" value="Ho Chi Minh City Marathon 2026" /><Field label="Đơn vị tổ chức *" value="RaceDay Event Company" /><Field label="Ngày tổ chức *" value="2026-10-20" type="date" /><Field label="Thời gian bắt đầu *" value="05:30" type="time" /><Field label="Địa điểm / tỉnh thành *" value="Quận 1, Thành phố Hồ Chí Minh" /><Field label="Quy mô dự kiến *" value="2,500 người" /><Field label="Người phụ trách hồ sơ *" value="Vũ Thanh Phong" /><Field label="Số điện thoại liên hệ *" value="0906789012" /><Field label="Email nhận phản hồi *" value="organizer@raceday.vn" type="email" /><label className="block space-y-1.5 md:col-span-2"><span className="text-xs font-bold text-slate-600">Mô tả và mục tiêu sự kiện</span><textarea defaultValue="Giải chạy cộng đồng với các cự ly 5 KM, 10 KM và 21 KM, khuyến khích lối sống lành mạnh." className="min-h-24 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-800 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" /></label></div><div className="mt-6 rounded-xl border border-orange-100 bg-orange-50 p-4 text-xs leading-5 text-orange-900"><strong>Cự ly dự kiến:</strong> 5 KM · 10 KM · 21 KM. Quy mô từ 1.000 đến 5.000 người cần kèm kế hoạch tổ chức chi tiết và phương án phối hợp cơ quan chức năng.</div></section>;
}

function DocumentsStep({ files, onUpload }: { files: Record<string, string>; onUpload: (id: string, file?: File) => void }) {
  return <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm"><div className="mb-6 flex items-start gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><FileText className="h-5 w-5" /></span><div><h2 className="text-lg font-black text-slate-950">Hồ sơ và giấy tờ</h2><p className="mt-1 text-xs text-slate-500">Tải lên PDF, DOCX hoặc XLSX. Dung lượng mỗi file tối đa 20 MB.</p></div></div><div className="space-y-3">{requiredDocuments.map((document) => <div key={document.id} className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500"><FileText className="h-5 w-5" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-bold text-slate-800">{document.title}</p>{document.required ? <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">Bắt buộc</span> : <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">Nếu có</span>}</div><p className="mt-1 text-xs leading-5 text-slate-500">{document.description}</p>{files[document.id] && <p className="mt-2 truncate text-xs font-bold text-emerald-600"><CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />{files[document.id]}</p>}</div><label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:border-orange-300 hover:text-orange-600"><Upload className="h-3.5 w-3.5" /> {files[document.id] ? "Đổi file" : "Tải lên"}<input type="file" className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx" onChange={(event) => onUpload(document.id, event.target.files?.[0])} /></label></div>)}</div><div className="mt-5 flex items-start gap-2 text-xs leading-5 text-slate-500"><Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />Danh sách người nước ngoài cần có họ tên, quốc tịch, số hộ chiếu và thông tin đơn vị liên hệ để phối hợp hướng dẫn thủ tục.</div></section>;
}

function SafetyStep({ conditions, onChange }: { conditions: boolean[]; onChange: (index: number) => void }) {
  return <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm"><div className="mb-6 flex items-start gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><ShieldCheck className="h-5 w-5" /></span><div><h2 className="text-lg font-black text-slate-950">Điều kiện an toàn và phối hợp</h2><p className="mt-1 text-xs text-slate-500">Organizer xác nhận đã chuẩn bị các phương án theo yêu cầu của cơ quan cấp phép.</p></div></div><div className="space-y-3">{safetyConditions.map((condition, index) => <label key={condition} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${conditions[index] ? "border-emerald-200 bg-emerald-50/60" : "border-slate-200 hover:border-orange-200"}`}><input type="checkbox" checked={conditions[index]} onChange={() => onChange(index)} className="mt-0.5 h-4 w-4 accent-emerald-600" /><span className="text-sm leading-6 text-slate-700">{condition}</span>{conditions[index] && <Check className="ml-auto h-4 w-4 shrink-0 text-emerald-600" />}</label>)}</div><div className="mt-6 grid gap-4 md:grid-cols-2"><Field label="Đầu mối làm việc với cơ quan chức năng" value="Lê Minh Châu · 0903456789" /><Field label="Đơn vị y tế phối hợp" value="Bệnh viện Quận 1 · 028 3829 1711" /><Field label="Số chốt an ninh / phân luồng" value="18" /><Field label="Số điểm tiếp nước / hỗ trợ" value="12" /></div></section>;
}

function ReviewStep({ files, conditions }: { files: Record<string, string>; conditions: boolean[] }) {
  const uploaded = requiredDocuments.filter((item) => files[item.id]).length;
  return <section className="space-y-4"><div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm"><div className="mb-5 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600"><ClipboardCheck className="h-5 w-5" /></span><div><h2 className="text-lg font-black text-slate-950">Rà soát hồ sơ</h2><p className="mt-1 text-xs text-slate-500">Kiểm tra lại trước khi gửi yêu cầu thẩm định.</p></div></div><div className="grid gap-3 sm:grid-cols-3"><Summary label="Thông tin giải" value="Đã hoàn tất" /><Summary label="Tài liệu bắt buộc" value={`${uploaded}/5 tài liệu`} /><Summary label="Điều kiện an toàn" value={`${conditions.filter(Boolean).length}/${safetyConditions.length} đã xác nhận`} /></div></div><div className="rounded-2xl border border-orange-100 bg-orange-50 p-5 text-sm leading-6 text-orange-950"><strong>Cam kết của đơn vị tổ chức:</strong> Tôi chịu trách nhiệm về tính chính xác của hồ sơ, bảo đảm an ninh, trật tự, phòng cháy chữa cháy, y tế, vệ sinh môi trường và phối hợp với cơ quan chức năng trong suốt sự kiện.</div></section>;
}

function Summary({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-2 text-sm font-black text-emerald-700">{value}</p></div>; }
function Field({ label, value, type = "text" }: { label: string; value?: string; type?: string }) { return <label className="block space-y-1.5"><span className="text-xs font-bold text-slate-600">{label}</span><input type={type} defaultValue={value} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" /></label>; }
function SuccessState() { return <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center shadow-sm"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white"><Check className="h-7 w-7" /></span><h2 className="mt-5 text-2xl font-black text-emerald-950">Đã gửi hồ sơ thành công</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-emerald-800">Mã hồ sơ <strong>RD-2026-0018</strong> đang chờ bộ phận thẩm định kiểm tra. Organizer sẽ nhận thông báo qua email khi có cập nhật.</p><Link href="/organizer/events" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-800">Quay lại Events <ArrowRight className="h-4 w-4" /></Link></section>; }
