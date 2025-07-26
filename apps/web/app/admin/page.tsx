import { Card } from "@web42-ai/ui/card";
import { Users, FolderOpen, Settings } from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Welcome to the admin dashboard. Manage users, projects, and settings.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/admin/users">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Users</h3>
                <p className="text-gray-600">Manage user accounts and permissions</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/admin/projects">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FolderOpen className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Projects</h3>
                <p className="text-gray-600">View and manage projects</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/admin/settings">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Settings className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Settings</h3>
                <p className="text-gray-600">Configure system settings</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}