
"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useFirestore, FirestorePermissionError, errorEmitter } from "@/firebase";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const MEDIA_CONFIG_PATH = "config/media";

export default function AdminMediaPage() {
    const firestore = useFirestore();
    const { isAdmin } = useAuth();
    const { toast } = useToast();
    
    const [playlistId, setPlaylistId] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!firestore) return;

        const fetchConfig = async () => {
            setIsLoading(true);
            try {
                const configDocRef = doc(firestore, MEDIA_CONFIG_PATH);
                const docSnap = await getDoc(configDocRef);
                if (docSnap.exists()) {
                    setPlaylistId(docSnap.data().playlistId || "");
                }
            } catch (error) {
                console.error("Error fetching media config:", error);
                 const permissionError = new FirestorePermissionError({
                    path: MEDIA_CONFIG_PATH,
                    operation: 'get',
                });
                errorEmitter.emit('permission-error', permissionError);
            } finally {
                setIsLoading(false);
            }
        };

        fetchConfig();
    }, [firestore]);

    const handleSave = async () => {
        if (!isAdmin) {
            toast({ variant: 'destructive', title: 'Permission Denied', description: 'You cannot update settings.' });
            return;
        }
        if (!firestore) return;

        setIsSaving(true);
        try {
            const configDocRef = doc(firestore, MEDIA_CONFIG_PATH);
            const data = { playlistId: playlistId.trim() };
            await setDoc(configDocRef, data, { merge: true });
            toast({
                title: "Settings Saved",
                description: "The event media playlist has been updated.",
            });
        } catch (error) {
            console.error("Error saving media config:", error);
            const permissionError = new FirestorePermissionError({
                path: MEDIA_CONFIG_PATH,
                operation: 'write',
                requestResourceData: { playlistId: playlistId.trim() }
            });
            errorEmitter.emit('permission-error', permissionError);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-4 md:p-8">
            <h1 className="font-headline text-4xl mb-6">Media Settings</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Event Media Settings</CardTitle>
                    <CardDescription>
                        Manage the YouTube playlist displayed on the Event Media page.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center h-24">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="space-y-4 max-w-lg">
                             <div className="space-y-2">
                                <Label htmlFor="playlist-id">YouTube Playlist ID</Label>
                                <Input
                                    id="playlist-id"
                                    value={playlistId}
                                    onChange={(e) => setPlaylistId(e.target.value)}
                                    placeholder="PLNMTXgsQnLlCAYdQGh3sVAvun2hWZ_a6x"
                                    disabled={isSaving}
                                />
                                <p className="text-sm text-muted-foreground">
                                    This is the part of the YouTube playlist URL that comes after `list=`.
                                </p>
                            </div>
                            <Button onClick={handleSave} disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Settings
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
