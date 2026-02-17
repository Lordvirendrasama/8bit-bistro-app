
"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { Card, CardContent } from "@/components/ui/card";
import YouTube, { YouTubeProps } from 'react-youtube';
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useDoc, useMemoFirebase, useFirestore } from "@/firebase";
import { doc } from "firebase/firestore";
import type { MediaConfig } from "@/types";

const MEDIA_CONFIG_PATH = "config/media";

function MediaPage() {
  const firestore = useFirestore();
  const mediaConfigDoc = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, MEDIA_CONFIG_PATH);
  }, [firestore]);

  const { data: mediaConfig, isLoading: isLoadingConfig } = useDoc<MediaConfig>(mediaConfigDoc);

  // Fallback to the original hardcoded ID if the config doesn't exist or is loading
  const playlistId = mediaConfig?.playlistId || "PLNMTXgsQnLlCAYdQGh3sVAvun2hWZ_a6x";

  const [opts, setOpts] = useState<YouTubeProps['opts'] | null>(null);

  useEffect(() => {
    // This effect runs only on the client, after the component has mounted.
    // This is where we can safely access `window`.
    setOpts({
      height: '100%',
      width: '100%',
      playerVars: {
        autoplay: 1,
        listType: 'playlist',
        list: playlistId,
        // window.location.origin is now guaranteed to be available.
        origin: window.location.origin,
      },
    });
  }, [playlistId]); // The effect will re-run if the playlistId changes.

  return (
    <div className="min-h-screen pt-10 pb-10">
      <div className="container mx-auto max-w-4xl p-4">
        <h1 className="font-headline text-5xl sm:text-7xl text-center font-black text-primary uppercase tracking-wider mb-8">
          Event Media
        </h1>
        <Card className="overflow-hidden shadow-2xl shadow-primary/10">
          <CardContent className="p-0">
            <div className="aspect-video w-full bg-black relative">
              {isLoadingConfig || !opts ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
              ) : (
                <YouTube
                  opts={opts}
                  className="absolute top-0 left-0 w-full h-full"
                />
              )}
            </div>
          </CardContent>
        </Card>
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
