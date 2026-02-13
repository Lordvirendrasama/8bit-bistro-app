import Image from "next/image";

export default function Logo() {
  return (
    <Image
      src="/THE 8 BIT BISTRO.png"
      alt="The 8Bit Bistro Logo"
      width={240}
      height={56}
      priority
    />
  );
}
