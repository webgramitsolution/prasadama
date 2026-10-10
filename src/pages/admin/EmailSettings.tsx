import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { AlertTriangle, CheckCircle2, Loader2, Mail, PlugZap, RefreshCw, Search, ShieldCheck } from "lucide-react";

type SmtpSettings = {
  host: string | null;
  port: number;
  secure: boolean;
  user: string | null;
  passSet: boolean;
  passMasked: string | null;
  hostSet: boolean;
  userSet: boolean;
  bridgeConfigured: boolean;
  testEmailAvailable: boolean;
};

type TestStep = { step: string; ok: boolean; detail: string };

type TestResult = {
  settings?: SmtpSettings;
  success?: boolean;
  error?: string | null;
  durationMs?: number;
  steps?: TestStep[];
  testEmailSent?: boolean;
};

type EmailLog = {
  id: string;
  created_at: string;
  email_type: string;
  recipient: string;
  subject: string | null;
  status: string;
  smtp_host: string | null;
  smtp_port: number | null;
  error_message: string | null;
  correlation_id: string | null;
};

const TYPE_GROUPS: Record<string, string[]> = {
  all: [],
  signup: ["signup_otp"],
  password: ["password_reset_otp"],
  order: ["new_order", "order_confirmation", "status_update", "shipped", "delivered", "cancelled"],
  test: ["smtp_test"],
};

