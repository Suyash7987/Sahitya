import { SettingsBoard } from "@/components/SettingsBoard";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  return (
    <div className="max-w-3xl pb-8">
      <p className="text-xs uppercase tracking-[0.22em] text-gold">Admin</p>
      <h1 className="mt-1 font-display text-3xl sm:text-4xl">Settings</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
        Manage who can use the front desk, and set the admin password and the shared front desk password.
      </p>
      <div className="mt-8">
        <SettingsBoard />
      </div>
    </div>
  );
}
