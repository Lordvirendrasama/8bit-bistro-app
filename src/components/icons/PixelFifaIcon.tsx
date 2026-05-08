
import { cn } from "@/lib/utils";
import type { SVGProps } from "react";

export default function PixelFifaIcon(props: SVGProps<SVGSVGElement>) {
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
      <path d="M12 4v16" />
      <path d="M4 12h16" />
      <path d="M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" />
      <circle cx="12" cy="12" r="3" />
      <path d="M7 7l2 2" />
      <path d="M15 7l2 2" />
      <path d="M7 15l2 2" />
      <path d="M15 15l2 2" />
    </svg>
  );
}
