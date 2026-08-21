import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, RefreshCw, Send, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface LogRow {
  id: string;
  order_id: string | null;
  event_type: string | null;
  payload: unknown;
  response: unknown;
  status: string | null;
  created_at: string;
}

const isSuccess = (status: string | null) =>
  !!status && ["success", "ok", "synced", "200", "201"].includes(status.toLowerCase());

const errorFrom = (row: LogRow): string | null => {
  const response = row.response as Record<string, unknown> | null;
  if (!response || typeof response !== "object") return null;
  const candidate =
    response["error"] ?? response["message"] ?? response["error_message"] ?? response["reason"];
  if (typeof candidate === "string") return candidate;
  return isSuccess(row.status) ? null : JSON.stringify(response).slice(0, 300);
};

export default function EkartLogs() {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [selected, setSelected] = useState<LogRow | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const { toast } = useToast();
  const silent = useRef(false);

  const load = useCallback(async () => {
    if (!silent.current) setLoading(true);
    const { data, error } = await supabase
      .from("ekart_integration_logs" as never)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error && !silent.current) {
      toast({ title: "Failed to load logs", description: error.message, variant: "destructive" });
    }
    setLogs(((data as unknown as LogRow[]) || []));
    setLastRefreshed(new Date());
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  // Auto-refresh every 15s so sync status stays current while an admin watches it.
  useEffect(() => {
    if (!autoRefresh) return;
    const timer = window.setInterval(() => {
      silent.current = true;
      load().finally(() => {
        silent.current = false;
      });
    }, 15000);
    return () => window.clearInterval(timer);
  }, [autoRefresh, load]);

  const stats = useMemo(() => {
    const lastSuccess = logs.find((l) => isSuccess(l.status));
    const lastFailure = logs.find((l) => !isSuccess(l.status));
    return {
      lastSync: logs[0] ?? null,
      lastSuccess,
      lastFailure,
      failures: logs.filter((l) => !isSuccess(l.status)).length,
    };
  }, [logs]);

  const retrySync = async (orderId: string) => {
    setSyncing(orderId);
    const { data, error } = await supabase.functions.invoke("ekart-create-shipment", {
      body: { order_id: orderId },
    });
    setSyncing(null);
    const failure = error?.message || (data as { error?: string } | null)?.error;
    if (failure) {
      toast({ title: "Sync failed", description: failure, variant: "destructive" });
    } else {
      toast({
        title: "Shipment created",
        description: `Tracking: ${(data as { tracking_id?: string } | null)?.tracking_id || "n/a"}`,
      });
    }
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Every Ekart API request, response, and sync state per order.
        </p>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch id="ekart-auto" checked={autoRefresh} onCheckedChange={setAutoRefresh} />
            <Label htmlFor="ekart-auto" className="text-xs text-muted-foreground">Auto-refresh</Label>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Last sync attempt</CardTitle></CardHeader>
          <CardContent className="text-sm font-medium">
            {stats.lastSync ? new Date(stats.lastSync.created_at).toLocaleString("en-IN") : "No activity yet"}
            {stats.lastSync && (
              <div className="mt-1">
                <Badge variant={isSuccess(stats.lastSync.status) ? "default" : "destructive"}>
                  {stats.lastSync.status || "unknown"}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Last successful sync</CardTitle></CardHeader>
          <CardContent className="text-sm font-medium">
            {stats.lastSuccess ? new Date(stats.lastSuccess.created_at).toLocaleString("en-IN") : "—"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Failures (last 200)</CardTitle></CardHeader>
          <CardContent className="text-sm font-medium text-destructive">{stats.failures}</CardContent>
        </Card>
      </div>

      {stats.lastFailure && (
        <Card className="border-destructive/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" /> Latest sync error
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-1">
            <div>{new Date(stats.lastFailure.created_at).toLocaleString("en-IN")} — {stats.lastFailure.event_type || "sync"}</div>
            <div className="text-muted-foreground break-words">{errorFrom(stats.lastFailure) || "No error details returned by Ekart."}</div>
            {stats.lastFailure.order_id && (
              <Button
                size="sm"
                className="mt-2"
                onClick={() => retrySync(stats.lastFailure!.order_id!)}
                disabled={syncing === stats.lastFailure.order_id}
              >
                {syncing === stats.lastFailure.order_id ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                ) : (
                  <Send className="h-3 w-3 mr-1.5" />
                )}
                Retry this order
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm">Recent activity (last 200)</CardTitle>
          <span className="text-[11px] text-muted-foreground">
            {lastRefreshed ? `Refreshed ${lastRefreshed.toLocaleTimeString("en-IN")}` : ""}
          </span>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : logs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No Ekart activity yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-left border-b">
                  <tr>
                    <th className="py-2 pr-3">Time</th>
                    <th className="py-2 pr-3">Order</th>
                    <th className="py-2 pr-3">Event</th>
                    <th className="py-2 pr-3">Result</th>
                    <th className="py-2 pr-3">Details</th>
                    <th className="py-2 pr-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((l) => {
                    const ok = isSuccess(l.status);
                    return (
                      <tr key={l.id} className="border-b hover:bg-muted/40">
                        <td className="py-2 pr-3 whitespace-nowrap">{new Date(l.created_at).toLocaleString("en-IN")}</td>
                        <td className="py-2 pr-3 font-mono">{l.order_id?.slice(0, 8) || "—"}</td>
                        <td className="py-2 pr-3">{l.event_type || "—"}</td>
                        <td className="py-2 pr-3">
                          <Badge variant={ok ? "default" : "destructive"}>{ok ? "OK" : "FAIL"}</Badge>
                        </td>
                        <td className="py-2 pr-3">
                          <div className="max-w-[280px] truncate text-muted-foreground">
                            {errorFrom(l) || (ok ? "Synced" : "—")}
                          </div>
                        </td>
                        <td className="py-2 pr-3">
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" onClick={() => setSelected(l)}>View</Button>
                            {l.order_id && !ok && (
                              <Button size="sm" onClick={() => retrySync(l.order_id!)} disabled={syncing === l.order_id}>
                                {syncing === l.order_id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Log detail — {selected?.event_type || "sync"}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-3 text-xs">
              <div><span className="font-semibold">Order:</span> {selected.order_id || "—"}</div>
              <div><span className="font-semibold">Status:</span> {selected.status || "—"}</div>
              <div>
                <div className="font-semibold mb-1">Request</div>
                <pre className="bg-muted p-2 rounded overflow-auto max-h-60">{JSON.stringify(selected.payload, null, 2)}</pre>
              </div>
              <div>
                <div className="font-semibold mb-1">Response</div>
                <pre className="bg-muted p-2 rounded overflow-auto max-h-60">{JSON.stringify(selected.response, null, 2)}</pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
