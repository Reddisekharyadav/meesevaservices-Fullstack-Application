"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { UserSession } from "@/types";

export default function BranchLayout({
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

        if (data.success && data.data?.role === "branchAdmin") {
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
    { href: "/branch", label: "Dashboard", icon: "📊" },
    { href: "/branch/customers", label: "Customers", icon: "👥" },
    { href: "/branch/work", label: "Work Entries", icon: "📝" },
    { href: "/branch/documents", label: "Documents", icon: "📄" },
    { href: "/branch/payments", label: "Payments", icon: "💳" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header title="Branch Admin Dashboard" />
      <div className="flex flex-1">
        <Sidebar
          title="Branch Admin"
          navItems={navItems}
          userName={user.name}
          userRole={user.role}
        />
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
