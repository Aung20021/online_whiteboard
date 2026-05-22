"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    setPending(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    setPending(false);
    if (error) return toast.error(error.message);
    toast.success("Account created. Check your email if confirmation is enabled.");
  };

  return (
    <main className="min-h-screen bg-neutral-100 flex items-center justify-center px-4">
      <form onSubmit={onSubmit} className="w-full max-w-md bg-white rounded-2xl shadow-sm border p-8 space-y-5">
        <div>
          <h1 className="text-3xl font-semibold">Create account</h1>
          <p className="text-sm text-muted-foreground mt-2">Start using your Supabase + Liveblocks whiteboard.</p>
        </div>
        <Input required placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input type="password" required minLength={6} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button disabled={pending} className="w-full" type="submit">Create account</Button>
        <p className="text-sm text-center text-muted-foreground">Already have an account? <Link className="text-blue-600 hover:underline" href="/login">Sign in</Link></p>
      </form>
    </main>
  );
}
