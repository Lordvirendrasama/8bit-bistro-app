"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function AdminSettingsPage() {
    return (
        <div className="p-4 md:p-8">
            <h1 className="font-headline text-4xl mb-6">Settings</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Application Settings</CardTitle>
                    <CardDescription>
                        Manage your application settings here.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">There are no settings to configure at this time.</p>
                </CardContent>
            </Card>
        </div>
    );
}
