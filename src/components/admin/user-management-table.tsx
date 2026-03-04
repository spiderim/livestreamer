"use client";

import { useState, useEffect } from "react";

interface AdminUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string;
}

export function UserManagementTable() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  async function fetchAdmins() {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAdmins();
  }, []);

  async function handleAddAdmin(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setEmail("");
        fetchAdmins();
      }
    } catch {
      // Handle error
    } finally {
      setAdding(false);
    }
  }

  async function handleRemoveAdmin(userId: string) {
    if (!confirm("Remove this user from admin role?")) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchAdmins();
      }
    } catch {
      // Handle error
    }
  }

  return (
    <div className="space-y-6">
      {/* Add Admin Form */}
      <form onSubmit={handleAddAdmin} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="user@example.com"
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
          required
        />
        <button
          type="submit"
          disabled={adding}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {adding ? "Adding..." : "Add Admin"}
        </button>
      </form>

      {/* Admin List */}
      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : users.length === 0 ? (
        <p className="text-sm text-gray-500">No admins found</p>
      ) : (
        <div className="divide-y divide-gray-100 rounded-md border border-gray-200">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between px-4 py-3"
            >
              <div className="flex items-center gap-3">
                {user.image ? (
                  <img
                    src={user.image}
                    alt=""
                    className="h-8 w-8 rounded-full"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs">
                    {user.name?.[0] ?? "?"}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400 capitalize">
                  {user.role.toLowerCase().replace("_", " ")}
                </span>
                {user.role === "ADMIN" && (
                  <button
                    onClick={() => handleRemoveAdmin(user.id)}
                    className="rounded px-3 py-1 text-xs font-medium text-red-600 border border-red-200 hover:bg-red-50"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
