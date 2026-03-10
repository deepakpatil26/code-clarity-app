"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Github, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signInWithEmail, loading, signInWithGitHub } = useAuth();
  const router = useRouter();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await signInWithEmail(email, password);
    if (success) {
      router.push("/dashboard");
    }
  };

  const handleGitHubSignIn = async () => {
    const success = await signInWithGitHub();
    if (success) {
      router.push("/dashboard");
    }
  };

  return (
    <div className="dark relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#030014]">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 text-white">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/20 rounded-full blur-[120px] animate-pulse delay-1000"></div>
        <div className="absolute inset-0 noise opacity-20"></div>
      </div>
 
       <motion.div 
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.5 }}
         className="relative z-10 w-full max-w-md px-4"
       >
        <Card className="glass border-white/10 shadow-2xl backdrop-blur-2xl bg-black/60 text-white overflow-hidden">
          <CardHeader className="space-y-1 text-center pb-8 border-b border-white/5 mb-6">
             <div className="flex justify-center mb-6">
               <div className="p-4 bg-primary/10 rounded-3xl border border-primary/20 shadow-lg shadow-primary/10">
                  <Image
                    src="/logo.png"
                    alt="CodeClarity Logo"
                    width={56}
                    height={56}
                    className="rounded-xl"
                  />
               </div>
             </div>
            <CardTitle className="text-4xl font-black tracking-tight text-white mb-2">
              <span className="text-gradient">Welcome Back</span>
            </CardTitle>
            <CardDescription className="text-white/50 font-medium">
              Continue your AI-powered engineering journey
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <Button
              variant="outline"
              className="w-full h-12 border-white/10 bg-white/5 hover:bg-white/10 text-white transition-all duration-300 rounded-xl font-bold"
              onClick={handleGitHubSignIn}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Github className="mr-2 h-5 w-5" />
              )}
              Continue with GitHub
            </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
                <span className="bg-[#030014] px-4 text-white/30 rounded-full border border-white/5">
                  Secure Email Gateway
                </span>
              </div>
            </div>
            <form onSubmit={handleSignIn} className="grid gap-5">
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-white/70 text-xs font-bold uppercase tracking-wider">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:ring-primary focus:border-primary rounded-xl"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" id="password-label" className="text-white/70 text-xs font-bold uppercase tracking-wider">Password</Label>
                  <Link href="#" className="text-[10px] text-primary hover:underline font-bold uppercase tracking-tighter">Forgot access?</Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="h-11 bg-white/5 border-white/10 text-white focus:ring-primary focus:border-primary rounded-xl"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
              <Button 
                type="submit" 
                variant="gradient"
                className="w-full h-12 text-sm font-black transition-all shadow-xl shadow-primary/20 mt-2 rounded-xl" 
                disabled={loading}
              >
                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "AUTHENTICATE PRO"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 border-t border-white/5 pt-6 bg-white/5 mt-4">
            <div className="text-center text-sm text-white/40">
              New to the Pro tier?{" "}
              <Link href="/signup" className="text-primary hover:underline font-bold decoration-2 underline-offset-4">
                Initialize Account
              </Link>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
