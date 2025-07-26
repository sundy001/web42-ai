"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trash2, RotateCcw } from "lucide-react";
import { Button } from "@web42-ai/ui/button";
import { Card } from "@web42-ai/ui/card";
import { Input } from "@web42-ai/ui/input";
import { Label } from "@web42-ai/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@web42-ai/ui/select";
import {
  Form,
  FormField,
  FormLabel,
  FormControl,
} from "@web42-ai/ui/form";

interface User {
  _id: string;
  email: string;
  name: string;
  authProvider: string;
  status: "active" | "inactive" | "deleted";
  createdAt: string;
  updatedAt: string;
}

const API_BASE_URL = "http://localhost:3002";

export default function UserDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    authProvider: "",
    status: "",
  });

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/v1/users/${params.id}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch user");
      }
      
      const userData: User = await response.json();
      setUser(userData);
      setFormData({
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
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      const response = await fetch(`${API_BASE_URL}/api/v1/users/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          authProvider: formData.authProvider,
          status: formData.status,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update user");
      }

      const updatedUser: User = await response.json();
      setUser(updatedUser);
      alert("User updated successfully!");
    } catch (err) {
      alert("Failed to update user: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/users/${params.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete user");
      }

      alert("User deleted successfully!");
      router.push("/admin/users");
    } catch (err) {
      alert("Failed to delete user: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  };

  const handleRestore = async () => {
    if (!confirm("Are you sure you want to restore this user?")) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/users/${params.id}/restore`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to restore user");
      }

      alert("User restored successfully!");
      fetchUser(); // Refresh user data
    } catch (err) {
      alert("Failed to restore user: " + (err instanceof Error ? err.message : "Unknown error"));
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
          <div className="text-lg text-red-600">Error: {error || "User not found"}</div>
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
            <Form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <FormField>
                  <FormLabel htmlFor="name">Name</FormLabel>
                  <FormControl>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </FormControl>
                </FormField>

                <FormField>
                  <FormLabel htmlFor="email">Email</FormLabel>
                  <FormControl>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                    />
                  </FormControl>
                </FormField>

                <FormField>
                  <FormLabel>Auth Provider</FormLabel>
                  <FormControl>
                    <Select
                      value={formData.authProvider}
                      onValueChange={(value) =>
                        setFormData({ ...formData, authProvider: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select auth provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="google">Google</SelectItem>
                        <SelectItem value="github">GitHub</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormField>

                {user.status !== "deleted" && (
                  <FormField>
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <Select
                        value={formData.status}
                        onValueChange={(value) =>
                          setFormData({ ...formData, status: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormField>
                )}

                <div className="flex justify-end">
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
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