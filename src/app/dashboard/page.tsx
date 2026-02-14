"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AuthGuard } from "@/components/auth/AuthGuard";
import PixelCameraIcon from "@/components/icons/PixelCameraIcon";
import PixelLeaderboardIcon from "@/components/icons/PixelLeaderboardIcon";
import PixelVideoIcon from "@/components/icons/PixelVideoIcon";
import PixelPokemonIcon from "@/components/icons/PixelPokemonIcon";

function DashboardPage() {
  const menuItems = [
    {
      href: "/",
      title: "Tournament Desk",
      description: "Register players and submit scores.",
      icon: <PixelCameraIcon className="w-16 h-16 mb-4 text-primary" />,
    },
    {
      href: "/leaderboard",
      title: "Live Leaderboard",
      description: "See who's at the top of their game.",
      icon: <PixelLeaderboardIcon className="w-16 h-16 mb-4 text-primary" />,
    },
    {
      href: "/media",
      title: "Event Media",
      description: "Check out the event's visual playlist.",
      icon: <PixelVideoIcon className="w-16 h-16 mb-4 text-primary" />,
    },
    {
      href: "/whos-that-pokemon",
      title: "Who's That Pokémon?",
      description: "A fun video guessing game.",
      icon: <PixelPokemonIcon className="w-16 h-16 mb-4 text-primary" />,
    },
  ];

  return (
    <div className="container mx-auto max-w-4xl p-4 pt-10">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-1">
        {menuItems.map((item) => (
          <Link href={item.href} key={item.title} className="group">
            <Card className="h-full flex flex-col items-center justify-center text-center p-8 transition-all duration-300 ease-in-out hover:bg-card/80 hover:scale-105 hover:shadow-2xl hover:shadow-primary/20 border-2 border-transparent hover:border-primary">
              {item.icon}
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

export default function GuardedDashboard() {
  return (
    <AuthGuard>
      <DashboardPage />
    </AuthGuard>
  );
}
