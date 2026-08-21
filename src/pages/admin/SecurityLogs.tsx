import { useState } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { 
  ShieldAlert, Search, Download, Filter, 
  AlertTriangle, CheckCircle2, XCircle, Info,
  Shield, User, Clock, Globe
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function AdminSecurityLogs() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [eventType, setEventType] = useState("all");
  const [status, setStatus] = useState("all");

  const { data: logs, isLoading } = useQuery({
    queryKey: ["admin-security-logs", eventType, status],
    queryFn: async () => {
      // Log the view action for auditing
      await supabase.rpc('log_security_audit_access', {
        _event_type: 'security_logs_view',
        _metadata: { filter_type: eventType, filter_status: status }
      });

      let query = supabase
        .from("security_audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);


      if (eventType !== "all") {
        query = query.eq("event_type", eventType);
      }
      if (status !== "all") {
        query = query.eq("status", status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const filteredLogs = logs?.filter(log => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (log.email?.toLowerCase().includes(searchLower)) ||
      (log.event_type.toLowerCase().includes(searchLower)) ||
      (log.ip_address?.includes(searchLower))
    );
  });

  const exportLogs = () => {
    if (!filteredLogs || filteredLogs.length === 0) return;
    
    const headers = ["Timestamp", "Event Type", "Status", "Actor", "IP", "User Agent", "Metadata"];
    const rows = filteredLogs.map(log => [
      format(new Date((log as any).created_at || new Date()), "yyyy-MM-dd HH:mm:ss"),
      log.event_type,
      log.status,
      log.email || log.actor_id || "System",
      log.ip_address || "N/A",
      log.user_agent || "N/A",
      JSON.stringify(log.metadata)
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `security_audit_logs_${format(new Date(), "yyyyMMdd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({ title: "Export successful", description: "Audit logs have been exported to CSV." });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-6 w-6 text-primary" />
        </div>
        <Button variant="outline" size="sm" onClick={exportLogs} disabled={!filteredLogs?.length}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email, event, or IP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={eventType} onValueChange={setEventType}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-3.5 w-3.5 mr-2" />
                  <SelectValue placeholder="Event Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  <SelectItem value="otp_verification">OTP Verification</SelectItem>
                  <SelectItem value="otp_verification_failed">OTP Failed</SelectItem>
                  <SelectItem value="password_change">Password Change</SelectItem>
                  <SelectItem value="admin_diagnostics_access">Admin Diagnostics</SelectItem>
                  <SelectItem value="payment_verified">Payment Verified</SelectItem>
                  <SelectItem value="webhook_rejected">Webhook Rejected</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[180px]">Timestamp</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead className="w-[80px]">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      Loading audit logs...
                    </TableCell>
                  </TableRow>
                ) : filteredLogs?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      No matching logs found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs?.map((log) => (
                    <TableRow key={log.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono text-[11px] whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {format(new Date((log as any).created_at || new Date()), "MMM d, HH:mm:ss")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize text-[10px] px-1.5 py-0 h-5">
                          {log.event_type.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {log.status === "success" ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                          ) : log.status === "error" ? (
                            <XCircle className="h-3.5 w-3.5 text-destructive" />
                          ) : (
                            <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                          )}
                          <span className={cn(
                            "text-xs font-medium",
                            log.status === "success" ? "text-success" : 
                            log.status === "error" ? "text-destructive" : "text-warning"
                          )}>
                            {log.status}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-xs truncate max-w-[150px]">
                        <div className="flex items-center gap-1.5">
                          <User className="h-3 w-3 text-muted-foreground" />
                          {log.email || "System"}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Globe className="h-3 w-3" />
                          {log.ip_address || "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <Info className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-md font-mono text-[10px] p-3">
                              <div className="space-y-2">
                                <div><span className="text-primary">Event:</span> {log.event_type}</div>
                                <div><span className="text-primary">User Agent:</span> {log.user_agent || "N/A"}</div>
                                <div>
                                  <span className="text-primary">Metadata:</span>
                                  <pre className="mt-1 bg-muted p-1 rounded overflow-x-auto">
                                    {JSON.stringify(log.metadata, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
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
