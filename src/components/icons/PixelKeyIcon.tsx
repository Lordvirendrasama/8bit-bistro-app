import { cn } from "@/lib/utils";
import type { SVGProps } from "react";

export default function PixelKeyIcon(props: SVGProps<SVGSVGElement>) {
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
      <path d="M14 2H8v2H6v2H4v2h2v2h2v2h2v-2h2v-2h2V6h-2V4h-2V2z" />
      <path d="M10 14v8h2v-4h2v-2h2v-2h-4v2h-2z" />
    </svg>
  );
}
