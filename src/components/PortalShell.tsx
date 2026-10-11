"use client";

import { LogoutButton } from "@/components/LogoutButton";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

type NavItem = {
  href: string;
  label: string;
};

export function PortalShell({
  eyebrow,
  title,
  userName,
  roleLabel,
  nav,
  extraNav,
  children,
}: {
  eyebrow: string;
  title: string;
  userName: string;
  roleLabel: string;
  nav: NavItem[];
  extraNav?: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  function navClass(href: string) {
    const active = pathname === href;
    return cn(
      "whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold transition",
      active ? "bg-card text-forest" : "text-card/80 hover:bg-forest-dark hover:text-card",
    );
  }

  return (
    <div className="paper-grid min-h-dvh lg:grid lg:h-dvh lg:max-h-dvh lg:grid-cols-[16rem_minmax(0,1fr)] lg:overflow-hidden xl:grid-cols-[18rem_minmax(0,1fr)]">
      <aside className="hidden bg-forest text-card lg:flex lg:h-dvh lg:max-h-dvh lg:flex-col lg:overflow-hidden lg:border-r lg:border-forest-dark">
        <div className="shrink-0 px-5 py-5 xl:px-6">
          <Link href="/" className="block" aria-label="All World Gayatri Pariwar Bengaluru">
            <Logo className="h-auto max-h-24 w-full max-w-[15rem] object-contain object-left" priority />
          </Link>
          <p className="mt-3 text-[11px] uppercase tracking-[0.28em] text-gold">{eyebrow}</p>
        </div>
        <nav className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-4">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className={navClass(item.href)}>
              {item.label}
            </Link>
          ))}
          {extraNav}
        </nav>
        <div className="shrink-0 p-4">
          <div className="rounded-2xl bg-forest-dark p-4">
            <p className="text-xs text-card/70">Signed in</p>
            <p className="mt-1 break-words font-medium">{userName}</p>
            <p className="text-xs uppercase tracking-[0.18em] text-gold">{roleLabel}</p>
            <div className="mt-3">
              <LogoutButton />
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-col lg:h-dvh lg:overflow-hidden">
        <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-line bg-forest px-4 py-2.5 text-card lg:hidden">
          <Link
            href="/"
            className="block h-16 w-[11.5rem] shrink-0"
            aria-label="All World Gayatri Pariwar Bengaluru"
          >
            <Logo className="h-full w-full object-left" priority />
          </Link>
          <button
            type="button"
            className="shrink-0 rounded-full p-2 hover:bg-forest-dark"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </header>

        {menuOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-ink/50"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute inset-x-0 top-0 bg-forest px-4 pb-6 pt-4 text-card shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{userName}</p>
                  <p className="text-xs uppercase tracking-[0.16em] text-gold">{roleLabel}</p>
                </div>
                <button
                  type="button"
                  className="rounded-full p-2 hover:bg-forest-dark"
                  aria-label="Close menu"
                  onClick={() => setMenuOpen(false)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex flex-col gap-2">
                {nav.map((item) => (
                  <Link key={item.href} href={item.href} className={navClass(item.href)}>
                    {item.label}
                  </Link>
                ))}
                {extraNav}
              </nav>
              <div className="mt-5 border-t border-white/15 pt-4">
                <LogoutButton className="w-full" />
              </div>
            </div>
          </div>
        ) : null}

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 sm:px-6 sm:py-7 lg:min-h-0 lg:overflow-y-auto lg:px-8 lg:py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
