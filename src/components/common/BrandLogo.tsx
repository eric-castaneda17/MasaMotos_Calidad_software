import { BRAND } from "@/config/brand";
import { cn } from "@/utils";
import Image from "next/image";

interface BrandLogoProps {
  /** full: logo completo · mark: escudo · lockup: escudo + nombre en una línea. */
  variant?: "full" | "mark" | "lockup";
  height?: number;
  /** Sin recuadro negro: solo para superficies negras (el logo trae su propio fondo negro). */
  bare?: boolean;
  priority?: boolean;
  className?: string;
}

export default function BrandLogo({ variant = "full", height = 48, bare = false, priority = false, className }: BrandLogoProps) {
  const frame = bare ? "" : "rounded-xl bg-black ring-1 ring-black/5 dark:ring-white/10";

  if (variant === "mark") {
    return (
      <span className={cn("inline-flex shrink-0 overflow-hidden", frame, className)} style={{ width: height, height }}>
        <Image src={BRAND.mark} alt={BRAND.name} width={height} height={height} className="h-full w-full object-contain" priority={priority} />
      </span>
    );
  }

  if (variant === "lockup") {
    return (
      <span className={cn("inline-flex items-center gap-2.5", className)}>
        <span className="inline-flex shrink-0 overflow-hidden rounded-lg bg-black" style={{ width: height, height }}>
          <Image src={BRAND.mark} alt="" width={height} height={height} className="h-full w-full object-contain" priority={priority} />
        </span>
        <span className="text-lg leading-none font-black tracking-tight italic">
          <span className="text-navy-500 dark:text-navy-400">MASA</span>{" "}
          <span className="text-brand-500">MOTOS</span>
        </span>
      </span>
    );
  }

  const { width: w, height: h } = BRAND.fullLogoSize;
  const width = Math.round((height * w) / h);
  return (
    <span className={cn("inline-flex shrink-0 overflow-hidden", frame, className)}>
      <Image
        src={BRAND.fullLogo}
        alt={BRAND.name}
        width={width}
        height={height}
        className="object-contain"
        style={{ width, height }}
        priority={priority}
      />
    </span>
  );
}
