
"use client";
import { useState } from "react";
import {
  collection,
  query,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
  orderBy,
} from "firebase/firestore";
import { Edit, Loader2, MoreVertical, PlusCircle, Trash2 } from "lucide-react";
import { useFirestore, FirestorePermissionError, errorEmitter, useCollection, useMemoFirebase } from "@/firebase";
import { useAuth } from "@/hooks/use-auth";
import type { Event } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function AdminEventsPage() {
  const firestore = useFirestore();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const eventsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, "events"), orderBy("createdAt", "desc")) : null, [firestore]);
  const { data: events, isLoading: loading } = useCollection<Event>(eventsQuery);
  const [newEventName, setNewEventName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [editedEventName, setEditedEventName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !newEventName.trim() || isSubmitting || !firestore) return;
    setIsSubmitting(true);
    const eventData = { name: newEventName.trim(), isActive: true, createdAt: serverTimestamp() };
    addDoc(collection(firestore, "events"), eventData)
      .then(() => {
        toast({ title: "Success", description: "Event added." });
        setNewEventName("");
      })
      .catch(() => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'events', operation: 'create', requestResourceData: eventData })))
      .finally(() => setIsSubmitting(false));
  };

  const handleStatusToggle = (eventId: string, currentStatus: boolean) => {
    if (!isAdmin || !firestore) return;
    const eventDocRef = doc(firestore, "events", eventId);
    updateDoc(eventDocRef, { isActive: !currentStatus })
      .then(() => toast({ title: "Updated" }))
      .catch(() => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: eventDocRef.path, operation: 'update' })));
  };

  const openEditModal = (event: Event) => {
    setSelectedEvent(event);
    setEditedEventName(event.name);
    setEditModalOpen(true);
  };

  const handleEditEvent = () => {
    if (!isAdmin || !firestore || !selectedEvent || isEditing) return;
    setIsEditing(true);
    const eventDocRef = doc(firestore, "events", selectedEvent.id);
    updateDoc(eventDocRef, { name: editedEventName.trim() })
      .then(() => {
        toast({ title: "Success" });
        setEditModalOpen(false);
      })
      .catch(() => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: eventDocRef.path, operation: 'update' })))
      .finally(() => setIsEditing(false));
  };

  const handleDeleteEvent = () => {
    if (!isAdmin || !firestore || !eventToDelete) return;
    const eventDocRef = doc(firestore, "events", eventToDelete.id);
    deleteDoc(eventDocRef)
      .then(() => toast({ title: "Deleted" }))
      .catch(() => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: eventDocRef.path, operation: 'delete' })))
      .finally(() => setDeleteAlertOpen(false));
  };

  return (
    <div className="p-4 md:p-8">
      <h1 className="font-headline text-4xl mb-6">Event Management</h1>
      <Card>
        <CardHeader><CardTitle>Manage Events</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleAddEvent} className="flex gap-2 mb-8">
            <Input value={newEventName} onChange={(e) => setNewEventName(e.target.value)} placeholder="e.g. Summer Showdown" disabled={isSubmitting} />
            <Button type="submit" disabled={!newEventName.trim() || isSubmitting}>{isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}Add</Button>
          </form>
          {loading ? <Loader2 className="h-8 w-8 animate-spin mx-auto" /> : (
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {events?.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>{event.name}</TableCell>
                    <TableCell><Switch checked={event.isActive} onCheckedChange={() => handleStatusToggle(event.id, event.isActive)} /></TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-5 w-5" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => setTimeout(() => openEditModal(event), 0)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onSelect={() => setTimeout(() => { setEventToDelete(event); setDeleteAlertOpen(true); }, 0)}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <Dialog open={editModalOpen} onOpenChange={(o) => { if (!o) { setEditModalOpen(false); setSelectedEvent(null); setIsEditing(false); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Event</DialogTitle></DialogHeader>
          <Input value={editedEventName} onChange={(e) => setEditedEventName(e.target.value)} disabled={isEditing} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)} disabled={isEditing}>Cancel</Button>
            <Button onClick={handleEditEvent} disabled={isEditing}>{isEditing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={deleteAlertOpen} onOpenChange={(o) => { if (!o) { setDeleteAlertOpen(false); setEventToDelete(null); } }}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete "{eventToDelete?.name}"?</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteEvent} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
