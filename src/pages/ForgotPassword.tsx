import { useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SEOHead } from "@/components/SEOHead";

export default function ForgotPassword() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const pending = useRef(false);

  async function requestReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    pending.current = true;
    setSending(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: new URL("/reset-password", window.location.origin).href,
      });
      if (error) throw error;
      setSent(true);
    } catch {
      toast({ title: "Could not request a reset link", description: "Please try again later.", variant: "destructive" });
    } finally {
      pending.current = false;
      setSending(false);
    }
  }

  return <main className="grid min-h-dvh place-items-center bg-background p-4">
    <SEOHead title="Forgot Password" description="Request a password reset link for your Prasadam account." noIndex />
    <section className="w-full max-w-md space-y-4 rounded-xl border bg-card p-6">
      <h1 className="text-2xl font-semibold">Reset Password</h1>
      {sent ? <p role="status" className="text-muted-foreground">If an account exists for that address, check your inbox for a reset link.</p> :
        <form className="space-y-3" onSubmit={requestReset}>
          <Label htmlFor="recovery-email">Email Address</Label>
          <Input id="recovery-email" type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} />
          <Button type="submit" className="w-full" disabled={sending}>{sending ? "Sending…" : "Send Reset Link"}</Button>
        </form>}
      <Link to="/login" className="inline-block text-sm underline">Back to Login</Link>
    </section>
  </main>;
}
