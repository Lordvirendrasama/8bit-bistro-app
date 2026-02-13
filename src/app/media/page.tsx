"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import Header from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";

function MediaPage() {
  const videoPlaylistUrl = "https://www.youtube.com/embed/videoseries?list=PLpVUv6bJ_0kA-v57b-7xO7zL4A4y3D2S6&autoplay=1&loop=1&controls=0&mute=1";

  return (
    <>
      <Header />
      <div className="container mx-auto max-w-4xl p-4">
        <h1 className="font-headline text-3xl mb-4">Event Media</h1>
        <Card className="overflow-hidden shadow-2xl shadow-primary/10">
          <CardContent className="p-0">
            <div className="aspect-video w-full bg-black">
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
    </>
  );
}

export default function GuardedMediaPage() {
  return (
    <AuthGuard>
      <MediaPage />
    </AuthGuard>
  );
}
