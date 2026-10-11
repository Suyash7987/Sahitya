"use client";

import { AccessManager } from "@/components/AccessManager";
import { PasswordManager } from "@/components/PasswordManager";

export function SettingsBoard() {
  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <div>
          <h2 className="font-display text-2xl">Front desk access</h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            Give someone the front desk portal. They can bill customers, and they cannot open
            inventory.
          </p>
        </div>
        <AccessManager />
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-display text-2xl">Passwords</h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            Set the admin password and the front desk password. The front desk password is shared by
            every front desk sign-in.
          </p>
        </div>
        <PasswordManager />
      </section>
    </div>
  );
}
