"use client";

import { Button } from "@web42-ai/ui/button";
import { Card } from "@web42-ai/ui/card";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useEffect } from "react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Users page error:", error);
  }, [error]);

  return (
    <div className="p-8">
      <div className="flex justify-center items-center min-h-[400px]">
        <Card className="p-8 max-w-lg w-full text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Something went wrong!
          </h2>
          <p className="text-gray-600 mb-6">
            There was an error loading the users page. This could be due to a
            network issue or server problem.
          </p>
          {error.digest && (
            <p className="text-sm text-gray-500 mb-4">
              Error ID: {error.digest}
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={reset} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Try again
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.href = "/admin"}
            >
              Back to Admin
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}