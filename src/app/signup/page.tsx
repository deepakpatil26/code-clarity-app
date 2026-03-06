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
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#030014]">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[120px] animate-pulse delay-700"></div>
        <div className="absolute inset-0 noise opacity-20"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md px-4"
      >
        <Card className="glass border-white/10 shadow-2xl backdrop-blur-xl bg-black/40 text-white">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-6">
              <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
                 <Image
                   src="/logo.png"
                   alt="CodeClarity Logo"
                   width={48}
                   height={48}
                   className="rounded-xl"
                 />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight text-white">Create Account</CardTitle>
            <CardDescription className="text-gray-400">
              Join CodeClarity Pro today
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSignUp}>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-gray-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:ring-primary"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password" id="password-label" className="text-gray-300">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:ring-primary"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  minLength={6}
                />
                <p className="text-[10px] text-gray-500">
                  Password must be at least 6 characters.
                </p>
              </div>
              <Button type="submit" className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-semibold transition-all shadow-lg shadow-primary/20 mt-2" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign Up"}
              </Button>
            </CardContent>
          </form>
          <CardFooter className="flex flex-col gap-4 border-t border-white/5 pt-6 mt-2">
            <div className="text-center text-sm text-gray-400">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
