import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, CheckCircle, Lock, Eye, EyeOff, Key } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SEOHead } from "@/components/SEOHead";
import { AuthShell } from "@/components/auth/AuthShell";

type Step = "email" | "otp" | "password";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-password-reset", {
        body: { action: "send-otp", email }
      });
      if (error || data?.error) throw new Error(error?.message || data?.error);
      
      toast({ title: "OTP Sent", description: "Verification code sent to your email." });
      setStep("otp");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-password-reset", {
        body: { action: "verify-otp", email, otp }
      });
      if (error || data?.error) throw new Error(error?.message || data?.error);
      
      toast({ title: "Verified", description: "Code accepted. Please set your new password." });
      setStep("password");
      setResetToken(data.resetToken);
    } catch (err: any) {
      toast({ title: "Invalid Code", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: "Mismatch", description: "Passwords do not match.", variant: "destructive" });
      return;
    }
    if (newPassword.length < 8) {
      toast({ title: "Weak Password", description: "Must be at least 8 characters.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-password-reset", {
        body: { action: "reset-password", email, password: newPassword, resetToken }
      });
      if (error || data?.error) throw new Error(error?.message || data?.error);
      
      toast({ title: "Success", description: "Password updated successfully. Redirecting..." });
      setTimeout(() => navigate("/login"), 2000);
    } catch (err: any) {
      let msg = err.message;
      if (msg.toLowerCase().includes("weak") || msg.toLowerCase().includes("choose a different one")) {
        msg = "This password is too easy to guess. Please choose a stronger password with a mix of letters, numbers, and symbols.";
      }
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell mode="login">
      <SEOHead title="Reset Password" description="Securely reset your Prasadam account password via email verification." noIndex />
      
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold text-foreground">
            {step === "email" && "Forgot Password?"}
            {step === "otp" && "Verify Email"}
            {step === "password" && "New Password"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {step === "email" && "Enter your email to receive a verification code."}
            {step === "otp" && `Enter the 6-digit code sent to ${email}`}
            {step === "password" && "Set a strong password to secure your account."}
          </p>
        </div>

        {step === "email" && (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="you@example.com" 
                  className="pl-10 h-11"
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                />
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full h-11 text-white" 
              style={{ backgroundColor: "#AD1E2A" }} 
              disabled={isLoading}
            >
              {isLoading ? "Sending Code..." : "Send Verification Code"}
            </Button>
            <Link to="/login" className="flex items-center justify-center text-sm text-muted-foreground hover:text-accent gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Login
            </Link>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code</Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="otp" 
                  type="text" 
                  placeholder="123456" 
                  maxLength={6}
                  className="pl-10 h-11 text-center tracking-widest font-mono text-lg"
                  value={otp} 
                  onChange={(e) => setOtp(e.target.value)} 
                  required 
                />
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full h-11 text-white" 
              style={{ backgroundColor: "#AD1E2A" }} 
              disabled={isLoading}
            >
              {isLoading ? "Verifying..." : "Verify OTP"}
            </Button>
            <button 
              type="button" 
              onClick={() => setStep("email")}
              className="w-full text-center text-sm text-muted-foreground hover:text-accent"
            >
              Change Email
            </button>
          </form>
        )}

        {step === "password" && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="newPassword" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Min 8 characters"
                  className="pl-10 pr-10 h-11" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  required 
                  minLength={8}
                />
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
                <Input 
                  id="confirmPassword" 
                  type="password" 
                  placeholder="Repeat new password"
                  className="pl-10 h-11" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  required 
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 text-white" 
              style={{ backgroundColor: "#AD1E2A" }} 
              disabled={isLoading}
            >
              {isLoading ? "Updating..." : "Update Password"}
            </Button>
          </form>
        )}
      </motion.div>
    </AuthShell>
  );
}
