"use client";

import { AccessManager } from "@/components/AccessManager";
import { PasswordManager } from "@/components/PasswordManager";
import { useCallback, useState } from "react";

type DeskUser = {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
};

export function SettingsBoard() {
  const [deskUsers, setDeskUsers] = useState<DeskUser[]>([]);
  const onUsersChange = useCallback((users: DeskUser[]) => {
    setDeskUsers(users);
  }, []);

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
        <AccessManager onUsersChange={onUsersChange} />
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-display text-2xl">Passwords</h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            Set a new password for a front desk account, or for your own admin account.
          </p>
        </div>
        <PasswordManager deskUsers={deskUsers} />
      </section>
    </div>
  );
}
