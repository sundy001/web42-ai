"use client";

import { ApiRequestError } from "@/lib/api/errors";
import {
  deleteUser,
  fetchUser,
  restoreUser,
  updateUser,
} from "@/lib/api/users";
import { formatDateTime } from "@/lib/utils/dateUtils";
import { showError, showSuccess } from "@/lib/utils/toast";
import { UpdateUserRequest, User } from "@web42-ai/types";
import { Button } from "@web42-ai/ui/button";
import { Card } from "@web42-ai/ui/card";
import { Form } from "@web42-ai/ui/form";
import { Label } from "@web42-ai/ui/label";
import { FormSelect } from "@web42-ai/ui/select";
import { ArrowLeft, RotateCcw, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";

export default function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const methods = useForm<UpdateUserRequest>({
    defaultValues: {
      role: "user",
      status: "active",
    },
  });

  const {
    formState: { errors },
    reset,
    setError: setFormError,
  } = methods;

  const authProviderOptions = [
    { value: "google", label: "Google" },
    { value: "github", label: "GitHub" },
    { value: "email", label: "Email" },
  ];

  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  const loadUser = useCallback(async () => {
    try {
      setLoading(true);
      const user = await fetchUser(id);
      setUser(user);
      reset({
        role: user.role,
        status: user.status as "active" | "inactive",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [id, reset]);

  const onSubmit = async (data: UpdateUserRequest) => {
    try {
      setSaving(true);
      const updatedUser = await updateUser(id, data);
      setUser(updatedUser);
      showSuccess("User updated successfully!");
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 400 && err.details) {
        err.details.forEach((detail) => {
          setFormError(detail.field as keyof UpdateUserRequest, {
            message: detail.message,
          });
        });
        return;
      }
      showError(
        "Failed to update user: " +
          (err instanceof Error ? err.message : "Unknown error"),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {
      await deleteUser(id);
      showSuccess("User deleted successfully!");
      router.push("/admin/users");
    } catch (err) {
      showError(
        "Failed to delete user: " +
          (err instanceof Error ? err.message : "Unknown error"),
      );
    }
  };

  const handleRestore = async () => {
    if (!confirm("Are you sure you want to restore this user?")) {
      return;
    }

    try {
      await restoreUser(id);
      showSuccess("User restored successfully!");
      loadUser(); // Refresh user data
    } catch (err) {
      showError(
        "Failed to restore user: " +
          (err instanceof Error ? err.message : "Unknown error"),
      );
    }
  };

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading user...</div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="p-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-red-600">
            Error: {error || "User not found"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/users">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Users
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit User</h1>
            <p className="mt-2 text-gray-600">
              Update user information and settings
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {user.status === "deleted" ? (
            <Button
              onClick={handleRestore}
              className="bg-green-600 hover:bg-green-700"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Restore User
            </Button>
          ) : (
            <Button
              onClick={handleDelete}
              variant="outline"
              className="text-red-600 hover:text-red-800"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete User
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="p-6">
            <Form {...methods}>
              <form onSubmit={methods.handleSubmit(onSubmit)}>
                <div className="space-y-6">
                  <div>{user.name}</div>
                  <div>{user.email}</div>
                  {user.status !== "deleted" && (
                    <FormSelect
                      name="status"
                      label="Status"
                      options={statusOptions}
                      placeholder="Select status"
                      message={errors.status?.message}
                    />
                  )}
                  <div className="flex justify-end">
                    <Button type="submit" disabled={saving}>
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          </Card>
        </div>

        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            User Information
          </h3>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-500">
                User ID
              </Label>
              <p className="text-sm text-gray-900 font-mono">{user.id}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">
                Created At
              </Label>
              <p className="text-sm text-gray-900">
                {formatDateTime(user.createdAt)}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">
                Last Updated
              </Label>
              <p className="text-sm text-gray-900">
                {formatDateTime(user.updatedAt)}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">
                Current Status
              </Label>
              <p className="text-sm text-gray-900 capitalize">{user.status}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
