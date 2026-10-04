"use client";

import Image from "next/image";
import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="logo" aria-label="Labora, beranda">
      <span className="logo-mark">
        <Image src="/logo/logo.png" alt="" width={48} height={48} priority />
      </span>
      labora<span className="logo-dot">.</span>
    </Link>
  );
}
