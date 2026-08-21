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
import { format } from "date-fns";
import { Mail, AlertCircle, CheckCircle2, Clock, Search, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export default function AdminOtpLogs() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: logs, isLoading } = useQuery({
    queryKey: ["admin-otp-logs"],
    queryFn: async () => {
      // @ts-ignore - Table may not exist in all environments yet
      const { data, error } = await supabase
        .from("signup_otp_events" as any)
        .select("id, created_at, email, correlation_id, full_name, expires_at")
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;
      return (data || []) as any[];
    },
  });

  const filteredLogs = (logs || []).filter(log => {
    const metadata = (log as any).metadata as Record<string, any> | null;
    return (log as any).email.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (metadata?.['correlationId'] as string)?.includes(searchTerm);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Mail className="h-6 w-6" />
          OTP Delivery Logs
        </h1>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email or correlation ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[180px]">Timestamp</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead className="w-[100px]">ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Loading logs...
                    </TableCell>
                  </TableRow>
                ) : filteredLogs?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No logs found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => {
                    const metadata = (log as any).metadata as Record<string, any> | null;
                    return (
                      <TableRow key={(log as any).id} className="hover:bg-muted/30">
                        <TableCell className="font-mono text-[11px] whitespace-nowrap">
                          {format(new Date((log as any).created_at), "MMM d, HH:mm:ss")}
                        </TableCell>
                        <TableCell className="font-medium text-xs truncate max-w-[200px]">
                          {(log as any).email}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize text-[10px] px-1.5 py-0 h-5">
                            {(log as any).event_type.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {(log as any).status === "success" ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                            ) : (log as any).status === "error" ? (
                              <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                            ) : (
                              <Clock className="h-3.5 w-3.5 text-warning" />
                            )}
                             <span className={cn(
                              "text-xs font-medium",
                              (log as any).status === "success" ? "text-success" : 
                              (log as any).status === "error" ? "text-destructive" : "text-warning"
                            )}>
                              {(log as any).status}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[300px]">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs text-foreground line-clamp-1">
                              {(log as any).error_message || (metadata?.['providerResponse'] as string) || "OK"}
                            </span>
                            {metadata?.['provider'] && (
                              <span className="text-[10px] text-muted-foreground">
                                Provider: {metadata['provider'] as string}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                  <Info className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs font-mono text-[10px]">
                                CID: {metadata?.['correlationId'] as string || "N/A"}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
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
    </div>
  );
}

