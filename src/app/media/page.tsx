"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { Card, CardContent } from "@/components/ui/card";
import YouTube from 'react-youtube';

function MediaPage() {

  const playlistId = "PL94D12C64C0DCE72F";

  const opts = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 1,
      listType: 'playlist',
      list: playlistId,
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
              <YouTube
                opts={opts}
                className="absolute top-0 left-0 w-full h-full"
              />
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
