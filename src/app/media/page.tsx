"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { Card, CardContent } from "@/components/ui/card";

function MediaPage() {
  const videoPlaylistUrl =
    "https://www.youtube.com/embed/videoseries?list=PLYVjGTi85afou-GAHkhC6OgU7Merg0G0B";

  return (
    <div className="min-h-screen pt-10 pb-10">
      <div className="container mx-auto max-w-4xl p-4">
        <h1 className="font-headline text-5xl sm:text-7xl text-center font-black text-primary uppercase tracking-wider mb-8">
          Event Media
        </h1>
        <Card className="overflow-hidden shadow-2xl shadow-primary/10">
          <CardContent className="p-0">
            <div className="aspect-video w-full bg-black flex items-center justify-center">
              <iframe
                src={videoPlaylistUrl}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full"
              ></iframe>
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
