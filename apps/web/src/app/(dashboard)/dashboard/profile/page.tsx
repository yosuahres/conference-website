import { requireUser } from "@/server/auth/session";
import { ProfileForm } from "./profile-form";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await requireUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Used to prefill submission and registration forms. Changing it here
          does not alter a registration you have already paid for.
        </p>
      </div>

      <ProfileForm
        defaultValues={{
          name: user.name,
          title: user.title ?? "",
          affiliation: user.affiliation ?? "",
          country: user.country ?? "",
          phone: user.phone ?? "",
        }}
        email={user.email}
      />
    </div>
  );
}
