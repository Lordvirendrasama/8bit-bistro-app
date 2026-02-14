"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { Card, CardContent } from "@/components/ui/card";
import YouTube from 'react-youtube';
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

function MediaPage() {
  const playlistId = "PL94D12C64C0DCE72F";
  const [origin, setOrigin] = useState<string | undefined>(undefined);

  useEffect(() => {
    // This code runs only on the client
    setOrigin(window.location.origin);
  }, []);

  const opts = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 1,
      listType: 'playlist',
      list: playlistId,
      origin: origin,
    },
  };

  return (
    <div className="min-h-screen pt-10 pb-10">
      <div className="container mx-auto max-w-4xl p-4">
        <h1 className="font-headline text-5xl sm:text-7xl text-center font-black text-primary uppercase tracking-wider mb-8">
          Event Media
        </h1>
        <Card className="overflow-hidden shadow-2xl shadow-primary/10">
          <CardContent className="p-0">
            <div className="aspect-video w-full bg-black relative">
              {origin ? (
                <YouTube
                  opts={opts}
                  className="absolute top-0 left-0 w-full h-full"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
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
