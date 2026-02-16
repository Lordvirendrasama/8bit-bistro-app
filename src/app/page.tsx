"use client";

import Link from "next/link";
import React from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AuthGuard } from "@/components/auth/AuthGuard";
import PixelCameraIcon from "@/components/icons/PixelCameraIcon";
import PixelLeaderboardIcon from "@/components/icons/PixelLeaderboardIcon";
import PixelVideoIcon from "@/components/icons/PixelVideoIcon";
import PixelPokemonIcon from "@/components/icons/PixelPokemonIcon";
import { cn } from "@/lib/utils";

function HomePageContent() {
  const menuItems = [
    {
      href: "/dashboard",
      title: "Tournament Desk",
      description: "Register players and submit scores.",
      icon: <PixelCameraIcon className="w-16 h-16 mb-4" />,
    },
    {
      href: "/leaderboard",
      title: "Live Leaderboard",
      description: "See who's at the top of their game.",
      icon: <PixelLeaderboardIcon className="w-16 h-16 mb-4" />,
    },
    {
      href: "/media",
      title: "Event Media",
      description: "Check out the event's visual playlist.",
      icon: <PixelVideoIcon className="w-16 h-16 mb-4" />,
    },
    {
      href: "/whos-that-pokemon",
      title: "Who's That Pokemon?",
      description: "A fun video guessing game.",
      icon: <PixelPokemonIcon className="w-16 h-16 mb-4" />,
    },
  ];

  return (
    <div className="container mx-auto max-w-4xl p-4 pt-10">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-1">
        {menuItems.map((item, index) => (
          <Link href={item.href} key={item.title} className="group">
            <Card className={cn(
              "h-full flex flex-col items-center justify-center text-center p-8 transition-all duration-300 ease-in-out hover:bg-card/80 hover:scale-105 hover:shadow-2xl border-2 border-transparent",
              index % 2 === 0
                ? "hover:border-primary hover:shadow-primary/20"
                : "hover:border-accent hover:shadow-accent/20"
            )}>
              {React.cloneElement(item.icon, {
                  className: cn(
                      item.icon.props.className,
                      index % 2 === 0 ? "text-primary" : "text-accent"
                  )
              })}
              <CardHeader className="p-0">
                <CardTitle className="font-headline text-2xl">{item.title}</CardTitle>
              </CardHeader>
              <CardDescription className="mt-2 text-muted-foreground group-hover:text-foreground/80">
                {item.description}
              </CardDescription>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <AuthGuard>
      <HomePageContent />
    </AuthGuard>
  );
}
