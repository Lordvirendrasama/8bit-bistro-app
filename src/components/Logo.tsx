import Image from "next/image";
import { cn } from "@/lib/utils";

export default function Logo({ className }: { className?: string }) {
  return (
    <Image
      src="/THE 8 BIT BISTRO.png"
      alt="The 8Bit Bistro Logo"
      width={1000}
      height={250}
      priority
      className={cn("h-40 w-auto", className)}
    />
  );
}
