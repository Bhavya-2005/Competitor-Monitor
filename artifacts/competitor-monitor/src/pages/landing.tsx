import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Brain,
  Tag,
  Newspaper,
  MessageSquare,
  Zap,
  History,
  Radar,
  ArrowRight,
} from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground selection:bg-primary/30 flex flex-col overflow-x-hidden">
      {/* Navbar */}
      <header className="fixed top-0 w-full z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold tracking-tight text-primary">
            <Radar className="h-6 w-6" />
            <span className="text-lg uppercase tracking-widest">Competitor Watcher</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link
              href="/sign-in"
              data-testid="nav-sign-in"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Sign In
            </Link>
            <Button asChild size="sm" className="hidden sm:inline-flex shadow-lg shadow-primary/20">
              <Link href="/sign-up" data-testid="nav-sign-up">
                Get Started
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden flex-1 flex flex-col justify-center">
        {/* Abstract background elements */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] opacity-50"></div>
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] opacity-30"></div>
          
          {/* Cyberpunk grid overlay */}
          <div 
            className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" 
            style={{ maskImage: 'radial-gradient(ellipse 60% 50% at 50% 50%, #000 70%, transparent 100%)' }}
          ></div>
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-8 shadow-[0_0_15px_-3px_rgba(14,165,233,0.3)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            System Online & Monitoring
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl mx-auto leading-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50">
            Know every move your <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-300">
              competitors make.
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            AI-powered surveillance for modern SaaS. Monitor pricing, features, content, and hiring before they even announce it.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="w-full sm:w-auto h-14 px-8 text-base font-semibold shadow-[0_0_20px_-5px_rgba(14,165,233,0.5)] hover:shadow-[0_0_25px_-5px_rgba(14,165,233,0.7)] transition-all group">
              <Link href="/sign-up" data-testid="cta-start-monitoring">
                Start monitoring free
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto h-14 px-8 text-base font-semibold border-border/50 hover:bg-white/5 backdrop-blur-sm">
              <Link href="/sign-in" data-testid="cta-sign-in">
                Sign in
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-[#080a0f] relative z-10 border-t border-border/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Total Intelligence Coverage.</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Deploy autonomous agents to scrape, analyze, and alert you of strategic shifts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <FeatureCard 
              icon={<Brain className="h-6 w-6 text-primary" />}
              title="AI-Powered Analysis"
              description="Our LLMs extract structured insights from unstructured competitor pages."
            />
            <FeatureCard 
              icon={<Tag className="h-6 w-6 text-emerald-400" />}
              title="Pricing Detection"
              description="Get instant alerts when competitors change their pricing or packaging."
            />
            <FeatureCard 
              icon={<Newspaper className="h-6 w-6 text-purple-400" />}
              title="Blog & Jobs Alerts"
              description="Monitor content strategy and hiring trends to predict their next move."
            />
            <FeatureCard 
              icon={<MessageSquare className="h-6 w-6 text-pink-400" />}
              title="Slack Digest"
              description="Receive beautifully formatted daily or weekly intelligence digests in your team channel."
            />
            <FeatureCard 
              icon={<Zap className="h-6 w-6 text-yellow-400" />}
              title="Daily Automation"
              description="Set it once and forget it. We scan your competitors every 24 hours automatically."
            />
            <FeatureCard 
              icon={<History className="h-6 w-6 text-blue-400" />}
              title="Change History"
              description="Access a complete historical timeline of every change a competitor has ever made."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border/40 py-8 bg-background relative z-10">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold tracking-tight text-muted-foreground">
            <Radar className="h-5 w-5" />
            <span className="uppercase tracking-widest text-xs">Competitor Watcher</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Competitor Watcher. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm font-medium">
            <Link href="/sign-in" data-testid="footer-sign-in" className="text-muted-foreground hover:text-primary transition-colors">
              Sign In
            </Link>
            <Link href="/sign-up" data-testid="footer-sign-up" className="text-muted-foreground hover:text-primary transition-colors">
              Start Free
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-card/30 backdrop-blur-sm border border-border/40 rounded-2xl p-6 hover:border-primary/50 hover:bg-card/50 transition-all duration-300 group flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="h-12 w-12 rounded-xl bg-background border border-border flex items-center justify-center mb-6 group-hover:scale-110 transition-transform relative z-10 shadow-sm shadow-black/50">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-3 relative z-10 tracking-tight">{title}</h3>
      <p className="text-muted-foreground leading-relaxed flex-1 relative z-10 text-sm">
        {description}
      </p>
    </div>
  );
}
