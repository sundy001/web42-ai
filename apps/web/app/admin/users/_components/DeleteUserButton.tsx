"use client";

import { deleteUser } from "@/lib/api/users";
import { Button } from "@web42-ai/ui/button";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface DeleteUserButtonProps {
  userId: string;
}

export function DeleteUserButton({ userId }: DeleteUserButtonProps) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {
      await deleteUser(userId);
      router.refresh();
    } catch (err) {
      alert(
        "Failed to delete user: " +
          (err instanceof Error ? err.message : "Unknown error"),
      );
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDelete}
      className="text-red-600 hover:text-red-800"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
