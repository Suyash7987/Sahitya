import { PortalShell } from "@/components/PortalShell";
import { getSession } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/login");
  }

  return (
    <PortalShell
      eyebrow="Admin portal"
      title="Sahitya"
      userName={session.name}
      roleLabel="Inventory"
      extraNav={
        <Link
          href="/desk"
          className="block rounded-full px-4 py-2.5 text-sm font-semibold text-card/80 hover:bg-forest-dark hover:text-card"
        >
          Front desk
        </Link>
      }
      nav={[
        { href: "/admin", label: "Inventory" },
        { href: "/admin/books/new", label: "Add Items" },
        { href: "/admin/history", label: "History" },
        { href: "/admin/settings", label: "Settings" },
      ]}
    >
      {children}
    </PortalShell>
  );
}
