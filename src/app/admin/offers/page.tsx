
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
  Timestamp,
} from "firebase/firestore";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  Edit,
  Loader2,
  MoreVertical,
  PlusCircle,
  Trash2,
} from "lucide-react";
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

const initialOfferState: Partial<Offer> = {
  title: "",
  description: "",
  rewardType: "food",
  value: "",
  startTime: undefined,
  endTime: undefined,
  daysOfWeek: [],
  recurringStartTime: "",
  recurringEndTime: "",
  isActive: true,
};

const days: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function AdminOffersPage() {
  const firestore = useFirestore();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  
  const offersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "offers"), orderBy("createdAt", "desc"));
  }, [firestore]);

  const { data: offers, isLoading: loading } = useCollection<Offer>(offersQuery);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentOffer, setCurrentOffer] = useState<Partial<Offer>>(initialOfferState);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [offerToDelete, setOfferToDelete] = useState<Offer | null>(null);
  const [scheduleType, setScheduleType] = useState<'one-time' | 'recurring'>('one-time');

  const handleAddNew = () => {
    setCurrentOffer(initialOfferState);
    setScheduleType('one-time');
    setDialogOpen(true);
  };

  const handleEdit = (offer: Offer) => {
    setCurrentOffer(offer);
    if (offer.daysOfWeek && offer.daysOfWeek.length > 0) {
      setScheduleType('recurring');
    } else {
      setScheduleType('one-time');
    }
    setDialogOpen(true);
  };

  const openDeleteAlert = (offer: Offer) => {
    setOfferToDelete(offer);
    setDeleteAlertOpen(true);
  };

  const handleDeleteOffer = () => {
    if (!isAdmin) {
      toast({ variant: 'destructive', title: 'Permission Denied', description: 'You cannot delete offers.' });
      return;
    }
    if (!firestore || !offerToDelete) return;
    
    const offerDocRef = doc(firestore, "offers", offerToDelete.id);
    deleteDoc(offerDocRef)
      .then(() => toast({ title: "Success", description: "Offer deleted." }))
      .catch(() => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: offerDocRef.path, operation: 'delete' })))
      .finally(() => setDeleteAlertOpen(false));
  };
  
  const handleStatusToggle = (offer: Offer) => {
    if (!isAdmin) {
      toast({ variant: 'destructive', title: 'Permission Denied', description: 'You cannot update offers.' });
      return;
    }
    if (!firestore) return;
    
    const offerDocRef = doc(firestore, "offers", offer.id);
    const updatedData = { isActive: !offer.isActive };
    updateDoc(offerDocRef, updatedData)
      .then(() => toast({ title: "Success", description: "Offer status updated." }))
      .catch(() => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: offerDocRef.path, operation: 'update', requestResourceData: updatedData })));
  };

  const handleDayToggle = (day: DayOfWeek) => {
    setCurrentOffer(prev => {
        const currentDays = prev.daysOfWeek || [];
        const newDays = currentDays.includes(day)
            ? currentDays.filter(d => d !== day)
            : [...currentDays, day];
        return {...prev, daysOfWeek: newDays};
    });
  };

  const handleSave = async () => {
    if (!isAdmin) {
      toast({ variant: 'destructive', title: 'Permission Denied' });
      return;
    }
    if (!firestore || !currentOffer.title || !currentOffer.description || !currentOffer.value) {
      toast({ variant: 'destructive', title: 'Missing Fields', description: 'Please fill out all required fields.' });
      return;
    }

    setIsSubmitting(true);
    
    const offerData: Partial<Offer> = { ...currentOffer, triggerType: 'scheduled' };

    if (scheduleType === 'one-time') {
      delete offerData.daysOfWeek;
      delete offerData.recurringStartTime;
      delete offerData.recurringEndTime;
    } else { // recurring
      delete offerData.startTime;
      delete offerData.endTime;
    }


    try {
      if (offerData.id) {
        // Update existing offer
        const { id, ...dataToUpdate } = offerData;
        const offerDocRef = doc(firestore, "offers", id);
        await updateDoc(offerDocRef, dataToUpdate);
        toast({ title: "Success", description: "Offer updated." });
      } else {
        // Create new offer
        const dataToCreate = { ...offerData, createdAt: serverTimestamp() };
        const offersCollection = collection(firestore, "offers");
        await addDoc(offersCollection, dataToCreate);
        toast({ title: "Success", description: "Offer created." });
      }
      setDialogOpen(false);
    } catch (error) {
        const path = offerData.id ? `offers/${offerData.id}` : 'offers';
        const operation = offerData.id ? 'update' : 'create';
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path, operation, requestResourceData: offerData }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="p-4 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-headline text-4xl">Offer Management</h1>
          <Button onClick={handleAddNew}><PlusCircle /> Add Offer</Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Manage Offers & Rewards</CardTitle>
            <CardDescription>Create promotions to engage players.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Reward</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(offers || []).map((offer) => (
                    <TableRow key={offer.id}>
                      <TableCell className="font-medium">{offer.title}</TableCell>
                      <TableCell>{offer.triggerType}</TableCell>
                      <TableCell>{offer.value}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Switch id={`active-switch-${offer.id}`} checked={offer.isActive} onCheckedChange={() => handleStatusToggle(offer)} />
                          <Label htmlFor={`active-switch-${offer.id}`} className={offer.isActive ? "text-primary" : "text-muted-foreground"}>
                            {offer.isActive ? "Active" : "Inactive"}
                          </Label>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onSelect={() => handleEdit(offer)}><Edit /> Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onSelect={() => openDeleteAlert(offer)}><Trash2 /> Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!offers || offers.length === 0) && (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No offers created yet.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl">{currentOffer.id ? 'Edit Offer' : 'Create New Offer'}</DialogTitle>
            <DialogDescription>Fill in the details for your promotion.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">Title</Label>
              <Input id="title" value={currentOffer.title} onChange={(e) => setCurrentOffer(p => ({...p, title: e.target.value}))} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">Description</Label>
              <Textarea id="description" value={currentOffer.description} onChange={(e) => setCurrentOffer(p => ({...p, description: e.target.value}))} className="col-span-3" />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Schedule Type</Label>
                <RadioGroup
                    value={scheduleType}
                    onValueChange={(value) => setScheduleType(value as 'one-time' | 'recurring')}
                    className="col-span-3 flex gap-4"
                >
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="one-time" id="r1" />
                        <Label htmlFor="r1">One-time</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="recurring" id="r2" />
                        <Label htmlFor="r2">Recurring</Label>
                    </div>
                </RadioGroup>
            </div>
            {scheduleType === 'one-time' ? (
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !currentOffer.startTime && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {currentOffer.startTime ? format(currentOffer.startTime.toDate(), "PPP") : <span>Pick a date</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={currentOffer.startTime?.toDate()} onSelect={(d) => setCurrentOffer(p => ({...p, startTime: d ? Timestamp.fromDate(d) : undefined}))} initialFocus /></PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !currentOffer.endTime && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {currentOffer.endTime ? format(currentOffer.endTime.toDate(), "PPP") : <span>Pick a date</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={currentOffer.endTime?.toDate()} onSelect={(d) => setCurrentOffer(p => ({...p, endTime: d ? Timestamp.fromDate(d) : undefined}))} initialFocus /></PopoverContent>
                    </Popover>
                  </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-4 items-start gap-4">
                    <Label className="text-right pt-2">Days</Label>
                    <div className="col-span-3 flex flex-wrap gap-1">
                        {days.map((day) => (
                            <Button key={day} type="button" variant={currentOffer.daysOfWeek?.includes(day) ? 'default' : 'outline'} size="sm" onClick={() => handleDayToggle(day)} className="capitalize w-12">{day.substring(0,3)}</Button>
                        ))}
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="recurringStartTime">From</Label>
                        <Input id="recurringStartTime" type="time" value={currentOffer.recurringStartTime || ''} onChange={(e) => setCurrentOffer(p => ({...p, recurringStartTime: e.target.value}))}/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="recurringEndTime">Until</Label>
                        <Input id="recurringEndTime" type="time" value={currentOffer.recurringEndTime || ''} onChange={(e) => setCurrentOffer(p => ({...p, recurringEndTime: e.target.value}))}/>
                    </div>
                </div>
              </>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rewardType" className="text-right">Reward Type</Label>
                <Select value={currentOffer.rewardType} onValueChange={(v) => setCurrentOffer(p => ({...p, rewardType: v as Offer['rewardType']}))}>
                    <SelectTrigger className="col-span-3"><SelectValue placeholder="Select a reward type" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="food">Food / Drink</SelectItem>
                        <SelectItem value="discount">Discount</SelectItem>
                        <SelectItem value="bonus_time">Bonus Time</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="value" className="text-right">Reward Value</Label>
                <Input id="value" value={currentOffer.value} onChange={(e) => setCurrentOffer(p => ({...p, value: e.target.value}))} className="col-span-3" placeholder="e.g. Free Drink, 10%, 15 mins"/>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the offer &quot;{offerToDelete?.title}&quot;.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteOffer} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

    