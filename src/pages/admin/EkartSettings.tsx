import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Loader2, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function EkartSettings() {
  const [testing, setTesting] = useState(false);
  const [runningTest, setRunningTest] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [testTracking, setTestTracking] = useState("");
  const { toast } = useToast();

  const trackUrl = "https://app.elite.ekartlogistics.in/track/";

  const runVerify = async () => {
    setTesting(true);
    setResult(null);
    const { data, error } = await supabase.functions.invoke("ekart-verify-credentials", { body: {} });
    setTesting(false);
    if (error) {
      toast({ title: "Verify failed", description: error.message, variant: "destructive" });
      setResult({ ok: false, error: error.message });
    } else {
      setResult(data);
    }
  };

  const testTrack = async () => {
    if (!testTracking.trim()) return;
    const { data, error } = await supabase.functions.invoke("ekart-track", { body: { tracking_id: testTracking.trim() } });
    if (error) toast({ title: "Track failed", description: error.message, variant: "destructive" });
    else toast({ title: "Track result", description: JSON.stringify((data as any)?.current || data).slice(0, 200) });
  };

  const copy = (v: string) => { navigator.clipboard.writeText(v); toast({ title: "Copied" }); };

  const generateTestShipment = async () => {
    setRunningTest(true);
    const { data, error } = await supabase.functions.invoke("ekart-create-shipment", {
      body: { is_test: true }
    });
    setRunningTest(false);
    
    if (error) {
      toast({ title: "Test shipment failed", description: error.message, variant: "destructive" });
    } else if ((data as any)?.error) {
      toast({ title: "Test shipment failed", description: (data as any).error, variant: "destructive" });
    } else {
      toast({ 
        title: "Test shipment created!", 
        description: `Tracking ID: ${(data as any).tracking_id}. It should appear in your Ekart panel shortly.` 
      });
    }
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <p className="text-sm text-muted-foreground">Configure Ekart credentials and verify the connection.</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Backend Credentials Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p className="text-muted-foreground">
            Ekart credentials (Client ID, Username, and Password) are stored securely as backend secrets. 
            They are never displayed in the browser.
          </p>
          
          <div className="flex flex-wrap gap-3">
            <Button onClick={runVerify} disabled={testing} variant="outline">
              {testing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Verify Stored Secrets
            </Button>
            
            <Button 
              variant="default" 
              onClick={async () => {
                // Request update via platform secrets tool
                const { error } = await supabase.functions.invoke("ekart-verify-credentials", { 
                  body: { action: "request_update" } 
                });
                
                if (error && error.status !== 200) {
                  toast({ title: "Verification failed", description: error.message, variant: "destructive" });
                  return;
                }

                toast({ 
                  title: "Updating credentials...", 
                  description: "Verification will run automatically once secrets are saved." 
                });

                // The platform tool updates the environment. 
                // We'll wait a brief moment for the isolate to refresh then auto-verify.
                setTimeout(() => runVerify(), 5000);
              }}
            >
              Update Credentials
            </Button>
          </div>

          {result && (
            <div className="mt-3 p-3 rounded-lg bg-muted/50 border space-y-2">
              <div className="flex items-center gap-2">
                {result.ok ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-destructive" />
                )}
                <span className="font-semibold">
                  {result.ok ? "Credentials verified successfully" : "Verification failed"}
                </span>
                {result.status_code && (
                  <Badge variant="outline" className="ml-auto">HTTP {result.status_code}</Badge>
                )}
              </div>
              {!result.ok && result.error && (
                <p className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                  {result.error}
                </p>
              )}
              {result.ok && (
                <p className="text-xs text-green-600">
                  The backend successfully authenticated with Ekart using your stored secrets.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Ekart Test Mode</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p className="text-muted-foreground">
            Generate a sample shipment with dummy data to verify it appears in your Ekart panel. 
            This does not affect real orders.
          </p>
          <Button 
            variant="outline" 
            onClick={generateTestShipment} 
            disabled={runningTest}
            className="w-full sm:w-auto"
          >
            {runningTest ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Generate Sample Shipment
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Public tracking link</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-muted-foreground">Every created shipment can be tracked publicly at this prefix + tracking id.</p>
          <div className="flex gap-2">
            <Input value={trackUrl} readOnly className="font-mono text-xs" />
            <Button variant="outline" size="icon" onClick={() => copy(trackUrl)}><Copy className="h-4 w-4" /></Button>
          </div>
        </CardContent>
      </Card>


      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Quick tracking test</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="tt" className="text-xs">Tracking ID</Label>
          <div className="flex gap-2">
            <Input id="tt" value={testTracking} onChange={(e) => setTestTracking(e.target.value)} placeholder="Enter an Ekart tracking id" />
            <Button onClick={testTrack} disabled={!testTracking.trim()}>Track</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
