"use client";

import { useState, useEffect } from "react";
import { doc, setDoc } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import type { AppConfig } from "@/types";
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminSettingsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const configRef = useMemoFirebase(
    () => (firestore ? doc(firestore, "appConfig", "event") : null),
    [firestore]
  );
  const { data: appConfig, isLoading: isLoadingConfig } = useDoc<AppConfig>(configRef);

  const [playlistUrl, setPlaylistUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (appConfig?.videoPlaylistUrl) {
      setPlaylistUrl(appConfig.videoPlaylistUrl);
    }
  }, [appConfig]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configRef || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await setDoc(configRef, { videoPlaylistUrl: playlistUrl }, { merge: true });
      toast({
        title: "Success",
        description: "Settings updated successfully.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast({
        title: "Error",
        description: `Failed to save settings: ${message}`,
        variant: "destructive",
      });
    }
    setIsSubmitting(false);
  };

  return (
    <div className="p-4 md:p-8">
      <h1 className="font-headline text-4xl mb-6">App Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Event Media</CardTitle>
          <CardDescription>
            Configure the YouTube playlist URL for the event media page. Remember to include autoplay, loop, and mute parameters for the best experience.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingConfig ? (
            <div className="space-y-4">
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-32" />
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="playlistUrl">YouTube Playlist URL</Label>
                <Input
                  id="playlistUrl"
                  value={playlistUrl}
                  onChange={(e) => setPlaylistUrl(e.target.value)}
                  placeholder="https://www.youtube.com/embed/videoseries?list=..."
                  disabled={isSubmitting}
                />
              </div>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Settings
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
