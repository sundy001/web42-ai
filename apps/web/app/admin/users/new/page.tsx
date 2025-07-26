"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@web42-ai/ui/button";
import { Card } from "@web42-ai/ui/card";
import { FormInput } from "@web42-ai/ui/input";
import { FormSelect } from "@web42-ai/ui/select";
import {
  Form,
  FormField,
  FormLabel,
  FormControl,
  FormMessage,
} from "@web42-ai/ui/form";

const API_BASE_URL = "http://localhost:3002";

interface CreateUserForm {
  name: string;
  email: string;
  authProvider: string;
}

export default function NewUserPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  
  const {
    control,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<CreateUserForm>({
    defaultValues: {
      name: "",
      email: "",
      authProvider: "email",
    },
  });

  const authProviderOptions = [
    { value: "google", label: "Google" },
    { value: "github", label: "GitHub" },
    { value: "email", label: "Email" },
  ];

  const onSubmit = async (data: CreateUserForm) => {
    try {
      setSaving(true);
      const response = await fetch(`${API_BASE_URL}/api/v1/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle validation errors
        if (response.status === 400 && errorData.details) {
          errorData.details.forEach((detail: { field: string; message: string }) => {
            setError(detail.field as keyof CreateUserForm, {
              message: detail.message,
            });
          });
          return;
        }
        
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
          <Form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-6">
              <FormField>
                <FormLabel htmlFor="name">Name</FormLabel>
                <FormControl>
                  <FormInput
                    name="name"
                    control={control}
                    rules={{
                      required: "Name is required",
                      minLength: {
                        value: 2,
                        message: "Name must be at least 2 characters",
                      },
                    }}
                    id="name"
                    placeholder="Enter user's full name"
                  />
                </FormControl>
                <FormMessage>{errors.name?.message}</FormMessage>
              </FormField>

              <FormField>
                <FormLabel htmlFor="email">Email</FormLabel>
                <FormControl>
                  <FormInput
                    name="email"
                    control={control}
                    rules={{
                      required: "Email is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email address",
                      },
                    }}
                    id="email"
                    type="email"
                    placeholder="Enter user's email address"
                  />
                </FormControl>
                <FormMessage>{errors.email?.message}</FormMessage>
              </FormField>

              <FormField>
                <FormLabel>Auth Provider</FormLabel>
                <FormControl>
                  <FormSelect
                    name="authProvider"
                    control={control}
                    rules={{ required: "Auth provider is required" }}
                    options={authProviderOptions}
                    placeholder="Select auth provider"
                  />
                </FormControl>
                <FormMessage>{errors.authProvider?.message}</FormMessage>
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