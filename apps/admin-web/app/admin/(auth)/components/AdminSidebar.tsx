"use client";

import { signoutUser } from "@/lib/api/auth";
import { showError } from "@/lib/utils/toast";
import { Button } from "@web42-ai/ui/button";
import { cn } from "@web42-ai/ui/utils";
import { FolderOpen, LogOut, Settings, Users } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const navigation = [
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Projects", href: "/admin/projects", icon: FolderOpen },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signoutUser();
      router.push("/admin/login");
    } catch (_error) {
      showError("Failed to logout. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="flex w-64 flex-col bg-white shadow-lg">
      <div className="flex h-16 items-center justify-center border-b">
        <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-4">
        <Button
          onClick={handleLogout}
          disabled={isLoggingOut}
          variant="outline"
          className="w-full justify-start"
        >
          <LogOut className="mr-3 h-5 w-5" />
          {isLoggingOut ? "Logging out..." : "Logout"}
        </Button>
      </div>
    </div>
  );
}
