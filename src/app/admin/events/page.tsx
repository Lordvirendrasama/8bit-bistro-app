
"use client";

import { useState } from "react";
import {
  collection,
  query,
  orderBy,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  Edit,
  Loader2,
  MoreVertical,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

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

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [editedEventName, setEditedEventName] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventName.trim() || isSubmitting || !firestore) return;

    setIsSubmitting(true);

    const eventData = {
      name: newEventName.trim(),
      isActive: true,
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

  const handleStatusToggle = (eventId: string, currentStatus: boolean) => {
    if (!firestore) return;
    
    const eventDocRef = doc(firestore, "events", eventId);
    const updatedData = { isActive: !currentStatus };
    updateDoc(eventDocRef, updatedData)
      .then(() => {
        toast({
          title: "Success",
          description: "Event status updated.",
        });
      })
      .catch(() => {
        const permissionError = new FirestorePermissionError({
            path: eventDocRef.path,
            operation: 'update',
            requestResourceData: updatedData
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  const openEditModal = (event: Event) => {
    setSelectedEvent(event);
    setEditedEventName(event.name);
    setEditModalOpen(true);
  };

  const handleEditEvent = () => {
    if (!firestore || !selectedEvent || !editedEventName.trim() || isEditing) return;

    setIsEditing(true);

    const eventDocRef = doc(firestore, "events", selectedEvent.id);
    const updatedData = { name: editedEventName.trim() };
    updateDoc(eventDocRef, updatedData)
      .then(() => {
        toast({ title: "Success", description: "Event name updated." });
        setEditModalOpen(false);
      })
      .catch(() => {
        const permissionError = new FirestorePermissionError({
            path: eventDocRef.path,
            operation: 'update',
            requestResourceData: updatedData
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setIsEditing(false);
      });
  };

  return (
    <div className="p-4 md:p-8">
      <h1 className="font-headline text-4xl mb-6">Event Management</h1>
      <Card>
        <CardHeader>
          <CardTitle>Manage Events</CardTitle>
          <CardDescription>
            Add new events and manage their details for the tournament.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddEvent} className="flex gap-2 mb-8">
            <Input
              value={newEventName}
              onChange={(e) => setNewEventName(e.target.value)}
              placeholder="e.g., Summer Showdown"
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
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(events || []).map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">{event.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`active-switch-${event.id}`}
                          checked={event.isActive}
                          onCheckedChange={() =>
                            handleStatusToggle(event.id, event.isActive)
                          }
                        />
                        <Label
                          htmlFor={`active-switch-${event.id}`}
                          className={
                            event.isActive
                              ? "text-primary"
                              : "text-muted-foreground"
                          }
                        >
                          {event.isActive ? "Active" : "Inactive"}
                        </Label>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onSelect={() => openEditModal(event)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onSelect={() => openDeleteAlert(event)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Event Name</DialogTitle>
            <DialogDescription>
              Change the name for &quot;{selectedEvent?.name}&quot;.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={editedEventName}
            onChange={(e) => setEditedEventName(e.target.value)}
            disabled={isEditing}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleEditEvent} disabled={isEditing}>
              {isEditing && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Alert */}
      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the event &quot;{eventToDelete?.name}
              &quot; and may affect existing score submissions.
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
