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
import { cn } from "@/lib/utils";

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
const SCHEDULE_INTERVAL_MS = 10 * 1000; // 10 seconds
const VIDEO_INTERVAL_MINUTES = 30;

// 7. Timezone (Café Clock)
function getCafeTime(): Date {
  const now = new Date();
  // IST is UTC+5:30. We calculate the offset from the client's timezone to UTC, then add the IST offset.
  const istOffset = 5.5 * 60;
  const clientOffset = now.getTimezoneOffset();
  const totalOffset = (istOffset + clientOffset) * 60 * 1000;
  return new Date(now.getTime() + totalOffset);
}

function getScheduledIndex(): { status: "preshow" | "ended" | "live"; index: number } {
  const cafeTime = getCafeTime();
  const showStartTime = new Date(cafeTime);
  showStartTime.setHours(13, 30, 0, 0); // 1:30 PM IST

  if (cafeTime < showStartTime) {
    return { status: "preshow", index: -1 };
  }

  const minutesSinceStart = (cafeTime.getTime() - showStartTime.getTime()) / (1000 * 60);
  const videoIndex = Math.floor(minutesSinceStart / VIDEO_INTERVAL_MINUTES);

  if (videoIndex >= playlist.length) {
    return { status: "ended", index: playlist.length };
  }

  return { status: "live", index: videoIndex };
}

// 2. Video Player Component
function WhosThatPokemonPage() {
  const [scheduledIndex, setScheduledIndex] = useState(-1);
  const [showStatus, setShowStatus] = useState<"preshow" | "ended" | "live">("preshow");

  const [currentIndex, setCurrentIndex] = useState(0);
  const [gameState, setGameState] = useState<"idle" | "playing" | "paused" | "revealed" | "finished" | "error">("idle");
  const [isDesktop, setIsDesktop] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const animationFrameRef = useRef<number>();

  // Schedule effect
  useEffect(() => {
    const updateSchedule = () => {
      const { status, index } = getScheduledIndex();
      setShowStatus(status);
      if (status === "live") {
        // Only update if the scheduled index has changed
        if (index !== scheduledIndex) {
          setScheduledIndex(index);
          setCurrentIndex(index);
          setGameState("idle");
          // This forces the video element to reload with the new source
          videoRef.current?.load();
        }
      }
    };

    updateSchedule();
    const intervalId = setInterval(updateSchedule, SCHEDULE_INTERVAL_MS);
    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduledIndex]);

  // Check for desktop for host controls
  useEffect(() => {
    // Ensure window is defined (runs only on client)
    if (typeof window !== "undefined") {
      const checkDesktop = () => setIsDesktop(window.innerWidth >= 768);
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
      animationFrameRef.current = requestAnimationFrame(monitorPlayback);
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
      setCurrentIndex((prev) => (prev + 1) % playlist.length);
      setGameState("idle");
    }, 2000);
  };

  // 6. Error Handling
  const handleVideoError = () => {
    if (gameState === 'error') return; // Prevent multiple triggers
    setGameState("error");
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % playlist.length);
      setGameState("idle");
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

  // 8. Host Controls
  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % playlist.length);
    setGameState("idle");
  };
  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
    setGameState("idle");
  };
  const handleRestart = () => {
    if (videoRef.current) videoRef.current.currentTime = 0;
    setGameState("idle");
  };

  const videoSrc = `/videos/pokemon/${encodeURIComponent(playlist[currentIndex])}`;

  if (showStatus === "preshow") {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black text-white">
        <div className="text-center font-headline text-4xl text-yellow-300">
          The show begins at 1:30 PM
        </div>
      </div>
    );
  }

  if (showStatus === "ended") {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black text-white">
        <div className="text-center font-headline text-4xl text-yellow-300">
          Today's episode has ended
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-black p-4">
      <Card className="w-full max-w-4xl overflow-hidden border-4 border-primary bg-zinc-900 shadow-2xl shadow-primary/30">
        <CardContent className="p-0">
          <div className="relative aspect-video w-full">
            <video
              ref={videoRef}
              key={videoSrc}
              className="h-full w-full object-contain"
              playsInline
              preload="metadata"
              controls={false}
              muted
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
                  className="pointer-events-none font-headline text-2xl h-20 w-48 bg-green-500 text-white"
                >
                  <Play className="mr-2 h-8 w-8" />
                  PLAY
                </Button>
              </div>
            )}
            {gameState === "paused" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/70 transition-all">
                <h1 className="text-5xl font-headline text-yellow-300 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
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
                <div className="flex items-center gap-4 font-headline text-3xl text-white">
                  <Loader2 className="h-10 w-10 animate-spin" />
                  Next Challenger Loading...
                </div>
              </div>
            )}
            {gameState === "error" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                <div className="flex items-center gap-4 font-headline text-3xl text-red-500">
                  <AlertTriangle className="h-10 w-10" />
                  Video Cartridge Dirty — Loading Next...
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {isDesktop && (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Button variant="outline" onClick={handlePrev}>
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
          <Button variant="outline" onClick={handleNext}>
            Next <StepForward className="ml-2" />
          </Button>
        </div>
      )}
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
