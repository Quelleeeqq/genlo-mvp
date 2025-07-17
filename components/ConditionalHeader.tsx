"use client";
import Header from "./Header";
import { usePathname } from "next/navigation";

export default function ConditionalHeader() {
  const pathname = usePathname();
  if (pathname === "/" || pathname === "/pricing" || pathname.startsWith("/auth")) return null;
  return <Header />;
} 