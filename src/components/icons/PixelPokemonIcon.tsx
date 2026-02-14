import { cn } from "@/lib/utils";
import type { SVGProps } from "react";

export default function PixelPokemonIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="crispEdges"
      {...props}
      className={cn("w-6 h-6", props.className)}
    >
      <path fill="#F00" d="M4 4h16v7H4z" />
      <path fill="#FFF" d="M4 13h16v7H4z" />
      <path fill="#000" d="M4 10h16v3H4z" />
      <path fill="#FFF" d="M10 10h4v3h-4z" />
      <path fill="#000" d="M11 11h2v1h-2z" />
    </svg>
  );
}
