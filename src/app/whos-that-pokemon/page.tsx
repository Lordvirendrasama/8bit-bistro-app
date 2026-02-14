"use client";

import { useRef, useState } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  whosThatPokemonPlaylist,
  PokemonVideo,
} from "@/lib/whos-that-pokemon-playlist";
import { Play } from "lucide-react";
import { OverallLeaderboard } from "@/components/leaderboard/OverallLeaderboard";
import { SponsorLogos } from "@/components/SponsorLogos";

function PokemonVideoPlayer({ video }: { video: PokemonVideo }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [gameState, setGameState] = useState<
    "initial" | "playing" | "paused" | "revealed"
  >("initial");

  const PAUSE_TIME = 5;

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setGameState("playing");
    }
  };

  const handleTimeUpdate = () => {
    if (
      videoRef.current &&
      videoRef.current.currentTime >= PAUSE_TIME &&
      gameState === "playing"
    ) {
      videoRef.current.pause();
      setGameState("paused");
    }
  };

  const handleResume = () => {
    if (videoRef.current) {
      // Unmute and play
      videoRef.current.muted = false;
      videoRef.current.play();
      setGameState("revealed");
    }
  };

  const handleVideoEnd = () => {
    if (videoRef.current) {
      // Reset for next playthrough
      videoRef.current.currentTime = 0;
      videoRef.current.muted = true; // Mute it again for the next play
    }
    setGameState("initial");
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>{video.time}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative aspect-video w-full bg-black rounded-md overflow-hidden group">
          <video
            ref={videoRef}
            className="w-full h-full"
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleVideoEnd}
            playsInline
            muted // Start muted to allow programmatic play
          >
            <source src={video.src} type="video/mp4" />
            Your browser does not support the video tag.
          </video>

          {gameState === "initial" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Button
                onClick={handlePlay}
                size="lg"
                className="font-bold text-lg"
              >
                <Play className="mr-2 h-6 w-6" />
                Play
              </Button>
            </div>
          )}

          {gameState === "paused" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 gap-4 transition-all">
              <p className="text-3xl font-headline text-yellow-300 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                Who's That Pokémon?
              </p>
              <Button
                onClick={handleResume}
                size="lg"
                className="font-bold text-lg"
              >
                Reveal
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function WhosThatPokemonPage() {
  return (
    <div className="container mx-auto max-w-full px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center mb-8">
        <h1 className="font-headline text-5xl sm:text-7xl font-black text-primary uppercase tracking-wider">
          Who's That Pokémon?
        </h1>
        <p className="text-muted-foreground mt-2">
          Videos will automatically pause at 5 seconds. Click Reveal to see the
          answer!
          <br />
          <span className="font-bold text-amber-400">
            Important: You must add the video files to the
            `/public/videos/pokemon/` directory.
          </span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-1">
          <OverallLeaderboard />
        </div>

        <div className="lg:col-span-3">
          <ScrollArea className="h-[80vh] lg:h-[calc(100vh-200px)]">
            <div className="space-y-6 pr-4">
              {whosThatPokemonPlaylist.map((video) => (
                <PokemonVideoPlayer key={video.id} video={video} />
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="lg:col-span-1">
          <SponsorLogos />
        </div>
      </div>
    </div>
  );
}

export default function GuardedWhosThatPokemonPage() {
  return (
    <AuthGuard>
      <WhosThatPokemonPage />
    </AuthGuard>
  );
}
