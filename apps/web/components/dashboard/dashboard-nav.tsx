"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { buttonVariants } from "@repo/ui/components/button";
import { cn } from "@repo/ui/lib/utils";

type DashboardNavProps = {
  role?: "ADMIN" | "MANAGER";
};

export function DashboardNav({ role }: DashboardNavProps) {
  const pathname = usePathname();

  const items = [
    { href: "/dashboard", label: "Overview" },
    { href: "/dashboard/customers", label: "Customers" },
    { href: "/dashboard/products", label: "Products" },
    { href: "/dashboard/orders", label: "Orders" },
  ];

  if (role === "ADMIN") {
    items.push({ href: "/dashboard/users", label: "Users" });
  }

  items.push({ href: "/dashboard/profile", label: "Profile" });

  return (
    <nav className="flex flex-wrap gap-2">
      {items.map((item) => {
        const isActive =
          item.href === "/dashboard"
            ? pathname === item.href
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              buttonVariants({
                variant: isActive ? "default" : "outline",
                size: "sm",
              }),
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
