
"use client";
import { useState } from "react";
import { collection, query, addDoc, deleteDoc, doc, updateDoc, serverTimestamp, orderBy, Timestamp } from "firebase/firestore";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Edit, Loader2, MoreVertical, PlusCircle, Trash2 } from "lucide-react";
import { useFirestore, FirestorePermissionError, errorEmitter, useCollection, useMemoFirebase } from "@/firebase";
import { useAuth } from "@/hooks/use-auth";
import type { Offer, DayOfWeek } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function AdminOffersPage() {
  const firestore = useFirestore();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const offersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, "offers"), orderBy("createdAt", "desc")) : null, [firestore]);
  const { data: offers, isLoading: loading } = useCollection<Offer>(offersQuery);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentOffer, setCurrentOffer] = useState<Partial<Offer>>({});
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [offerToDelete, setOfferToDelete] = useState<Offer | null>(null);
  const [scheduleType, setScheduleType] = useState<'one-time' | 'recurring'>('one-time');

  const handleEdit = (offer: Offer) => {
    setCurrentOffer(offer);
    setScheduleType(offer.daysOfWeek?.length ? 'recurring' : 'one-time');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!isAdmin || !firestore || !currentOffer.title) return;
    setIsSubmitting(true);
    try {
      if (currentOffer.id) await updateDoc(doc(firestore, "offers", currentOffer.id), { ...currentOffer, createdAt: serverTimestamp() });
      else await addDoc(collection(firestore, "offers"), { ...currentOffer, triggerType: 'scheduled', isActive: true, createdAt: serverTimestamp() });
      toast({ title: "Success" });
      setDialogOpen(false);
    } catch (e) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'offers', operation: 'write' }));
    } finally { setIsSubmitting(false); }
  };

  const handleDelete = () => {
    if (!isAdmin || !firestore || !offerToDelete) return;
    deleteDoc(doc(firestore, "offers", offerToDelete.id))
      .then(() => toast({ title: "Deleted" }))
      .catch(() => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'offers', operation: 'delete' })))
      .finally(() => setDeleteAlertOpen(false));
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex justify-between items-center mb-6"><h1 className="font-headline text-4xl">Offers</h1><Button onClick={() => { setCurrentOffer({}); setDialogOpen(true); }}><PlusCircle /> Add</Button></div>
      <Card>
        <CardContent>
          {loading ? <Loader2 className="animate-spin mx-auto" /> : (
            <Table>
              <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Reward</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {offers?.map(offer => (
                  <TableRow key={offer.id}>
                    <TableCell>{offer.title}</TableCell><TableCell>{offer.value}</TableCell>
                    <TableCell><Switch checked={offer.isActive} onCheckedChange={() => updateDoc(doc(firestore, "offers", offer.id), { isActive: !offer.isActive })} /></TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => setTimeout(() => handleEdit(offer), 0)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onSelect={() => setTimeout(() => { setOfferToDelete(offer); setDeleteAlertOpen(true); }, 0)}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
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
      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) setDialogOpen(false); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Offer Details</DialogTitle></DialogHeader>
          <div className="space-y-4"><Input placeholder="Title" value={currentOffer.title || ''} onChange={e => setCurrentOffer(p => ({...p, title: e.target.value}))} /><Textarea placeholder="Desc" value={currentOffer.description || ''} onChange={e => setCurrentOffer(p => ({...p, description: e.target.value}))} /><Input placeholder="Value" value={currentOffer.value || ''} onChange={e => setCurrentOffer(p => ({...p, value: e.target.value}))} /></div>
          <DialogFooter><Button onClick={handleSave} disabled={isSubmitting}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={deleteAlertOpen} onOpenChange={(o) => { if (!o) setDeleteAlertOpen(false); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Offer?</AlertDialogTitle></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </div>
  );
}
