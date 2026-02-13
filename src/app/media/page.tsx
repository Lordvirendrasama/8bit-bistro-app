"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useRef, useEffect } from 'react';
import { videoPlaylist } from '@/lib/video-playlist';

function MediaPage() {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [nextVideoIndex, setNextVideoIndex] = useState(videoPlaylist.length > 1 ? 1 : 0);
  const [isFading, setIsFading] = useState(false);

  const videoRef1 = useRef<HTMLVideoElement>(null);
  const videoRef2 = useRef<HTMLVideoElement>(null);

  const handleVideoEnd = () => {
    if (videoPlaylist.length <= 1) return;
    setIsFading(true);
    
    // After the fade duration, switch the videos
    setTimeout(() => {
      setCurrentVideoIndex(nextVideoIndex);
      setNextVideoIndex((nextVideoIndex + 1) % videoPlaylist.length);
      setIsFading(false);
    }, 1500); // This should match the CSS transition duration
  };

  useEffect(() => {
    const video1 = videoRef1.current;
    if (video1) {
      video1.play().catch(error => {
        // Autoplay is often restricted, this is expected.
        console.error("Video play failed:", error);
      });
    }
  }, [currentVideoIndex]);

  if (videoPlaylist.length === 0) {
    return (
        <div className="min-h-screen pt-10 pb-10">
          <div className="container mx-auto max-w-4xl p-4">
            <h1 className="font-headline text-5xl sm:text-7xl text-center font-black text-primary uppercase tracking-wider mb-8">
              Event Media
            </h1>
            <Card className="overflow-hidden shadow-2xl shadow-primary/10">
              <CardContent className="p-0">
                <div className="aspect-video w-full bg-black flex items-center justify-center text-white p-4 text-center">
                    <p>No videos found. Please add your videos to the `public/videos` folder and update `src/lib/video-playlist.ts`.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
    )
  }

  return (
    <div className="min-h-screen pt-10 pb-10">
      <div className="container mx-auto max-w-4xl p-4">
        <h1 className="font-headline text-5xl sm:text-7xl text-center font-black text-primary uppercase tracking-wider mb-8">
          Event Media
        </h1>
        <Card className="overflow-hidden shadow-2xl shadow-primary/10">
          <CardContent className="p-0">
            <div className="aspect-video w-full bg-black relative">
              {/* Video Player 1 (Foreground) */}
              <video
                ref={videoRef1}
                key={currentVideoIndex}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${isFading ? 'opacity-0' : 'opacity-100'}`}
                src={videoPlaylist[currentVideoIndex].src}
                onEnded={handleVideoEnd}
                autoPlay
                muted
                playsInline
              />
              {/* Video Player 2 (Background, for preloading and fading in) */}
              {videoPlaylist.length > 1 && (
                <video
                  ref={videoRef2}
                  key={nextVideoIndex}
                  className="absolute inset-0 w-full h-full object-cover -z-10" // Hidden in the background
                  src={videoPlaylist[nextVideoIndex].src}
                  preload="auto"
                  muted
                  playsInline
                />
              )}
            </div>
          </CardContent>
        </Card>
         <div className="text-center mt-4 text-muted-foreground">
            Now Playing: {videoPlaylist[currentVideoIndex]?.title ?? '...'}
        </div>
      </div>
    </div>
  );
}

export default function GuardedMediaPage() {
  return (
    <AuthGuard>
      <MediaPage />
    </AuthGuard>
  );
}
