import { asc } from "drizzle-orm";

import { formatDate } from "@/lib/format";
import { requireAdmin } from "@/server/auth/session";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { RoleSelect } from "./role-select";

export const metadata = { title: "People" };

export default async function AdminPeoplePage() {
  const admin = await requireAdmin();

  const people = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      affiliation: users.affiliation,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(asc(users.name));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">People</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Grant the reviewer role to committee members so they can open assigned
          manuscripts.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-left">
            <tr>
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">Email</th>
              <th className="p-3 font-medium">Affiliation</th>
              <th className="p-3 font-medium">Joined</th>
              <th className="p-3 font-medium">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {people.map((person) => (
              <tr key={person.id} className="hover:bg-accent/30">
                <td className="p-3 font-medium">{person.name}</td>
                <td className="p-3 text-muted-foreground">{person.email}</td>
                <td className="p-3 text-muted-foreground">
                  {person.affiliation ?? "—"}
                </td>
                <td className="whitespace-nowrap p-3 text-muted-foreground">
                  {formatDate(person.createdAt)}
                </td>
                <td className="p-3">
                  <RoleSelect
                    userId={person.id}
                    role={person.role}
                    disabled={person.id === admin.id}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
