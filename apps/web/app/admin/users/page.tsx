import type { User } from "@/lib/api/types";
import { fetchUsers } from "@/lib/api/users";
import { formatDate } from "@/lib/utils/dateUtils";
import { Badge } from "@web42-ai/ui/badge";
import { Button } from "@web42-ai/ui/button";
import { Card } from "@web42-ai/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@web42-ai/ui/table";
import { Eye, Plus } from "lucide-react";
import Link from "next/link";
import { DeleteUserButton } from "./_components/DeleteUserButton";
import { Pagination } from "./_components/Pagination";

interface UsersPageProps {
  searchParams: { page?: string };
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const page = Number(searchParams.page) || 1;

  let users: User[] = [];
  let pagination = {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  };
  let error: string | null = null;

  try {
    const data = await fetchUsers(page, 10);
    users = data.users;
    pagination = {
      page: data.page,
      limit: data.limit,
      total: data.total,
      totalPages: data.totalPages,
    };
  } catch (err) {
    error = err instanceof Error ? err.message : "An error occurred";
  }

  const getStatusBadge = (status: User["status"]) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "inactive":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">Inactive</Badge>
        );
      case "deleted":
        return <Badge className="bg-red-100 text-red-800">Deleted</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (error) {
    return (
      <div className="p-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-red-600">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <p className="mt-2 text-gray-600">
            Manage user accounts and their information
          </p>
        </div>
        <Link href="/admin/users/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </Link>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Auth Provider</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user._id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell className="capitalize">
                  {user.authProvider}
                </TableCell>
                <TableCell>{getStatusBadge(user.status)}</TableCell>
                <TableCell>{formatDate(user.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Link href={`/admin/users/${user._id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    {user.status !== "deleted" && (
                      <DeleteUserButton userId={user._id} />
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {users.length === 0 && (
          <div className="text-center py-8 text-gray-500">No users found.</div>
        )}
      </Card>

      <Pagination page={pagination.page} totalPages={pagination.totalPages} />
    </div>
  );
}
