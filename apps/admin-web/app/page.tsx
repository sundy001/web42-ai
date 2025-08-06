"use client";

import { PromptTextarea } from "@/components/PromptTextarea";
import { createProjectFromPrompt } from "@/lib/api/projects";
import { showError, showSuccess } from "@/lib/utils/toast";
import { Button } from "@web42-ai/ui/button";
import { Loader2, Send, Shield, Sparkles, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function HomePage() {
  const [prompt, setPrompt] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  const handleCreateWebsite = async () => {
    if (!prompt.trim()) {
      showError("Please enter a description for your website");
      return;
    }

    setIsCreating(true);
    try {
      const result = await createProjectFromPrompt(prompt);
      showSuccess("Creating your website...");
      router.push(`/app/${result.project.id}`);
    } catch (error) {
      showError("Failed to create website. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800">
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Web42 AI
            </span>
          </div>
          <Link href="/admin/login">
            <Button variant="outline">Admin Login</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Build Amazing Websites
            <span className="block mt-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Powered by AI
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Transform your ideas into stunning static React sites with the power
            of artificial intelligence. No coding required.
          </p>

          {/* Prompt Input Section */}
          <div className="max-w-3xl mx-auto relative">
            <div className="animated-gradient-border bg-gray-700 rounded-2xl p-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleCreateWebsite();
                }}
              >
                <PromptTextarea
                  value={prompt}
                  onChange={setPrompt}
                  disabled={isCreating}
                  onSubmit={handleCreateWebsite}
                />
                <div className="flex justify-end">
                  <Button
                    size="icon"
                    type="submit"
                    disabled={isCreating || !prompt.trim()}
                  >
                    {isCreating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="text-center">
            <div className="h-16 w-16 bg-blue-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Zap className="h-8 w-8 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-white">
              Lightning Fast
            </h3>
            <p className="text-gray-300">
              Generate complete React sites in minutes, not hours. AI handles
              the heavy lifting.
            </p>
          </div>
          <div className="text-center">
            <div className="h-16 w-16 bg-purple-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-white">
              AI-Powered
            </h3>
            <p className="text-gray-300">
              Advanced AI understands your requirements and creates
              pixel-perfect components.
            </p>
          </div>
          <div className="text-center">
            <div className="h-16 w-16 bg-indigo-900/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-indigo-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-white">
              Enterprise Ready
            </h3>
            <p className="text-gray-300">
              Built with security and scalability in mind. Perfect for teams of
              any size.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center bg-gradient-to-r from-blue-700 to-purple-700 rounded-3xl p-12 text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Build Something Amazing?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of creators using AI to build the web.
          </p>
          <Link href="/admin/login">
            <Button size="lg" variant="secondary">
              Start Creating Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-gray-700">
        <div className="text-center text-gray-400">
          <p>&copy; 2024 Web42 AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
