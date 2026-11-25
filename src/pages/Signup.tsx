import { useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Lock, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SEOHead } from "@/components/SEOHead";
import { AuthShell } from "@/components/auth/AuthShell";
const BRAND = "hsl(var(--accent))";

export default function Signup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<"form" | "sent">("form");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const submitting = useRef(false);

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    if (!fullName.trim() || password.length < 6 || password !== confirmPassword) {
      toast({ title: "Check your details", description: "Enter your name and matching passwords of at least 6 characters.", variant: "destructive" });
      return;
    }
    submitting.current = true;
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(), password,
        options: { data: { full_name: fullName.trim() }, emailRedirectTo: new URL("/login", window.location.origin).href },
      });
      if (error) throw error;
      setPassword("");
      setConfirmPassword("");
      if (data.session) navigate("/dashboard", { replace: true });
      else setStep("sent");
    } catch (error) {
      toast({ title: "Sign up failed", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
    } finally {
      submitting.current = false;
      setIsLoading(false);
    }
  }

  return (
    <AuthShell mode="signup">
      <style dangerouslySetInnerHTML={{ __html: `
        .auth-grid-row { display: grid; gap: 1rem; width: 100%; }
        @media (min-width: 768px) {
          .auth-grid-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
      `}} />
      <SEOHead title="Create Account" description="Create your Prasadam account to start shopping premium devotional offerings." />
      <AnimatePresence mode="wait">
        {step === "form" && (
          <motion.div key="form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="auth-grid-row">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="fullName" type="text" placeholder="Your name" className="pl-10 h-11 bg-[#F5F5F5] border-transparent"
                      value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="email" type="email" placeholder="you@example.com" className="pl-10 h-11 bg-[#F5F5F5] border-transparent"
                      value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                </div>
              </div>

              <div className="auth-grid-row">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="password" type={showPassword ? "text" : "password"} placeholder="Password"
                      className="pl-10 pr-10 h-11 bg-[#F5F5F5] border-transparent" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="confirmPassword" type={showConfirm ? "text" : "password"} placeholder="Confirm password"
                      className="pl-10 pr-10 h-11 bg-[#F5F5F5] border-transparent" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>


              <div className="flex flex-col items-center">
                <Button type="submit" className="w-full h-12 text-base font-semibold text-white hover:opacity-90 shadow-md transition-all active:scale-[0.98]" style={{ backgroundColor: BRAND }} disabled={isLoading}>
                  {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Account…</>) : "Create Account"}
                </Button>
                <img
                  src="https://ik.imagekit.io/Prasadam/Status-scaled.jpg?updatedAt=1787405014112"
                  alt="Prasadam divine offerings"
                  loading="lazy"
                  decoding="async"
                  className="hidden md:block mt-6 w-full max-w-sm rounded-xl object-cover"
                />
              </div>
            </form>


          </motion.div>
        )}

        {step === "sent" && (
          <div key="sent" className="space-y-4 text-center" role="status">
            <h2 className="text-xl font-semibold">Check your email</h2>
            <p className="text-sm text-muted-foreground">If your account needs confirmation, open the link we sent to {email.trim()}.</p>
            <Button asChild variant="outline"><Link to="/login">Back to Login</Link></Button>
          </div>
        )}
      </AnimatePresence>
    </AuthShell>
  );
}
