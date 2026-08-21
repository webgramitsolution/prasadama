import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Phone, MessageSquare, AlertCircle, CheckCircle2 } from "lucide-react";

export default function SmsLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("sms_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (!error) setLogs(data || []);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="h-6 w-6" />
          SMS Delivery Logs
        </h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Response/Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">Loading logs...</TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No SMS logs found.</TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap">
                      {log.created_at ? format(new Date(log.created_at), "MMM d, HH:mm:ss") : "N/A"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        {log.phone_number || "N/A"}
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{log.notification_type?.replace('_', ' ') || "N/A"}</TableCell>
                    <TableCell>
                      {log.status === 'sent' ? (
                        <Badge className="bg-success/10 text-success hover:bg-success/20 border-success/20 gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Sent
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="gap-1">
                          <AlertCircle className="h-3 w-3" /> {log.status || 'Failed'}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-md">
                      <div className="text-xs font-mono break-all line-clamp-2" title={log.error_details || log.provider_response}>
                        {log.error_details || log.provider_response || "N/A"}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
