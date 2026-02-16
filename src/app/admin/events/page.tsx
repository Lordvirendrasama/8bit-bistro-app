
"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import {
  Loader2,
  PlusCircle,
  Trash2,
} from "lucide-react";

import { useFirestore, FirestorePermissionError, errorEmitter, useCollection, useMemoFirebase } from "@/firebase";
import type { Event } from "@/types";
import { useToast } from "@/hooks/use-toast";

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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from 'date-fns';

export default function AdminEventsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const eventsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "events"), orderBy("createdAt", "desc"));
  }, [firestore]);
  
  const { data: events, isLoading: loading } = useCollection<Event>(eventsQuery);

  const [newEventName, setNewEventName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventName.trim() || isSubmitting || !firestore) return;

    setIsSubmitting(true);

    const eventData = {
      name: newEventName.trim(),
      createdAt: serverTimestamp(),
    };
    const eventsCollection = collection(firestore, "events");
    addDoc(eventsCollection, eventData)
      .then(() => {
        toast({
          title: "Success",
          description: `Event '${newEventName.trim()}' added.`,
        });
        setNewEventName("");
      })
      .catch(() => {
        const permissionError = new FirestorePermissionError({
            path: eventsCollection.path,
            operation: 'create',
            requestResourceData: eventData
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const openDeleteAlert = (event: Event) => {
    setEventToDelete(event);
    setDeleteAlertOpen(true);
  };

  const handleDeleteEvent = () => {
    if (!firestore || !eventToDelete) return;
    
    const eventDocRef = doc(firestore, "events", eventToDelete.id);
    deleteDoc(eventDocRef)
      .then(() => {
        toast({ title: "Success", description: "Event deleted." });
      })
      .catch(() => {
        const permissionError = new FirestorePermissionError({
            path: eventDocRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setDeleteAlertOpen(false);
      });
  };
  
  const TimeCell = ({ timestamp }: { timestamp?: { toDate: () => Date } }) => {
    const [text, setText] = useState('');
    useEffect(() => {
        if (timestamp) {
            setText(format(timestamp.toDate(), "PPP"));
        } else {
            setText('N/A');
        }
    }, [timestamp]);

    if (!text) return <>...</>;

    return <>{text}</>;
  };


  return (
    <div className="p-4 md:p-8">
      <h1 className="font-headline text-4xl mb-6">Event Management</h1>
      <Card>
        <CardHeader>
          <CardTitle>Manage Events</CardTitle>
          <CardDescription>
            Add new events and manage them for the tournament.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddEvent} className="flex gap-2 mb-8">
            <Input
              value={newEventName}
              onChange={(e) => setNewEventName(e.target.value)}
              placeholder="e.g., Summer Showdown 2024"
              disabled={isSubmitting}
            />
            <Button
              type="submit"
              disabled={!newEventName.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <PlusCircle className="mr-2 h-4 w-4" />
              )}
              Add Event
            </Button>
          </form>

          {loading ? (
            <div className="flex justify-center items-center h-24">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(events || []).map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">{event.name}</TableCell>
                    <TableCell>
                      {event.createdAt ? (
                         <TimeCell timestamp={event.createdAt} />
                      ) : (
                        "N/A"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openDeleteAlert(event)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {(!events || events.length === 0) && (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center text-muted-foreground"
                    >
                      No events added yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Alert */}
      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the event &quot;{eventToDelete?.name}
              &quot;. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDeleteEvent()}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
