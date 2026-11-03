"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/profil", label: "Profil" },
  { href: "/admin/proyek", label: "Proyek" },
  { href: "/admin/milestone", label: "Milestone" },
  { href: "/admin/tempat", label: "Tempat" },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ok, setOk] = useState(false);
  const isLogin = pathname === "/admin/login";

  useEffect(() => {
    if (isLogin) return;
    let alive = true;
    (async () => {
      const sb = supabaseBrowser();
      const {
        data: { user },
      } = await sb.auth.getUser();
      if (!user) {
        router.replace("/admin/login");
        return;
      }
      const { data: admin } = await sb.rpc("is_admin");
      if (!admin) {
        await sb.auth.signOut();
        router.replace("/admin/login");
        return;
      }
      if (alive) setOk(true);
    })();
    return () => {
      alive = false;
    };
  }, [isLogin, router, pathname]);

  async function logout() {
    await supabaseBrowser().auth.signOut();
    router.replace("/admin/login");
  }

  if (isLogin) return <>{children}</>;
  if (!ok)
    return (
      <div className="container" style={{ padding: "48px 24px" }}>
        <p className="muted">Memeriksa akses…</p>
      </div>
    );

  return (
    <div className="container">
      <div className="adm-bar">
        <span className="mono amber small">&gt; admin</span>
        <nav className="adm-nav" aria-label="Menu admin">
          {links.map((l) => {
            const active = l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href);
            return (
              <Link key={l.href} href={l.href} className={active ? "pill pill-active" : "pill"}>
                {l.label}
              </Link>
            );
          })}
        </nav>
        <button className="pill" onClick={logout}>Keluar</button>
      </div>
      {children}
    </div>
  );
}
