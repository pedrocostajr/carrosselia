import { redirect } from "next/navigation";

import { requireAdmin, listUsersWithActivity } from "@/lib/data/admin";
import { UsersTable } from "@/components/admin/users-table";

export default async function AdminPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/dashboard");

  const users = await listUsersWithActivity();
  const pendingCount = users.filter((u) => u.approval_status === "pending").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Administração</h1>
        <p className="text-sm text-muted-foreground">
          {users.length} usuário(s) · {pendingCount} aguardando aprovação
        </p>
      </div>
      <UsersTable users={users} currentUserId={admin.user.id} />
    </div>
  );
}
