"use client";

import { useState, useMemo } from "react";
import { collection, query, orderBy } from "firebase/firestore";
import { formatDistanceToNow } from "date-fns";
import { Loader2, ChevronDown, ChevronUp, Instagram, Users } from "lucide-react";

import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import type { Player } from "@/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function AdminUsersPage() {
  const firestore = useFirestore();
  
  const playersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "players"), orderBy("createdAt", "desc"));
  }, [firestore]);

  const { data: players, isLoading: loadingPlayers } = useCollection<Player>(playersQuery);

  const [sortConfig, setSortConfig] = useState<{
    key: keyof Player;
    direction: "ascending" | "descending";
  } | null>({ key: "createdAt", direction: "descending" });

  const sortedPlayers = useMemo(() => {
    if (!players) return [];
    let sortableItems = [...players];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (sortConfig.key === "createdAt") {
          const aDate = a.createdAt?.toDate() ?? new Date(0);
          const bDate = b.createdAt?.toDate() ?? new Date(0);
          if (aDate < bDate) return sortConfig.direction === "ascending" ? -1 : 1;
          if (aDate > bDate) return sortConfig.direction === "ascending" ? 1 : -1;
          return 0;
        }

        if (aValue === undefined || aValue === null) return 1;
        if (bValue === undefined || bValue === null) return -1;

        if (String(aValue).toLowerCase() < String(bValue).toLowerCase())
          return sortConfig.direction === "ascending" ? -1 : 1;
        if (String(aValue).toLowerCase() > String(bValue).toLowerCase())
          return sortConfig.direction === "ascending" ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [players, sortConfig]);

  const requestSort = (key: keyof Player) => {
    let direction: "ascending" | "descending" = "ascending";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "ascending"
    ) {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const SortableHeader = ({
    label,
    sortKey,
  }: {
    label: string;
    sortKey: keyof Player;
  }) => (
    <TableHead
      className="cursor-pointer hover:bg-muted/50"
      onClick={() => requestSort(sortKey)}
    >
      <div className="flex items-center gap-2">
        {label}
        {sortConfig?.key === sortKey &&
          (sortConfig.direction === "ascending" ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          ))}
      </div>
    </TableHead>
  );

  if (loadingPlayers) {
    return (
      <div className="p-8 flex justify-center items-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <h1 className="font-headline text-4xl mb-2">Player Management</h1>
      <p className="text-muted-foreground mb-6">
        View all registered players for the event.
      </p>
      <Card>
        <CardHeader>
          <CardTitle>Registered Players</CardTitle>
          <CardDescription>
            A total of {players?.length ?? 0} players have registered.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHeader label="Player" sortKey="name" />
                  <SortableHeader label="Instagram" sortKey="instagram" />
                  <TableHead>Group Size</TableHead>
                  <SortableHeader label="Registered" sortKey="createdAt" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedPlayers.map((player) => (
                  <TableRow key={player.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                            <AvatarFallback>
                                {player.name ? player.name.charAt(0) : "P"}
                            </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{player.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {player.instagram ? (
                        <a 
                          href={`https://instagram.com/${player.instagram.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Instagram className="h-4 w-4" />
                          {player.instagram}
                        </a>
                      ) : (
                        <span className="text-muted-foreground/50">Not provided</span>
                      )}
                    </TableCell>
                    <TableCell>
                        <Badge variant="outline" className="flex items-center gap-1.5 w-fit">
                            <Users className="h-4 w-4" />
                            {player.groupSize}
                        </Badge>
                    </TableCell>
                    <TableCell>
                      {player.createdAt
                        ? formatDistanceToNow(player.createdAt.toDate(), {
                            addSuffix: true,
                          })
                        : "N/A"}
                    </TableCell>
                  </TableRow>
                ))}
                {sortedPlayers.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                            No players have registered yet.
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
