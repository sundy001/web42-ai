"use client";

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
import { Calendar, Eye, Globe, Plus } from "lucide-react";
import { useState } from "react";

interface Project {
  id: string;
  name: string;
  description: string;
  status: "active" | "completed" | "archived";
  owner: string;
  createdAt: string;
  lastDeployment: string | null;
  url: string | null;
}

// Mock data for projects
const mockProjects: Project[] = [
  {
    id: "1",
    name: "E-commerce Website",
    description: "Modern e-commerce platform with React and Node.js",
    status: "active",
    owner: "john@example.com",
    createdAt: "2024-01-15T10:00:00Z",
    lastDeployment: "2024-01-20T15:30:00Z",
    url: "https://shop.example.com",
  },
  {
    id: "2",
    name: "Portfolio Site",
    description: "Personal portfolio website for a designer",
    status: "completed",
    owner: "jane@example.com",
    createdAt: "2024-01-10T14:20:00Z",
    lastDeployment: "2024-01-18T09:15:00Z",
    url: "https://portfolio.example.com",
  },
  {
    id: "3",
    name: "Corporate Landing",
    description: "Landing page for a tech startup",
    status: "active",
    owner: "mike@example.com",
    createdAt: "2024-01-22T11:45:00Z",
    lastDeployment: null,
    url: null,
  },
  {
    id: "4",
    name: "Blog Platform",
    description: "Multi-user blog platform with CMS",
    status: "archived",
    owner: "sarah@example.com",
    createdAt: "2023-12-05T16:30:00Z",
    lastDeployment: "2023-12-20T12:00:00Z",
    url: "https://blog.example.com",
  },
];

export default function ProjectsPage() {
  const [projects] = useState<Project[]>(mockProjects);

  const getStatusBadge = (status: Project["status"]) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "completed":
        return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>;
      case "archived":
        return <Badge className="bg-gray-100 text-gray-800">Archived</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="mt-2 text-gray-600">
            View and manage all website projects
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Globe className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                Total Projects
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {projects.length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active</p>
              <p className="text-2xl font-bold text-gray-900">
                {projects.filter((p) => p.status === "active").length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {projects.filter((p) => p.status === "completed").length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Calendar className="h-6 w-6 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Archived</p>
              <p className="text-2xl font-bold text-gray-900">
                {projects.filter((p) => p.status === "archived").length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Last Deployment</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => (
              <TableRow key={project.id}>
                <TableCell className="font-medium">{project.name}</TableCell>
                <TableCell className="max-w-xs truncate">
                  {project.description}
                </TableCell>
                <TableCell>{project.owner}</TableCell>
                <TableCell>{getStatusBadge(project.status)}</TableCell>
                <TableCell>
                  {new Date(project.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {project.lastDeployment
                    ? new Date(project.lastDeployment).toLocaleDateString()
                    : "Never"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    {project.url && (
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={project.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Globe className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
