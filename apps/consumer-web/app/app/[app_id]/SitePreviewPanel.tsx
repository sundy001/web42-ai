"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@web42-ai/ui/card";
import { Sparkles } from "lucide-react";

export default function SitePreviewPanel() {
  return (
    <div className="flex-1 bg-muted/30 p-4">
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Site Preview</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-medium text-lg">Ready to Build</h3>
              <p className="text-muted-foreground text-sm">
                Start chatting with the AI to see your site come to life
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
