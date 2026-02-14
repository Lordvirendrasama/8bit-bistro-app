import Image from "next/image";
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
          <Logo />
        </Link>
        <Link href="/dashboard">
          <Image
            src="/272827436_301614021993701_2066672914547571489_n.jpg"
            alt="Sponsor Logo"
            width={150}
            height={150}
            className="h-24 w-auto"
          />
        </Link>
        <Link href="/admin/dashboard">
          <Image
            src="/301485854_511554380976736_393831328011205696_n.jpg"
            alt="Sponsor Logo"
            width={150}
            height={150}
            className="h-24 w-auto"
          />
        </Link>
      </CardContent>
    </Card>
  );
}
