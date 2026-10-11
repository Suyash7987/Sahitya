import { cn } from "@/lib/utils";
import Image from "next/image";

export function Logo({
  className,
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/final_logo_light.webp"
      alt="All World Gayatri Pariwar Bengaluru"
      width={640}
      height={296}
      priority={priority}
      className={cn("h-auto w-auto object-contain", className)}
    />
  );
}
