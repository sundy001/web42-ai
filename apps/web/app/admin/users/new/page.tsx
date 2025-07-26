"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@web42-ai/ui/button";
import { Card } from "@web42-ai/ui/card";
import { Input } from "@web42-ai/ui/input";
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

const API_BASE_URL = "http://localhost:3002";

export default function NewUserPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    authProvider: "email",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      const response = await fetch(`${API_BASE_URL}/api/v1/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create user");
      }

      const newUser = await response.json();
      alert("User created successfully!");
      router.push(`/admin/users/${newUser._id}`);
    } catch (err) {
      alert("Failed to create user: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/users">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add New User</h1>
          <p className="mt-2 text-gray-600">
            Create a new user account
          </p>
        </div>
      </div>

      <div className="max-w-2xl">
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
                    placeholder="Enter user's full name"
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
                    placeholder="Enter user's email address"
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

              <div className="flex justify-end gap-4">
                <Link href="/admin/users">
                  <Button variant="outline" type="button">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={saving}>
                  {saving ? "Creating..." : "Create User"}
                </Button>
              </div>
            </div>
          </Form>
        </Card>
      </div>
    </div>
  );
}