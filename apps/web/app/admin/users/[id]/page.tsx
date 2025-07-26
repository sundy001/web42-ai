"use client";

import { Button } from "@web42-ai/ui/button";
import { Card } from "@web42-ai/ui/card";
import { Form } from "@web42-ai/ui/form";
import { FormInput } from "@web42-ai/ui/input";
import { Label } from "@web42-ai/ui/label";
import { FormSelect } from "@web42-ai/ui/select";
import { ArrowLeft, RotateCcw, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";

interface User {
  _id: string;
  email: string;
  name: string;
  authProvider: string;
  status: "active" | "inactive" | "deleted";
  createdAt: string;
  updatedAt: string;
}

interface UpdateUserForm {
  name: string;
  email: string;
  authProvider: string;
  status: string;
}

const API_BASE_URL = "http://localhost:3002";

export default function UserDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const methods = useForm<UpdateUserForm>({
    defaultValues: {
      name: "",
      email: "",
      authProvider: "",
      status: "",
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

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/v1/users/${params.id}`);

      if (!response.ok) {
        throw new Error("Failed to fetch user");
      }

      const userData: User = await response.json();
      setUser(userData);
      reset({
        name: userData.name,
        email: userData.email,
        authProvider: userData.authProvider,
        status: userData.status,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [params.id, reset]);

  const onSubmit = async (data: UpdateUserForm) => {
    try {
      setSaving(true);
      const response = await fetch(
        `${API_BASE_URL}/api/v1/users/${params.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();

        // Handle validation errors
        if (response.status === 400 && errorData.details) {
          errorData.details.forEach(
            (detail: { field: string; message: string }) => {
              setFormError(detail.field as keyof UpdateUserForm, {
                message: detail.message,
              });
            },
          );
          return;
        }

        throw new Error(errorData.message || "Failed to update user");
      }

      const updatedUser: User = await response.json();
      setUser(updatedUser);
      alert("User updated successfully!");
    } catch (err) {
      alert(
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
      const response = await fetch(
        `${API_BASE_URL}/api/v1/users/${params.id}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete user");
      }

      alert("User deleted successfully!");
      router.push("/admin/users");
    } catch (err) {
      alert(
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
      const response = await fetch(
        `${API_BASE_URL}/api/v1/users/${params.id}/restore`,
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to restore user");
      }

      alert("User restored successfully!");
      fetchUser(); // Refresh user data
    } catch (err) {
      alert(
        "Failed to restore user: " +
          (err instanceof Error ? err.message : "Unknown error"),
      );
    }
  };

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

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
                  <FormInput
                    name="name"
                    label="Name"
                    rules={{
                      required: "Name is required",
                      minLength: {
                        value: 2,
                        message: "Name must be at least 2 characters",
                      },
                    }}
                    id="name"
                    placeholder="Enter user's full name"
                    message={errors.name?.message}
                  />
                  <FormInput
                    name="email"
                    label="Email"
                    rules={{
                      required: "Email is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email address",
                      },
                    }}
                    id="email"
                    placeholder="Enter user's email address"
                    message={errors.email?.message}
                  />
                  <FormSelect
                    name="authProvider"
                    label="Auth Provider"
                    options={authProviderOptions}
                    placeholder="Select auth provider"
                    message={errors.authProvider?.message}
                  />
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

        <div>
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              User Information
            </h3>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">
                  User ID
                </Label>
                <p className="text-sm text-gray-900 font-mono">{user._id}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">
                  Created At
                </Label>
                <p className="text-sm text-gray-900">
                  {new Date(user.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">
                  Last Updated
                </Label>
                <p className="text-sm text-gray-900">
                  {new Date(user.updatedAt).toLocaleString()}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">
                  Current Status
                </Label>
                <p className="text-sm text-gray-900 capitalize">
                  {user.status}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
