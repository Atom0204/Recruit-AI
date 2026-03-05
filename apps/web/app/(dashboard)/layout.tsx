"use client";

import type { PropsWithChildren } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "../../components/ui/button";

const navLinks = [
  { href: "/dashboard" as const, label: "Dashboard", icon: "◻" },
  { href: "/quick-interview" as const, label: "Quick Interview", icon: "⚡" },
  { href: "/coding-interview" as const, label: "Coding Interview", icon: "<>" },
  { href: "/upload" as const, label: "New Interview", icon: "+" },
  { href: "/report/demo" as const, label: "Demo Report", icon: "◈" }
];

export default function DashboardLayout({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState<string>("User");

  useEffect(() => {
    let cancelled = false;

    const loadMe = async () => {
      const response = await fetch("/api/auth/me", { cache: "no-store" });
      if (!response.ok) {
        if (!cancelled) {
          router.replace("/login");
        }
        return;
      }

      const data = (await response.json()) as { user: { name: string } };
      if (!cancelled && data.user?.name) {
        setUserName(data.user.name);
      }
    };

    void loadMe();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="flex min-h-dvh bg-interview">
      {/* Sidebar */}
      <aside className="hidden w-[220px] shrink-0 flex-col border-r border-white/[0.06] bg-white/[0.02] md:flex">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-400">
            <span className="text-xs font-bold text-white">R</span>
          </div>
          <span className="text-sm font-semibold text-zinc-100">RecruitAI</span>
        </div>

        <nav className="flex flex-col gap-0.5 px-3 py-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-all duration-150 ${
                  isActive
                    ? "bg-white/[0.08] text-white font-medium"
                    : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
                }`}
              >
                <span className="text-xs opacity-60">{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-white/[0.06] px-5 py-4">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">RecruitAI v1.0</p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/[0.06] bg-white/[0.01] px-5">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 md:hidden">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-400">
              <span className="text-xs font-bold text-white">R</span>
            </div>
          </div>

          <div className="hidden text-sm text-zinc-400 md:block">
            {pathname.includes("/interview/") && "Interview Session"}
            {pathname.includes("/quick-interview") && "Quick Interview"}
            {pathname.includes("/coding-interview") && "Coding Interview"}
            {pathname.includes("/report/") && "Report"}
            {pathname.includes("/upload") && "Upload Resume"}
            {pathname === "/dashboard" && "All Sessions"}
          </div>

          {/* Mobile nav */}
          <nav className="flex items-center gap-3 text-sm md:hidden">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-2 py-1 text-xs transition ${
                  pathname === link.href ? "text-white" : "text-zinc-500"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5">
              <span className="status-dot status-dot-live" />
              <span className="text-xs text-zinc-300">System Online</span>
            </div>
            <div className="hidden items-center gap-2 md:flex">
              <span className="text-xs text-zinc-400">{userName}</span>
              <Button size="sm" variant="secondary" onClick={handleLogout}>Logout</Button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-5 md:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