export default function AdminEmailSettings() {
  const { toast } = useToast();
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState<keyof typeof TYPE_GROUPS>("all");

  const { data: settings, isLoading: loadingSettings, refetch: refetchSettings } = useQuery({
    queryKey: ["smtp-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("smtp-diagnostics", {
        body: { action: "status" },
      });
      if (error) throw error;
      return (data as { settings: SmtpSettings }).settings;
    },
  });

  const {
    data: logs,
    isLoading: loadingLogs,
    refetch: refetchLogs,
  } = useQuery({
    queryKey: ["email-delivery-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_delivery_logs" as any)
        .select("id, created_at, email_type, recipient, subject, status, smtp_host, smtp_port, error_message, correlation_id")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data || []) as unknown as EmailLog[];
    },
  });

  const runTest = async (withEmail: boolean) => {
    setTesting(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("smtp-diagnostics", {
        body: { action: "test", sendTestEmail: withEmail },
      });
      if (error) throw error;
      const payload = data as TestResult;
      setResult(payload);
      toast({
        title: payload.success ? "SMTP connection OK" : "SMTP test failed",
        description: payload.success
          ? withEmail
            ? "Test email sent to your verified account email."
            : "Connected and authenticated successfully."
          : payload.error || "Check the step details below.",
        variant: payload.success ? "default" : "destructive",
      });
      refetchLogs();
    } catch (err: any) {
      setResult({ success: false, error: err?.message || "Test failed" });
      toast({ title: "SMTP test failed", description: err?.message || "Test failed", variant: "destructive" });
    } finally {
      setTesting(false);
    }
  };

  const filteredLogs = (logs || []).filter((log) => {
    const types = TYPE_GROUPS[group] ?? [];
    const matchesGroup = types.length === 0 || types.includes(log.email_type);
    const term = search.trim().toLowerCase();
    const matchesSearch =
      !term ||
      log.recipient.toLowerCase().includes(term) ||
      (log.subject || "").toLowerCase().includes(term) ||
      (log.correlation_id || "").toLowerCase().includes(term);
    return matchesGroup && matchesSearch;
  });

  const statusBadge = (status: string) => {
    if (status === "sent") return <Badge className="bg-success text-success-foreground">Sent</Badge>;
    if (status === "failed") return <Badge variant="destructive">Failed</Badge>;
    return <Badge variant="secondary">{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="h-6 w-6" /> Email &amp; SMTP
          </h1>
          <p className="text-sm text-muted-foreground">
            Verify your mail server before sending OTPs, and track every email that leaves the store.
          </p>
        </div>
        <Button variant="outline" onClick={() => { refetchSettings(); refetchLogs(); }}>
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" /> SMTP settings
          </CardTitle>
          <CardDescription>
            Values are stored as backend secrets and shown masked — passwords are never sent to the browser.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {loadingSettings ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading settings…
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>SMTP host</Label>
                <Input readOnly value={settings?.host || "Not set"} />
              </div>
              <div className="space-y-1">
                <Label>Port</Label>
                <Input readOnly value={`${settings?.port ?? 465}${settings?.secure ? " (SSL/TLS)" : " (plain)"}`} />
              </div>
              <div className="space-y-1">
                <Label>SMTP user / from address</Label>
                <Input readOnly value={settings?.user || "Not set"} />
              </div>
              <div className="space-y-1">
                <Label>SMTP password</Label>
                <Input readOnly type="password" value={settings?.passMasked || ""} placeholder="Not set" />
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant={settings?.hostSet ? "default" : "destructive"}>SMTP_HOST {settings?.hostSet ? "set" : "missing"}</Badge>
            <Badge variant={settings?.userSet ? "default" : "destructive"}>SMTP_USER {settings?.userSet ? "set" : "missing"}</Badge>
            <Badge variant={settings?.passSet ? "default" : "destructive"}>SMTP_PASS {settings?.passSet ? "set" : "missing"}</Badge>
            <Badge variant="secondary">Port {settings?.port ?? 465}</Badge>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Changing these values</AlertTitle>
            <AlertDescription className="text-sm">
              Host, user and password are secrets — ask in chat to update them, they cannot be edited from the browser.
              The port defaults to 465 (implicit SSL); set an <code>SMTP_PORT</code> secret only if your provider uses a different port.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlugZap className="h-5 w-5" /> Connection test
          </CardTitle>
          <CardDescription>Connect, authenticate, and optionally deliver a real test email.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1">
              <Label>Test email recipient</Label>
              <p className="text-sm text-muted-foreground">Your verified account email</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" disabled={testing} onClick={() => runTest(false)}>
                {testing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlugZap className="mr-2 h-4 w-4" />}
                Test connection
              </Button>
              <Button disabled={testing || !settings?.testEmailAvailable} onClick={() => runTest(true)}>
                {testing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                Send test email
              </Button>
            </div>
          </div>

          {result && (
            <div className="space-y-3">
              <Alert variant={result.success ? "default" : "destructive"}>
                {result.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                <AlertTitle>{result.success ? "SMTP is working" : "SMTP test failed"}</AlertTitle>
                <AlertDescription className="text-sm">
                  {result.success
                    ? `Completed in ${result.durationMs ?? 0} ms${result.testEmailSent ? " — test email delivered." : "."}`
                    : result.error}
                </AlertDescription>
              </Alert>

              {result.steps?.length ? (
                <div className="rounded-md border divide-y">
                  {result.steps.map((s, i) => (
                    <div key={i} className="flex items-start gap-2 p-3 text-sm">
                      {s.ok ? (
                        <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="font-medium">{s.step}</p>
                        <p className="text-xs text-muted-foreground break-words font-mono">{s.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email delivery log</CardTitle>
          <CardDescription>Signup OTP, password reset, order emails and SMTP tests.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search recipient, subject or reference ID…"
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Tabs value={group} onValueChange={(v) => setGroup(v as keyof typeof TYPE_GROUPS)}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="signup">Signup</TabsTrigger>
                <TabsTrigger value="password">Reset</TabsTrigger>
                <TabsTrigger value="order">Orders</TabsTrigger>
                <TabsTrigger value="test">Tests</TabsTrigger>
              </TabsList>
              <TabsContent value={group} />
            </Tabs>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[170px]">Time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Server</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingLogs ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Loading…
                    </TableCell>
                  </TableRow>
                ) : filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No email activity yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {format(new Date(log.created_at), "dd MMM yyyy, HH:mm")}
                      </TableCell>
                      <TableCell className="text-sm">{log.email_type.replace(/_/g, " ")}</TableCell>
                      <TableCell className="text-sm">{log.recipient}</TableCell>
                      <TableCell>{statusBadge(log.status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {log.smtp_host ? `${log.smtp_host}:${log.smtp_port ?? 465}` : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-destructive max-w-[280px] break-words">
                        {log.error_message || "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
