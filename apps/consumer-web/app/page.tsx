import { Button } from "@web42-ai/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@web42-ai/ui/card";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-16">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
              Welcome to Web42 AI
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Generate beautiful, fully-functional websites with just a single
              description. Powered by AI, optimized for performance.
            </p>
          </div>

          <div className="flex justify-center gap-4">
            <Button size="lg">Get Started</Button>
            <Button variant="outline" size="lg">
              Learn More
            </Button>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Generation</CardTitle>
              <CardDescription>
                Our advanced AI understands your vision and creates modern,
                responsive websites
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Simply describe your website idea, and our AI will generate
                clean, production-ready code tailored to your needs.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Real-time Preview</CardTitle>
              <CardDescription>
                Watch your website come to life with live updates and instant
                previews
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                See changes in real-time as our AI builds your site, with the
                ability to iterate and refine until it's perfect.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Deploy Instantly</CardTitle>
              <CardDescription>
                One-click deployment to fast, global CDN infrastructure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Your generated website is automatically optimized and deployed
                to our global network for lightning-fast performance.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
