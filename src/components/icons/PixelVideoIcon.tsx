import { cn } from "@/lib/utils";
import type { SVGProps } from "react";

export default function PixelVideoIcon(props: SVGProps<SVGSVGElement>) {
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
      <path d="M4 4h16v16H4V4z" />
      <path d="M4 4v16h16V4H4zm2 2h12v12H6V6z" />
      <path d="M10 8l6 4-6 4V8z" />
    </svg>
  );
}
