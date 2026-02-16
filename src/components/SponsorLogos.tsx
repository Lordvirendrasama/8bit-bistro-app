import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Logo from "@/components/Logo";

export function SponsorLogos() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="font-headline text-2xl text-center">
          Sponsors
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center gap-8 pt-6">
        <Link href="/dashboard">
          <Logo className="h-32" />
        </Link>
      </CardContent>
    </Card>
  );
}
