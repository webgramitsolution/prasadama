import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Mail, History, RotateCcw, Play, CheckCircle2, AlertCircle, Eye, ShieldCheck, ArrowLeft } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

const ORDER_STATUSES = [
  { id: "new_order", label: "New Order / Confirmed" },
  { id: "order_confirmed", label: "Confirmed" },
  { id: "order_processing", label: "Processing" },
  { id: "order_shipped", label: "Shipped" },
  { id: "order_delivered", label: "Delivered" },
  { id: "order_cancelled", label: "Cancelled" },
];

export default function EmailPreview() {
  const [status, setStatus] = useState("new_order");
  const [testEmail, setTestEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [testResults, setTestResults] = useState<{
    logo: boolean;
    footer: boolean;
    orderNumber: boolean;
  } | null>(null);
  const [integrationResults, setIntegrationResults] = useState<any[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  const fetchLogs = async () => {
    const { data } = await supabase
      .from("email_logs")
      .select("*")
      .order("sent_at", { ascending: false })
      .limit(20);
    setLogs(data || []);
  };

  const fetchPreview = async () => {
    setIsPreviewLoading(true);
    try {
      
      const { data, error } = await supabase.functions.invoke("send-order-notification", {
          body: {
            type: status,
            order_id: "00000000-0000-0000-0000-000000000000",
            preview_only: true
          },
      });

      if (error) throw error;
      
      setPreviewHtml(data.html || (data.success ? "<div class='p-8 text-center'>Email triggered successfully. Check logs.</div>" : ""));
      
      const html = data.html || "";
      if (html) {
        setTestResults({
          logo: html.includes('https://ik.imagekit.io/houskaseseepika/home%20(1)%20(1).png'),
          footer: html.includes('#ad1e2a'),
          orderNumber: status.includes('order') ? html.includes('Order Number:') : true
        });
      }
    } catch (err) {
      console.error("Preview error:", err);
      setPreviewHtml("<div class='p-8 text-center text-red-500'>Failed to load preview. Please ensure the Edge Function is deployed.</div>");
    } finally {
      setIsPreviewLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchPreview();
  }, [status]);

  const handleSendTest = async (specificStatus?: string) => {
    const targetStatus = specificStatus || status;
    if (!testEmail) {
      toast.error("Please enter a test email address");
      return;
    }

    setIsLoading(true);
    try {
      const { data: orders } = await supabase.from('orders').select('id').limit(1);
      const orderId = orders?.[0]?.id;

      if (!orderId) {
        toast.error("No real orders found to use for test email data");
        return;
      }

      const { data, error } = await supabase.functions.invoke("send-order-notification", {
        body: {
          type: targetStatus,
          order_id: orderId,
          to_override: testEmail
        },
      });

      if (error) throw error;
      toast.success(`Test email for ${targetStatus} sent!`);
      fetchLogs();
    } catch (err) {
      console.error("Test email error:", err);
      toast.error(`Failed to send ${targetStatus} email`);
    } finally {
      setIsLoading(false);
    }
  };

  const runIntegrationTests = async () => {
    setIsTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("test-email-templates", {
        body: { type: "all" },
      });
      if (error) throw error;
      setIntegrationResults(data.results || []);
      toast.success("Integration tests completed");
    } catch (err) {
      console.error("Test error:", err);
      toast.error("Failed to run integration tests");
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/admin/chat">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-[#001B3D]">Email Template Preview</h1>
            <p className="text-muted-foreground text-sm">Internal tool for verifying branding and delivery logs.</p>
          </div>
        </div>
        <div className="flex gap-2">
           <Button 
             variant="outline" 
             size="sm" 
             onClick={runIntegrationTests} 
             disabled={isTesting}
             className="gap-2"
           >
             {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4 text-shop" />}
             Run Health Check
           </Button>
           {testResults && (
             <div className="flex gap-2 mr-4">
               <Badge variant={testResults.logo ? "outline" : "destructive"} className="gap-1 bg-white">
                 {testResults.logo ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <AlertCircle className="w-3 h-3" />}
                 Logo
               </Badge>
               <Badge variant={testResults.footer ? "outline" : "destructive"} className="gap-1 bg-white">
                 {testResults.footer ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <AlertCircle className="w-3 h-3" />}
                 Footer
               </Badge>
             </div>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Preview Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-muted-foreground">Notification Type</label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_STATUSES.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4 border-t space-y-4">
                <label className="text-xs font-semibold uppercase text-muted-foreground">Quick Test Delivery</label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="admin@houskase.com" 
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={() => handleSendTest()} disabled={isLoading} size="sm" className="bg-[#ad1e2a] hover:bg-[#ad1e2a]/90">
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Recent Email Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {logs.length === 0 ? (
                  <div className="text-center py-4 text-xs text-muted-foreground italic">
                    No recent delivery logs found.
                  </div>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="flex items-start justify-between text-xs border-b pb-2 last:border-0">
                      <div className="space-y-1">
                        <div className="font-medium capitalize">{log.notification_type.replace(/_/g, ' ')}</div>
                        <div className="text-muted-foreground">{log.recipient_email}</div>
                        <div className="text-[10px] text-muted-foreground/60">{format(new Date(log.sent_at), "MMM d, HH:mm")}</div>
                      </div>
                      <div className="text-right">
                        <Badge variant={log.status === 'sent' ? 'secondary' : 'destructive'} className="text-[10px] h-5 px-1.5">
                          {log.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {integrationResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-shop" /> Health Check Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {integrationResults.map((res, i) => (
                    <div key={i} className="flex items-center justify-between text-xs border-b pb-2 last:border-0">
                      <span className="capitalize">{res.name.replace(/-/g, ' ')}</span>
                      <Badge variant={res.ok ? "secondary" : "destructive"} className="text-[10px] h-5 px-1.5">
                        {res.ok ? "Healthy" : "Failed"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2">
          <Card className="h-full min-h-[600px] flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between border-b py-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-[#001B3D]">
                <Eye className="w-4 h-4" /> Live Branded Template
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={fetchPreview}>
                <RotateCcw className="w-3 h-3 mr-1" /> Refresh
              </Button>
            </CardHeader>
            <CardContent className="flex-1 p-0 bg-slate-100 overflow-hidden">
              {isPreviewLoading ? (
                <div className="h-full flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Rendering branded template...</p>
                </div>
              ) : (
                <iframe 
                  srcDoc={previewHtml} 
                  className="w-full h-full min-h-[600px] border-0"
                  title="Email Preview"
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
