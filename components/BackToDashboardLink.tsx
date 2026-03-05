"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function BackToDashboardLink() {
  const sp = useSearchParams();
  const qs = sp?.toString() ?? "";
  const href = qs ? `/?${qs}` : "/";

  return <Link href={href}>← Back to dashboard</Link>;
}