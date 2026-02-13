import { cn } from "@/lib/utils";
import type { SVGProps } from "react";

export default function PixelLeaderboardIcon(props: SVGProps<SVGSVGElement>) {
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
        <path d="M8 21V11h2v10H8z" />
        <path d="M14 21V5h2v16h-2z" />
        <path d="M20 21V15h2v6h-2z" />
        <path d="M2 21h20v2H2v-2z" />
    </svg>
  );
}
