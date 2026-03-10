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
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { motion } from "framer-motion";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signUpWithEmail, loading } = useAuth();
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await signUpWithEmail(email, password);
    if (success) {
      router.push("/dashboard");
    }
  };

  return (
    <div className="dark relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#030014]">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-accent/20 rounded-full blur-[120px] animate-pulse delay-700"></div>
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
              <span className="text-gradient">Create Account</span>
            </CardTitle>
            <CardDescription className="text-white/50 font-medium">
              Join CodeClarity Pro today
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSignUp}>
            <CardContent className="grid gap-5">
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
                <Label htmlFor="password" id="password-label" className="text-white/70 text-xs font-bold uppercase tracking-wider">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:ring-primary focus:border-primary rounded-xl"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  minLength={6}
                />
                <p className="text-[10px] text-white/30 font-medium uppercase tracking-tighter">
                  Minimum 6 characters for enterprise-grade security.
                </p>
              </div>
              <Button 
                type="submit" 
                variant="gradient"
                className="w-full h-12 text-sm font-black transition-all shadow-xl shadow-primary/20 mt-2 rounded-xl" 
                disabled={loading}
              >
                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "PROVISON ACCOUNT"}
              </Button>
            </CardContent>
          </form>
          <CardFooter className="flex flex-col gap-4 border-t border-white/5 pt-6 bg-white/5 mt-4">
            <div className="text-center text-sm text-white/40">
              Already standardized?{" "}
              <Link href="/login" className="text-primary hover:underline font-bold decoration-2 underline-offset-4">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
