"use client";

import { doc } from "firebase/firestore";
import { Loader2, Terminal } from "lucide-react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import Header from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { useFirestore, useDoc } from "@/firebase";
import type { AppConfig } from "@/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function MediaPage() {
  const firestore = useFirestore();
  const { data: appConfig, isLoading } = useDoc<AppConfig>(
    firestore ? doc(firestore, "appConfig", "event") : null
  );

  const videoPlaylistUrl = appConfig?.videoPlaylistUrl;

  return (
    <>
      <Header />
      <div className="container mx-auto max-w-4xl p-4">
        <h1 className="font-headline text-3xl mb-4">Event Media</h1>
        <Card className="overflow-hidden shadow-2xl shadow-primary/10">
          <CardContent className="p-0">
            <div className="aspect-video w-full bg-black flex items-center justify-center">
              {isLoading && <Loader2 className="h-10 w-10 animate-spin text-primary" />}
              {!isLoading && videoPlaylistUrl && (
                <iframe
                  src={videoPlaylistUrl}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full"
                ></iframe>
              )}
              {!isLoading && !videoPlaylistUrl && (
                  <div className="text-center text-muted-foreground p-8">
                    <Alert>
                        <Terminal className="h-4 w-4" />
                        <AlertTitle>No Media URL</AlertTitle>
                        <AlertDescription>
                            The event media playlist URL has not been set by an admin yet.
                        </AlertDescription>
                    </Alert>
                  </div>
              )}
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
