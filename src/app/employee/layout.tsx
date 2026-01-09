"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { UserSession } from "@/types";

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();

        if (data.success && data.data?.role === "employee") {
          setUser(data.data);
        } else {
          router.push("/login");
        }
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return null;

  const navItems = [
    { href: "/employee", label: "Dashboard", icon: "📊" },
    { href: "/employee/work", label: "Work Entries", icon: "📝" },
    { href: "/employee/documents", label: "Documents", icon: "📄" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        title="Employee Portal"
        navItems={navItems}
        userName={user.name}
        userRole={user.role}
      />
      <main className="flex-1 p-4 md:p-8 mt-16 md:mt-0">{children}</main>
    </div>
  );
}
