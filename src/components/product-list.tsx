import * as React from "react";
import { ProductCard, type ProductCardProps } from "@/components/product-card";
import { cn } from "@/lib/utils";

export interface AdditionProductItem extends ProductCardProps {
  id: string;
  group: "athlete" | "organizer";
  groupTitle: string;
}

export const ADDITION_PRODUCTS: AdditionProductItem[] = [
  // Nhóm 1: Dành cho vận động viên
  {
    id: "bib",
    group: "athlete",
    groupTitle: "Dành cho vận động viên",
    image: "/photos/organizer/bib.jpg",
    title: "Số đeo vận động viên (Bib)",
    features: [
      "Bib khổ A5, in màu một mặt",
      "In thông tin số chạy/số báo danh",
      "Chất liệu giấy chống nước, chống rách",
      "Chưa bao gồm chip tính giờ",
    ],
    pricing: {
      unitPrice: "10.000 đ",
      discount: "20%",
      finalPrice: "8.000 đ",
    },
  },
  {
    id: "finisher-shirt",
    group: "athlete",
    groupTitle: "Dành cho vận động viên",
    image: "/photos/organizer/finisher-shirt.webp",
    title: "Áo Finisher",
    features: [
      "Áo thun thể thao Finisher cao cấp",
      "Vải mè kim thoáng khí, thấm hút mồ hôi",
      "In nhiệt chuyển màu sắc nét, bền màu",
      "Đầy đủ kích thước từ XS đến 3XL",
    ],
    pricing: {
      unitPrice: "150.000 đ",
      discount: "15%",
      finalPrice: "127.500 đ",
    },
  },
  {
    id: "medal",
    group: "athlete",
    groupTitle: "Dành cho vận động viên",
    image: "/photos/organizer/medal.png",
    title: "Huy chương",
    features: [
      "Huy chương kim loại đúc khuôn tinh xảo",
      "Dây đeo in nhiệt họa tiết giải chạy",
      "Mạ màu kim loại cao cấp (Vàng/Bạc/Đồng)",
      "Khắc laser cự ly và thông tin giải",
    ],
    pricing: {
      unitPrice: "65.000 đ",
      discount: "10%",
      finalPrice: "58.500 đ",
    },
  },

  // Nhóm 2: Dành cho ban tổ chức
  {
    id: "chip",
    group: "organizer",
    groupTitle: "Dành cho ban tổ chức",
    image: "/photos/organizer/chip.jpg",
    title: "Chip tính giờ",
    features: [
      "Tần số: UHF 860 - 960 MHz",
      "Bộ nhớ EPC: 96 - 128 bits",
      "Kích thước ăng ten: 90 x 19 mm",
      "Kích thước chip: 93 x 22 mm",
    ],
    pricing: {
      unitPrice: "30.000 đ",
      discount: "40%",
      finalPrice: "18.000 đ",
    },
  },
  {
    id: "time-kit",
    group: "organizer",
    groupTitle: "Dành cho ban tổ chức",
    image: "/photos/organizer/time-kit.webp",
    title: "Hệ thống tính giờ thể thao (Time-Kit)",
    features: [
      "Bộ thiết bị thảm ăng-ten tính giờ chuyên nghiệp",
      "Cổng nhận tín hiệu RFID độ nhạy cao",
      "Tích hợp phần mềm ghi nhận thời gian thực",
      "Hỗ trợ vận hành và kỹ thuật race day",
    ],
    pricing: {
      unitPrice: "15.000.000 đ",
      discount: "20%",
      finalPrice: "12.000.000 đ",
    },
  },
];

export interface ProductListProps {
  products?: AdditionProductItem[];
  selectedIds?: string[];
  onToggle?: (id: string, checked: boolean) => void;
  className?: string;
  showGroupHeaders?: boolean;
}

export function ProductList({
  products = ADDITION_PRODUCTS,
  selectedIds,
  onToggle,
  className,
  showGroupHeaders = true,
}: ProductListProps) {
  if (!showGroupHeaders) {
    return (
      <div className={cn("mx-auto flex w-full max-w-[1450px] flex-col gap-8", className)}>
        {products.map((item) => (
          <ProductCard
            key={item.id}
            id={item.id}
            image={item.image}
            title={item.title}
            features={item.features}
            pricing={item.pricing}
            checked={selectedIds ? selectedIds.includes(item.id) : undefined}
            onCheckedChange={onToggle ? (c) => onToggle(item.id, c) : undefined}
          />
        ))}
      </div>
    );
  }

  const athleteProducts = products.filter((p) => p.group === "athlete");
  const organizerProducts = products.filter((p) => p.group === "organizer");
  const allOrganizerSelected = organizerProducts.every((p) =>
    selectedIds ? selectedIds.includes(p.id) : false
  );

  const handleOrganizerToggle = (checked: boolean) => {
    if (!onToggle) return;
    organizerProducts.forEach((op) => onToggle(op.id, checked));
  };

  return (
    <div className={cn("mx-auto flex w-full max-w-[1450px] flex-col gap-14", className)}>
      {/* Nhóm 1: Dành cho vận động viên */}
      {athleteProducts.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-border/80 pb-4">
            <div>
              <div className="mb-2.5">
                <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#b6e61f] bg-[#222222] px-3.5 py-1.5 rounded-lg border border-[#b6e61f]/25">
                  Vật phẩm thi đấu
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-wide font-condensed uppercase">
                Dành cho vận động viên
              </h2>
            </div>
            <span className="text-xs font-semibold text-muted-foreground">
              {athleteProducts.length} vật phẩm
            </span>
          </div>

          <div className="flex flex-col gap-8">
            {athleteProducts.map((item) => (
              <ProductCard
                key={item.id}
                id={item.id}
                image={item.image}
                title={item.title}
                features={item.features}
                pricing={item.pricing}
                checked={selectedIds ? selectedIds.includes(item.id) : undefined}
                onCheckedChange={onToggle ? (c) => onToggle(item.id, c) : undefined}
              />
            ))}
          </div>
        </section>
      )}

      {/* Nhóm 2: Dành cho ban tổ chức */}
      {organizerProducts.length > 0 && (
        <section className="mt-6 space-y-6 border-t border-border/60 pt-8">
          <div className="flex items-center justify-between border-b border-border/80 pb-4">
            <div>
              <div className="mb-2.5">
                <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#b6e61f] bg-[#222222] px-3.5 py-1.5 rounded-lg border border-[#b6e61f]/25">
                  Thiết bị chuyên nghiệp
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-wide font-condensed uppercase">
                Dành cho ban tổ chức
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                *Áp dụng trọn bộ toàn bộ thiết bị (không áp dụng chọn riêng lẻ)
              </p>
            </div>
            <span className="text-xs font-semibold text-muted-foreground">
              {organizerProducts.length} dịch vụ trọn gói
            </span>
          </div>

          <div className="flex flex-col gap-8">
            {organizerProducts.map((item) => (
              <ProductCard
                key={item.id}
                id={item.id}
                image={item.image}
                title={item.title}
                features={item.features}
                pricing={item.pricing}
                checked={allOrganizerSelected}
                showCheckbox={false}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
