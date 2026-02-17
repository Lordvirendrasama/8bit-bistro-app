"use client";

import type { Score } from "@/types";
import { PartyPopper } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function NewScoreAnnouncement({
  score,
  show,
}: {
  score: Score | null;
  show: boolean;
}) {
  if (!score || !show) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4 animate-in fade-in-0 duration-500">
      <Card className="max-w-2xl w-full border-4 border-accent bg-background/95 shadow-2xl shadow-accent/50 animate-in zoom-in-90 duration-500">
        <CardContent className="p-8 text-center sm:p-12">
          <PartyPopper className="mx-auto h-20 w-20 animate-bounce text-accent" />
          <h1 className="mt-4 font-headline text-3xl uppercase text-accent drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] sm:text-5xl">
            New High Score!
          </h1>
          <p className="mt-6 text-4xl font-bold text-foreground sm:text-6xl">
            {score.playerName}
          </p>
          <div className="mt-6 text-2xl text-muted-foreground sm:text-3xl">
            on <span className="font-bold text-primary">{score.gameName}</span>
          </div>
          <p className="mt-4 font-mono text-5xl font-black tracking-tight text-white sm:text-7xl">
            {score.scoreValue.toLocaleString()}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
