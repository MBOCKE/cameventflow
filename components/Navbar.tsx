"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, LayoutDashboard, Map, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/",         label: "Home",      icon: CalendarDays    },
  { href: "/vendors",  label: "Explore",   icon: Search          },
  { href: "/discover", label: "Discover",  icon: Map             },
  { href: "/dashboard",label: "Dashboard", icon: LayoutDashboard },
  { href: "/profile",  label: "Profile",   icon: User            },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background"
      aria-label="Main navigation"
    >
      <ul className="flex items-center justify-around max-w-md mx-auto h-16">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-4 py-2 text-xs transition-colors",
                  isActive
                    ? "text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
