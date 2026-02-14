import Image from "next/image";

export default function Logo() {
  return (
    <Image
      src="/THE 8 BIT BISTRO.png"
      alt="The 8Bit Bistro Logo"
      width={300}
      height={150}
      priority
      className="h-40 w-auto"
    />
  );
}
