import { BoxCubeIcon } from "@/icons";
import { cn } from "@/utils";
import Image from "next/image";

interface ProductThumbProps {
  productId: number;
  hasImage: boolean;
  version?: string;
  name: string;
  size?: "sm" | "lg";
  className?: string;
}

export default function ProductThumb({ productId, hasImage, version, name, size = "sm", className }: ProductThumbProps) {
  const box = size === "sm" ? "size-11 rounded-lg" : "aspect-square w-full rounded-2xl";
  if (!hasImage) {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center bg-gray-100 text-gray-400 dark:bg-white/5 dark:text-gray-500",
          box,
          className,
        )}
        aria-hidden="true"
      >
        <BoxCubeIcon className={size === "sm" ? "size-5" : "size-16"} />
      </div>
    );
  }
  const v = version ? `?v=${encodeURIComponent(version)}` : "";
  return (
    <div className={cn("relative shrink-0 overflow-hidden bg-white dark:bg-gray-800", box, className)}>
      <Image
        src={`/api/products/${productId}/image${v}`}
        alt={name}
        fill
        sizes={size === "sm" ? "44px" : "(max-width: 768px) 100vw, 400px"}
        className="object-contain"
        unoptimized
      />
    </div>
  );
}
