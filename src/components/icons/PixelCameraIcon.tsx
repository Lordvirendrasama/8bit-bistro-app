import { cn } from "@/lib/utils";
import type { SVGProps } from "react";

export default function PixelCameraIcon(props: SVGProps<SVGSVGElement>) {
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
      <path d="M6 7H4v10h16V7h-2" />
      <path d="M12 9h-2v2H8v2h2v2h4v-2h2v-2h-2V9h-2z" />
      <path d="M18 7V5H6v2H4v10h16V7h-2zM6 5h12v2h2v10H4V7h2V5z" />
      <path d="M6 5h12v2H6V5zm12 2h2v10H4V7h2m0-2v2m12-2v2" />
      <path d="M8 9v2H6v2h2v2h2v2h4v-2h2v-2h-2v2h-4v-2h4v-2h2V9h-2v2h-4V9H8z" />
    </svg>
  );
}
