"use client";

import { Button } from "@web42-ai/ui/button";
import { Eye, Menu, Sparkles } from "lucide-react";

interface AIBuilderHeaderProps {
  appId: string;
}

export default function AIBuilderHeader({ appId }: AIBuilderHeaderProps) {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">AI Site Builder</h1>
            <p className="text-sm text-muted-foreground">
              Project ID: {appId}
            </p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button size="sm">
            <Menu className="h-4 w-4 mr-2" />
            Deploy
          </Button>
        </div>
      </div>
    </header>
  );
}