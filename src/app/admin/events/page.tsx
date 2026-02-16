"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function AdminEventsPage() {
    return (
        <div className="p-4 md:p-8">
            <h1 className="font-headline text-4xl mb-6">Event Management</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Page Removed</CardTitle>
                    <CardDescription>
                        This page has been removed as per your request.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">The event management functionality has been disabled.</p>
                </CardContent>
            </Card>
        </div>
    );
}
