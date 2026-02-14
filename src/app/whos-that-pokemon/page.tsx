"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Play,
  RefreshCw,
  StepForward,
  StepBack,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { OverallLeaderboard } from "@/components/leaderboard/OverallLeaderboard";
import { SponsorLogos } from "@/components/SponsorLogos";

// 1. Playlist
const playlist = [
  "Correct (1).mp4", "Correct (2).mp4", "Fake Pikachu (1).mp4",
  "Fake Pikachu (2).mp4", "Correct (3).mp4", "Fake Pikachu (3).mp4",
  "Correct (4).mp4", "Correct (5).mp4", "Fake Pikachu (4).mp4",
  "Fake Meowth.mp4", "Fake Pikachu (5).mp4", "Correct (6).mp4",
  "Fake Pikachu (6).mp4", "Fake Pikachu (7).mp4", "Fake Pikachu (8).mp4",
  "Correct (7).mp4", "Fake Pikachu (9).mp4", "Correct (8).mp4",
  "Correct (9).mp4", "Correct (10).mp4", "Pikachu is Goku.mp4"
];

const PAUSE_TIME = 5;

// 2. Video Player Component
function WhosThatPokemonPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [gameState, setGameState] = useState<"idle" | "playing" | "paused" | "revealed" | "finished" | "error">("idle");
  const [isDesktop, setIsDesktop] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const animationFrameRef = useRef<number>();

  // Check for desktop for host controls
  useEffect(() => {
    // Ensure window is defined (runs only on client)
    if (typeof window !== "undefined") {
      const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024); // lg breakpoint
      checkDesktop();
      window.addEventListener("resize", checkDesktop);
      return () => window.removeEventListener("resize", checkDesktop);
    }
  }, []);

  // 3. 5-Second Freeze Logic
  const monitorPlayback = useCallback(() => {
    if (!videoRef.current) return;

    if (videoRef.current.currentTime >= PAUSE_TIME && gameState === 'playing') {
      videoRef.current.pause();
      videoRef.current.currentTime = PAUSE_TIME; // Lock it
      setGameState("paused");
    } else {
      // Continue monitoring only if playing
      if (gameState === 'playing') {
        animationFrameRef.current = requestAnimationFrame(monitorPlayback);
      }
    }
  }, [gameState]);

  const handlePlay = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    const playPromise = videoRef.current.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setGameState("playing");
          animationFrameRef.current = requestAnimationFrame(monitorPlayback);
        })
        .catch((error) => {
          console.error("Video play failed:", error);
          handleVideoError();
        });
    }
  };

  // 4. Reveal System
  const handleReveal = () => {
    if (!videoRef.current || gameState !== 'paused') return;
    
    videoRef.current.muted = false; // Unmute for the reveal
    setGameState("revealed");

    // Ensure playback continues from the exact pause time
    videoRef.current.currentTime = PAUSE_TIME; 
    const playPromise = videoRef.current.play();
    if (playPromise !== undefined) {
       playPromise.catch((error) => {
        console.error("Reveal play failed:", error);
        handleVideoError();
      });
    }
  };

  // 5. End of Video
  const handleVideoEnded = () => {
    setGameState("finished");
    setTimeout(() => {
      // Go to next video but don't autoplay
      setCurrentIndex((prev) => (prev + 1) % playlist.length);
    }, 2000); // 2-second delay before loading the next video
  };

  // 6. Error Handling
  const handleVideoError = () => {
    if (gameState === 'error') return; // Prevent multiple triggers
    setGameState("error");
    setTimeout(() => {
      // Go to next video but don't autoplay
      setCurrentIndex((prev) => (prev + 1) % playlist.length);
    }, 2000);
  };

  // Cleanup animation frame
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);
  
  // Make sure video reloads and is reset when index changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.muted = true; // Start every new video muted
      setGameState('idle'); // Reset state for new video
    }
  }, [currentIndex]);


  // 8. Host Controls
  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % playlist.length);
  };
  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
  };
  const handleRestart = () => {
    if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.muted = true; // Also re-mute on restart
    }
    setGameState("idle");
  };

  const videoSrc = `/videos/${encodeURIComponent(playlist[currentIndex])}`;

  return (
    <div className="container mx-auto p-4 py-10 min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_300px] xl:grid-cols-[350px_1fr_350px] gap-8 items-start">
        <div className="hidden lg:block">
          <OverallLeaderboard />
        </div>

        <div className="w-full">
            <p className="text-center text-lg text-muted-foreground mb-2 font-headline">
                Round {currentIndex + 1} of {playlist.length}
            </p>
          <Card className="w-full overflow-hidden border-4 border-primary bg-zinc-900 shadow-2xl shadow-primary/30">
            <CardContent className="p-0">
              <div className="relative aspect-[9/16] w-full mx-auto max-w-sm bg-black">
                <video
                  ref={videoRef}
                  key={videoSrc}
                  className="h-full w-full object-contain"
                  playsInline
                  preload="metadata"
                  controls={false}
                  muted // Start muted, unmute on reveal
                  onEnded={handleVideoEnded}
                  onError={handleVideoError}
                >
                  <source src={videoSrc} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>

                {/* Overlays */}
                {gameState === "idle" && (
                  <div className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/50" onClick={handlePlay}>
                    <Button
                      size="lg"
                      className="pointer-events-none font-headline text-2xl h-20 w-48 bg-green-500 text-white hover:bg-green-600"
                    >
                      <Play className="mr-2 h-8 w-8" />
                      PLAY
                    </Button>
                  </div>
                )}
                {gameState === "paused" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/70 transition-all">
                    <h1 className="text-4xl lg:text-5xl font-headline text-yellow-300 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] text-center">
                      Who's That Pokemon?
                    </h1>
                    <Button
                      onClick={handleReveal}
                      size="lg"
                      className="font-headline text-xl h-16 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Reveal Pokemon
                    </Button>
                  </div>
                )}
                {gameState === "finished" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                    <div className="flex items-center gap-4 font-headline text-xl md:text-3xl text-white text-center">
                      <Loader2 className="h-10 w-10 animate-spin" />
                      Next Challenger...
                    </div>
                  </div>
                )}
                {gameState === "error" && (
                  <div className="absolute inset-0 flex flex-col gap-2 items-center justify-center bg-black/80 p-4">
                    <div className="flex items-center gap-4 font-headline text-xl md:text-3xl text-red-500">
                      <AlertTriangle className="h-10 w-10" />
                       Video Cartridge Dirty
                    </div>
                     <div className="flex items-center gap-4 font-headline text-xl md:text-3xl text-white">
                      <Loader2 className="h-8 w-8 animate-spin" />
                      Loading Next...
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
           {isDesktop && (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Button variant="outline" onClick={handlePrev} disabled={gameState !== 'idle' && gameState !== 'finished'}>
                <StepBack className="mr-2" /> Prev
              </Button>
              <Button variant="outline" onClick={handleRestart}>
                <RefreshCw className="mr-2" /> Restart
              </Button>
              <Button 
                variant="outline"
                onClick={handleReveal}
                disabled={gameState !== 'paused'}
                className="disabled:opacity-50"
              >
                Reveal
              </Button>
              <Button
                variant="outline"
                onClick={handlePlay}
                disabled={gameState !== 'idle'}
                className="disabled:opacity-50"
              >
                Play
              </Button>
              <Button variant="outline" onClick={handleNext} disabled={gameState !== 'idle' && gameState !== 'finished'}>
                Next <StepForward className="ml-2" />
              </Button>
            </div>
          )}
        </div>
        
        <div className="hidden lg:block">
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
