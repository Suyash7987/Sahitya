import { PortalShell } from "@/components/PortalShell";
import { getSession } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function DeskLayout({ children }: LayoutProps<"/desk">) {
  const session = await getSession();
  if (!session || (session.role !== "desk" && session.role !== "admin")) {
    redirect("/login");
  }

  return (
    <PortalShell
      eyebrow="Customer portal"
      title="Sahitya"
      userName={session.name}
      roleLabel="Front desk"
      extraNav={
        session.role === "admin" ? (
          <Link
            href="/admin"
            className="block rounded-full px-4 py-2.5 text-sm font-semibold text-card/80 hover:bg-forest-dark hover:text-card"
          >
            Admin inventory
          </Link>
        ) : null
      }
      nav={[
        { href: "/desk", label: "Billing" },
        { href: "/desk/history", label: "History" },
      ]}
    >
      {children}
    </PortalShell>
  );
}
