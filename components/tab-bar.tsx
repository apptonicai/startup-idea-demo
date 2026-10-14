"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/drive", label: "Feed" },
  { href: "/drive/post", label: "Post" },
  { href: "/drive/mine", label: "Mine" },
] as const;

export function TabBar() {
  const pathname = usePathname();
  return (
    <nav className="grid grid-cols-3 border-t border-stone-900/10 bg-[#efe8db]">
      {tabs.map((tab) => {
        const active =
          tab.href === "/drive" ? pathname === "/drive" : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex min-h-16 items-center justify-center text-base font-semibold ${
              active ? "text-[#c45512]" : "text-stone-600"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
