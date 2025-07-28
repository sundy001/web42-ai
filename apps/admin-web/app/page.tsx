"use client";

import { Bell, Heart, Mail, Settings, Star, User } from "lucide-react";
import { useState } from "react";

import { Badge } from "@web42-ai/ui/badge";
import { Button } from "@web42-ai/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@web42-ai/ui/card";
import { Input } from "@web42-ai/ui/input";

export default function DemoPage() {
  const [email, setEmail] = useState("");
  const [notification, setNotification] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(`Welcome ${email}! You've been subscribed.`);
    setEmail("");
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">shadcn/ui Demo</h1>
          <p className="text-xl text-muted-foreground">
            A showcase of beautifully designed components
          </p>
        </div>

        {/* Buttons Section */}
        <Card>
          <CardHeader>
            <CardTitle>Buttons</CardTitle>
            <CardDescription>
              Different button variants and sizes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Button>Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
              <Button variant="destructive">Destructive</Button>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
              <Button size="icon">
                <Heart className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button>
                <Star className="mr-2 h-4 w-4" />
                With Icon
              </Button>
              <Button disabled>Disabled</Button>
            </div>
          </CardContent>
        </Card>

        {/* Cards and Badges Section */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>User Profile</CardTitle>
                <Badge>Pro</Badge>
              </div>
              <CardDescription>
                Manage your account settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary">
                  <User className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">John Doe</p>
                  <p className="text-sm text-muted-foreground">
                    john@example.com
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Stay updated with the latest news
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Bell className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">New message received</span>
                  <Badge variant="secondary">New</Badge>
                </div>
                <div className="flex items-center space-x-3">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">You have 5 new likes</span>
                  <Badge variant="outline">5</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Newsletter</CardTitle>
              <CardDescription>Subscribe to our weekly updates</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Button type="submit" className="w-full">
                  <Mail className="mr-2 h-4 w-4" />
                  Subscribe
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Badges Showcase */}
        <Card>
          <CardHeader>
            <CardTitle>Badges</CardTitle>
            <CardDescription>Various badge styles and variants</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="destructive">Destructive</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Form Demo */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Form</CardTitle>
            <CardDescription>
              A sample form using Input components
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">First Name</label>
                <Input placeholder="John" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Last Name</label>
                <Input placeholder="Doe" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input type="email" placeholder="john@example.com" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Message</label>
              <Input placeholder="Your message here..." />
            </div>
          </CardContent>
          <CardFooter className="justify-end space-x-2">
            <Button variant="outline">Cancel</Button>
            <Button>Send Message</Button>
          </CardFooter>
        </Card>

        {/* Notification Display */}
        {notification && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                  <Mail className="h-4 w-4 text-green-600" />
                </div>
                <p className="text-green-800">{notification}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
