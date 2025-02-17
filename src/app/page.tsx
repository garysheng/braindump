import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Mic, FileText, Github } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-6 sm:p-24">
      <div className="flex flex-col items-center space-y-16">
        <div className="flex items-center gap-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-transparent bg-clip-text italic pr-2">BrainDump</h1>
        </div>

        <div className="text-center max-w-2xl mx-auto space-y-4">
          <h2 className="text-3xl font-semibold">Speak Your v0: Voice → Text → Draft in Minutes</h2>
          <p className="text-xl text-muted-foreground">
            Record your thoughts through guided questions, then use AI to quickly transform your voice responses into first drafts. Export to ChatGPT, Google Docs, or Notion for further refinement.
          </p>
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
            Open source and free to use. Fork it on <a href="https://github.com/garysheng/braindump" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
              GitHub <Github className="w-4 h-4" />
            </a> to customize it for your needs.
          </p>
        </div>

        <div className="flex flex-col items-center gap-8">
          <Link href="/login">
            <Button
              size="lg"
              className="text-2xl h-auto py-6 px-8 gap-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 relative overflow-hidden group"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full duration-1000 transform transition-transform"></span>
              Get Started <ArrowRight className="w-6 h-6" />
            </Button>
          </Link>
          <p className="text-muted-foreground">
            Sign in with Google to start recording
          </p>
        </div>
      </div>

      {/* How it Works Section */}
      <div className="mt-32 w-full max-w-4xl px-4 sm:px-0">
        <h2 className="text-2xl font-semibold text-center mb-12">How it Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8">
          <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-lg bg-card border">
            <div className="p-3 rounded-full bg-primary/10">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-medium">1. Choose Questions</h3>
            <p className="text-sm text-muted-foreground">
              Select from templates or let AI generate thoughtful prompts tailored to your writing goals.
            </p>
          </div>

          <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-lg bg-card border">
            <div className="p-3 rounded-full bg-primary/10">
              <Mic className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-medium">2. Record Responses</h3>
            <p className="text-sm text-muted-foreground">
              Answer each question by voice, with instant transcription and easy re-recording if needed.
            </p>
          </div>

          <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-lg bg-card border">
            <div className="p-3 rounded-full bg-primary/10">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-medium">3. Generate & Export</h3>
            <p className="text-sm text-muted-foreground">
              Get your raw responses or quick first drafts using Claude or Gemini, then refine them in your favorite editor.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
