import { redirect } from "next/navigation";

/** Alias cũ — chuyển sang form tạo giải mới */
export default function RegisterEventAliasPage() {
  redirect("/events/create");
}
