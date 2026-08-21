import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format, formatDistanceToNow } from "date-fns";
import {
  Webhook,
  Search,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Send,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface WebhookEvent {
  id: string;
  created_at: string | null;
  event_type: string | null;
  status: string | null;
  payload: unknown;
  response_body: string | null;
}

type StatusFilter = "all" | "success" | "failed";

const isFailure = (status: string | null) =>
  !!status && !["success", "ok", "delivered", "200"].includes(status.toLowerCase());

export default function AdminWebhookLogs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selected, setSelected] = useState<WebhookEvent | null>(null);
  const [retrying, setRetrying] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: logs, isLoading, isFetching, refetch, dataUpdatedAt } = useQuery({
    queryKey: ["admin-webhook-logs"],
    // Auto-refresh so failures and retries show up without reloading the page.
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
    queryFn: async (): Promise<WebhookEvent[]> => {
      const { data, error } = await supabase
        .from("webhook_events" as never)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;
      return (data as unknown as WebhookEvent[]) || [];
    },
  });

  const rows = useMemo(() => logs || [], [logs]);

  const filteredLogs = rows.filter((log) => {
    const term = searchTerm.trim().toLowerCase();
    const matchesTerm =
      !term ||
      JSON.stringify(log.payload ?? "").toLowerCase().includes(term) ||
      (log.event_type || "").toLowerCase().includes(term) ||
      (log.response_body || "").toLowerCase().includes(term);
    const failed = isFailure(log.status);
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "failed" ? failed : !failed);
    return matchesTerm && matchesStatus;
  });

  const failedCount = rows.filter((l) => isFailure(l.status)).length;

  const retry = async (log: WebhookEvent) => {
    const payload = (log.payload as Record<string, unknown>) || {};
    const orderId = (payload["order_id"] ?? payload["orderId"]) as string | undefined;
    if (!orderId) {
      toast({
        title: "Cannot retry",
        description: "This event has no order reference to replay.",
        variant: "destructive",
      });
      return;
    }
    setRetrying(log.id);
    const { data, error } = await supabase.functions.invoke("ekart-create-shipment", {
      body: { order_id: orderId },
    });
    setRetrying(null);
    const fnError = error?.message || (data as { error?: string } | null)?.error;
    if (fnError) {
      toast({ title: "Retry failed", description: fnError, variant: "destructive" });
    } else {
      toast({ title: "Retry sent", description: `Replayed webhook for order ${orderId}.` });
    }
    refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Webhook className="h-6 w-6" />
          Webhook Delivery Logs
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {dataUpdatedAt
              ? `Updated ${formatDistanceToNow(new Date(dataUpdatedAt), { addSuffix: true })}`
              : "—"}
          </span>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", isFetching && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Events (last 200)</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{rows.length}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Failures</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold text-destructive">{failedCount}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Last event</CardTitle></CardHeader>
          <CardContent className="text-sm font-medium">
            {rows[0]?.created_at ? format(new Date(rows[0].created_at), "MMM d, HH:mm:ss") : "—"}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search payloads, event types or responses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-1.5">
              {(["all", "failed", "success"] as StatusFilter[]).map((f) => (
                <Button
                  key={f}
                  size="sm"
                  variant={statusFilter === f ? "default" : "outline"}
                  onClick={() => setStatusFilter(f)}
                  className="capitalize"
                >
                  {f}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Response</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow>
                ) : filteredLogs.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8">No logs found.</TableCell></TableRow>
                ) : (
                  filteredLogs.map((log) => {
                    const failed = isFailure(log.status);
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs font-mono whitespace-nowrap">
                          {log.created_at ? format(new Date(log.created_at), "MMM d, HH:mm:ss") : "-"}
                        </TableCell>
                        <TableCell><Badge variant="outline">{log.event_type || "unknown"}</Badge></TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {failed ? (
                              <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                            )}
                            <span className={cn("text-xs font-medium", failed ? "text-destructive" : "text-success")}>
                              {log.status || "success"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs truncate max-w-[300px]">
                          {log.response_body || "OK"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1.5">
                            <Button size="sm" variant="outline" onClick={() => setSelected(log)}>View</Button>
                            {failed && (
                              <Button size="sm" onClick={() => retry(log)} disabled={retrying === log.id}>
                                {retrying === log.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Send className="h-3 w-3" />
                                )}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Webhook event — {selected?.event_type || "unknown"}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-xs">
              <div><span className="font-semibold">Received:</span> {selected.created_at ? format(new Date(selected.created_at), "PPpp") : "—"}</div>
              <div><span className="font-semibold">Status:</span> {selected.status || "success"}</div>
              <div>
                <div className="font-semibold mb-1">Payload</div>
                <pre className="bg-muted p-2 rounded overflow-auto max-h-60">{JSON.stringify(selected.payload, null, 2)}</pre>
              </div>
              <div>
                <div className="font-semibold mb-1">Response</div>
                <pre className="bg-muted p-2 rounded overflow-auto max-h-60 whitespace-pre-wrap">{selected.response_body || "OK"}</pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
