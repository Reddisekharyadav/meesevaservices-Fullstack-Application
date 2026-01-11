"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

const adminNavItems = [
  { label: "Dashboard", href: "/admin", icon: "📊" },
  { label: "Branches", href: "/admin/branches", icon: "🏢" },
  { label: "Employees", href: "/admin/employees", icon: "👥" },
  { label: "Customers", href: "/admin/customers", icon: "👤" },
  { label: "Work Entries", href: "/admin/work", icon: "📝" },
  { label: "Documents", href: "/admin/documents", icon: "📁" },
  { label: "Payments", href: "/admin/payments", icon: "💰" },
  { label: "Reports", href: "/admin/reports", icon: "📈" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();

        if (!data.success) {
          router.push("/login");
          return;
        }

        if (data.data.role !== "superAdmin") {
          router.push("/login");
          return;
        }

        setUser(data.data);
      } catch (error) {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header title="Admin Dashboard" />
      <div className="flex flex-1">
        <Sidebar
          title="Seva Center"
          navItems={adminNavItems}
          userName={user?.name}
          userRole="Super Admin"
        />
        <main className="flex-1 p-8 md:ml-0">{children}</main>
      </div>
    </div>
  );
}
