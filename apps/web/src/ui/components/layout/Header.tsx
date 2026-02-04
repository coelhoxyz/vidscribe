import { Github, Sparkles } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 glass border-b border-white/5">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 accent-gradient rounded-xl flex items-center justify-center glow-sm">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-white font-bold text-xl tracking-tight">VidScribe</span>
            <span className="text-[10px] text-gray-500 uppercase tracking-widest">AI Transcription</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 text-xs font-medium rounded-full border border-emerald-500/20">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
            Open Source
          </span>

          <a
            href="https://github.com/coelhoxyz/vidscribe"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-xl glass glass-hover text-gray-300 hover:text-white transition-all duration-200"
          >
            <Github size={18} />
            <span className="hidden sm:inline text-sm font-medium">Star on GitHub</span>
          </a>
        </div>
      </div>
    </header>
  );
}
