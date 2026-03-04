export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UserManagementTable } from "@/components/admin/user-management-table";

export default async function UsersPage() {
  const session = await auth();

  if (session?.user?.role !== "SUPER_ADMIN") {
    redirect("/admin");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Manage Admins</h1>
      <p className="text-sm text-gray-600">
        Add or remove admin privileges for users. Only super admins can manage
        this.
      </p>
      <UserManagementTable />
    </div>
  );
}
