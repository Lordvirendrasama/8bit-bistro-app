import PixelTrophyIcon from "@/components/icons/PixelTrophyIcon";

export default function Logo() {
    return (
        <div className="flex items-center gap-2">
          <PixelTrophyIcon className="w-8 h-8 text-primary" />
          <h1 className="font-headline text-2xl font-bold tracking-tighter text-foreground">
            Pixel Podium
          </h1>
        </div>
    )
}
