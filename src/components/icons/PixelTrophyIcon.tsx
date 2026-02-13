import { cn } from "@/lib/utils";
import type { SVGProps } from "react";

export default function PixelTrophyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="butt"
      strokeLinejoin="miter"
      shapeRendering="crispEdges"
      {...props}
      className={cn("w-6 h-6", props.className)}
    >
      <path d="M9 2v2H7v2H5v2H3v2h2v2h2v2h2v-2h2V8h2V6h2V4h-2V2H9z" />
      <path d="M11 14h2v6h-2v-6z" />
      <path d="M8 20h8v2H8v-2z" />
    </svg>
  );
}
