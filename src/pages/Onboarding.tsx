import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Phone, MapPin, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SEOHead } from "@/components/SEOHead";
import { AuthShell } from "@/components/auth/AuthShell";

export default function Onboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [city, setCity] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          phone: phoneNumber,
          city: city,
          onboarding_completed: true,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Profile Updated!",
        description: "Welcome to Prasadam. Your profile is ready.",
      });

      // Check if admin to route correctly
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      
      const isAdmin = roles?.some(r => r.role === 'admin');
      navigate(isAdmin ? "/admin" : "/dashboard");
    } catch (err: any) {
      toast({
        title: "Update Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell mode="signup">
      <SEOHead title="Complete Your Profile" description="Just a few more details to get you started with Prasadam." />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="border-none shadow-none bg-transparent">
          <CardHeader className="text-center px-0">
            <div className="mx-auto w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-6 w-6 text-accent" />
            </div>
            <CardTitle className="text-2xl">Account Verified!</CardTitle>
            <CardDescription className="text-base">
              Welcome to the family. Let's complete your profile.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    placeholder="John Doe"
                    className="pl-10 h-11"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    className="pl-10 h-11"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="city"
                    placeholder="New Delhi"
                    className="pl-10 h-11"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-white hover:opacity-90 mt-2"
                style={{ backgroundColor: "hsl(var(--accent))" }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Complete Onboarding"
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center px-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="text-muted-foreground"
            >
              Skip for now
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </AuthShell>
  );
}
