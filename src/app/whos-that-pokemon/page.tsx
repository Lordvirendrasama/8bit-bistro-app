"use client";

import { useRef, useState } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { whosThatPokemonPlaylist, PokemonVideo } from "@/lib/whos-that-pokemon-playlist";
import { Play } from "lucide-react";

function PokemonVideoPlayer({ video }: { video: PokemonVideo }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showResume, setShowResume] = useState(false);

  const PAUSE_TIME = 5; // seconds

  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.currentTime >= PAUSE_TIME && !videoRef.current.paused) {
      videoRef.current.pause();
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
    setShowResume(false);
  };
  
  const handlePause = () => {
    setIsPlaying(false);
    // Only show resume if paused by the time limit logic
    if (videoRef.current && videoRef.current.currentTime >= PAUSE_TIME) {
        setShowResume(true);
    }
  };

  const handleResume = () => {
    if (videoRef.current) {
        videoRef.current.play();
    }
  }

  const handleVideoEnd = () => {
    setIsPlaying(false);
    setShowResume(false);
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>{video.time}</CardTitle>
        <CardDescription>{video.title}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative aspect-video w-full bg-black rounded-md overflow-hidden group">
          <video
            ref={videoRef}
            className="w-full h-full"
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleVideoEnd}
            onPlay={handlePlay}
            onPause={handlePause}
            playsInline
            controls
          >
            <source src={video.src} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          
          {showResume && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 gap-4 transition-all">
                  <p className="text-3xl font-headline text-yellow-300 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">Who's That Pokémon?</p>
                  <Button onClick={handleResume} size="lg" className="font-bold text-lg">Reveal</Button>
              </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


function WhosThatPokemonPage() {
  return (
    <div className="py-10">
      <div className="container mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <h1 className="font-headline text-5xl sm:text-7xl text-center font-black text-primary uppercase tracking-wider mb-8">
          Who's That Pokémon?
        </h1>
        <p className="text-center text-muted-foreground mb-8">
          Videos will automatically pause at 5 seconds. Click Reveal to see the answer!
          <br />
          <span className="font-bold text-amber-400">Important: You must add the video files to the `/public/videos/pokemon/` directory.</span>
        </p>

        <ScrollArea className="h-[70vh]">
            <div className="space-y-6 pr-4">
                {whosThatPokemonPlaylist.map((video) => (
                    <PokemonVideoPlayer key={video.id} video={video} />
                ))}
            </div>
        </ScrollArea>
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
