"use client";

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { 
  Github, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  BarChart3, 
  Code2, 
  Search, 
  Lock, 
  Cpu, 
  CheckCircle2, 
  ChevronRight,
  Menu,
  X
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function LandingPage() {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="flex flex-col min-h-screen selection:bg-primary/30">
      {/* Navbar */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? "glass border-b py-3" : "bg-transparent py-5"}`}>
        <div className="container mx-auto px-6 md:px-12 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3 group">
             <div className="bg-primary p-2 rounded-xl group-hover:rotate-12 transition-transform duration-300">
                <Code2 className="text-white h-6 w-6" />
             </div>
             <span className="text-xl font-bold tracking-tight">CodeClarity <span className="text-primary">Pro</span></span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-medium hover:text-primary transition-colors">Features</Link>
            <Link href="#how-it-works" className="text-sm font-medium hover:text-primary transition-colors">How it works</Link>
            {user ? (
              <Button asChild className="rounded-full px-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                <Link href="/dashboard">Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            ) : (
              <div className="flex items-center gap-4">
                <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">Sign in</Link>
                <Button asChild className="rounded-full px-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                  <Link href="/login">Get Started <ChevronRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Toggle */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
             {mobileMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-background flex flex-col p-8 md:hidden"
          >
             <div className="mt-20 space-y-6">
                <Link href="#features" onClick={() => setMobileMenuOpen(false)} className="block text-2xl font-bold">Features</Link>
                <Link href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block text-2xl font-bold">How it works</Link>
                <div className="pt-8 space-y-4">
                   {user ? (
                     <Button asChild size="lg" className="w-full rounded-xl">
                       <Link href="/dashboard">Dashboard</Link>
                     </Button>
                   ) : (
                     <>
                        <Button asChild variant="outline" size="lg" className="w-full rounded-xl">
                          <Link href="/login">Sign in</Link>
                        </Button>
                        <Button asChild size="lg" className="w-full rounded-xl bg-primary">
                          <Link href="/login">Get Started</Link>
                        </Button>
                     </>
                   )}
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full -z-10 opacity-30">
           <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] animate-pulse"></div>
           <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/20 rounded-full blur-[120px] animate-pulse delay-1000"></div>
        </div>

        <div className="container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="outline" className="mb-6 py-1 px-4 rounded-full bg-primary/5 text-primary border-primary/20">
               ✨ Now with Automated PR Reviews
            </Badge>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8">
              Code Reviews That <br /> 
              <span className="text-gradient">Actually Make Sense</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
              Empower your team with AI-driven insights. Automatically review pull requests, detect vulnerabilities, and maintain performance at scale.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Button asChild size="lg" className="rounded-full px-10 h-14 text-lg bg-primary hover:bg-primary/90 shadow-xl shadow-primary/30">
                 <Link href="/login">Start Free Analysis <ArrowRight className="ml-2" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full px-10 h-14 text-lg glass backdrop-blur-sm">
                 <Link href="https://github.com/deepakpatil26/code-clarity-app"><Github className="mr-2" /> View on GitHub</Link>
              </Button>
            </div>
          </motion.div>

          {/* Hero Image / Mockup */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="mt-20 relative max-w-5xl mx-auto"
          >
             <div className="relative rounded-2xl border bg-card p-1 shadow-2xl overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-accent/10 pointer-events-none"></div>
                <Image 
                   src="/CodeClarity.gif" 
                   alt="CodeClarity Interface" 
                   width={1200} 
                   height={800} 
                   className="rounded-xl shadow-inner"
                   unoptimized
                />
             </div>
             {/* Decorative Elements */}
             <div className="absolute -top-6 -right-6 h-24 w-24 bg-primary/10 rounded-full blur-2xl animate-bounce duration-[3000ms]"></div>
             <div className="absolute -bottom-6 -left-6 h-32 w-32 bg-accent/10 rounded-full blur-2xl animate-bounce-slow"></div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-secondary/20 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
             <h2 className="text-3xl md:text-5xl font-bold mb-4">Powerful Analysis Engine</h2>
             <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
               Everything you need to ship high-quality, secure code without the manual overhead.
             </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Zap className="text-yellow-500" />}
              title="Automated PR Review"
              description="Get instant feedback on every pull request. No more waiting for manual reviews."
            />
            <FeatureCard 
              icon={<ShieldCheck className="text-red-500" />}
              title="Security Analysis"
              description="Detect common vulnerabilities like SQL injection and hardcoded secrets before they ship."
            />
            <FeatureCard 
              icon={<BarChart3 className="text-blue-500" />}
              title="Quality Scoring"
              description="Monitor codebase health with quantitative quality scores and actionable maintainability metrics."
            />
            <FeatureCard 
              icon={<Cpu className="text-purple-500" />}
              title="AI-Powered Insights"
              description="Leveraging Google's Gemini models to provide deep semantic understanding of your code."
            />
            <FeatureCard 
              icon={<Search className="text-green-500" />}
              title="Complexity Audits"
              description="Find deeply nested logic or overly complex functions that hinder maintainability."
            />
            <FeatureCard 
              icon={<Lock className="text-orange-500" />}
              title="Private & Secure"
              description="Your code stays secure. We only process diffs for analysis and never store your core IP."
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-primary/5 border-y">
         <div className="container mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
               <div className="text-4xl font-extrabold text-primary">100%</div>
               <div className="text-sm text-muted-foreground uppercase font-semibold">Automated</div>
            </div>
            <div className="space-y-2">
               <div className="text-4xl font-extrabold text-primary">&lt; 30s</div>
               <div className="text-sm text-muted-foreground uppercase font-semibold">Review Time</div>
            </div>
            <div className="space-y-2">
               <div className="text-4xl font-extrabold text-primary">6+</div>
               <div className="text-sm text-muted-foreground uppercase font-semibold">Languages</div>
            </div>
            <div className="space-y-2">
               <div className="text-4xl font-extrabold text-primary">AI</div>
               <div className="text-sm text-muted-foreground uppercase font-semibold">Native Engine</div>
            </div>
         </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
         <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto rounded-3xl bg-gradient-to-br from-primary to-accent p-12 text-center text-white shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-white/20 transition-colors duration-500"></div>
               <h2 className="text-4xl md:text-5xl font-bold mb-6 relative z-10">Ready to Upgrade Your Code Quality?</h2>
               <p className="text-xl mb-10 text-white/80 relative z-10 max-w-2xl mx-auto">
                 Join developers who use CodeClarity Pro to ship cleaner, safer, and faster code every day.
               </p>
               <Button asChild size="lg" className="rounded-full bg-white text-primary hover:bg-white/90 px-12 h-14 text-xl relative z-10 font-bold shadow-xl">
                  <Link href="/login">Get Started Now</Link>
               </Button>
            </div>
         </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t mt-auto">
         <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
               <Code2 className="text-primary h-5 w-5" />
               <span className="font-bold">CodeClarity Pro</span>
            </div>
            <p className="text-sm text-muted-foreground">© 2026 CodeClarity. Performance. Security. Clarity.</p>
            <div className="flex gap-6">
               <Link href="https://github.com/deepakpatil26/code-clarity-app" className="text-muted-foreground hover:text-primary"><Github className="h-5 w-5" /></Link>
            </div>
         </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="p-8 rounded-2xl bg-card border hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-xl group"
    >
       <div className="mb-6 bg-secondary/50 p-4 rounded-xl w-fit group-hover:bg-primary/10 transition-colors duration-300">
          {icon}
       </div>
       <h3 className="text-xl font-bold mb-3">{title}</h3>
       <p className="text-muted-foreground leading-relaxed">{description}</p>
    </motion.div>
  );
}
