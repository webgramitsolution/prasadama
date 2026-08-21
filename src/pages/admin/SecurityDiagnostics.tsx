import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle2, XCircle, Loader2, Database, Key, Lock, FileText, History, User, Clock } from "lucide-react";
import { format } from "date-fns";

export default function SecurityDiagnostics() {
  const { data: authStatus, isLoading: authLoading } = useQuery({
    queryKey: ["security-auth-check"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { authenticated: false };
      
      const { data: roles } = await supabase.rpc("is_admin" as any);
      
      // Log diagnostics access using public RPC
      await supabase.rpc("log_security_audit_access" as any, {
        _event_type: "admin_diagnostics_access",
        _status: "success",
        _metadata: { path: window.location.pathname }
      });


      return { 
        authenticated: true, 
        isAdmin: roles,
        userId: user.id,
        email: user.email 
      };
    }
  });

  const { data: rlsChecks, isLoading: rlsLoading } = useQuery({
    queryKey: ["security-rls-check"],
    queryFn: async () => {
      const tables = ["products", "orders", "profiles", "user_roles"];
      const results = await Promise.all(tables.map(async (table) => {
        try {
          const { error } = await (supabase.from(table as any) as any).select("id").limit(1);
          return { table, success: !error, error: error?.message };
        } catch (e) {
          return { table, success: false, error: "Network Error" };
        }
      }));
      return results;
    }
  });

  const { data: storageCheck, isLoading: storageLoading } = useQuery({
    queryKey: ["security-storage-check"],
    queryFn: async () => {
      const { data, error } = await (supabase.storage as any).getBucket("product-images");
      return { success: !error, error: error?.message };
    }
  });

  const { data: uploadLogs, isLoading: logsLoading } = useQuery({
    queryKey: ["security-upload-logs"],
    queryFn: async () => {
      const { data, error } = await (supabase.from("storage_upload_logs" as any) as any)
        .select(`
          *,
          profile:profiles!admin_id(full_name, email)
        `)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    }
  });

  const isLoading = authLoading || rlsLoading || storageLoading || logsLoading;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6 text-primary" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Auth Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" /> Authentication
            </CardTitle>
            <CardDescription>Current session verification</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {authLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <span>Authenticated</span>
                  <Badge variant={authStatus?.authenticated ? "default" : "destructive"}>
                    {authStatus?.authenticated ? "YES" : "NO"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Admin Role</span>
                  <Badge variant={authStatus?.isAdmin ? "default" : "destructive"}>
                    {authStatus?.isAdmin ? "YES" : "NO"}
                  </Badge>
                </div>
                {authStatus?.email && (
                  <div className="text-xs text-muted-foreground mt-2">
                    Logged in as: {authStatus.email}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Storage Access */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" /> Storage (Bucket)
            </CardTitle>
            <CardDescription>Image bucket reachability</CardDescription>
          </CardHeader>
          <CardContent>
            {storageLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span>'product-images'</span>
                  {storageCheck?.success ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
                {!storageCheck?.success && (
                  <p className="text-xs text-red-500 bg-red-50 p-2 rounded">
                    {storageCheck?.error}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* RLS Checks */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" /> Table Access (RLS)
            </CardTitle>
            <CardDescription>Direct table read permissions for current user</CardDescription>
          </CardHeader>
          <CardContent>
            {rlsLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {rlsChecks?.map((check) => (
                  <div key={check.table} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="font-mono text-sm">{check.table}</span>
                    <div className="flex items-center gap-2">
                      {check.success ? (
                        <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Accessible</Badge>
                      ) : (
                        <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">Locked/Error</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upload Logs */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" /> Storage Upload Logs
              </CardTitle>
              <CardDescription>Tracing recent product/category/banner upload attempts</CardDescription>
            </div>
            <Badge variant="outline">{uploadLogs?.length || 0} Recent Logs</Badge>
          </CardHeader>
          <CardContent>
            {logsLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : !uploadLogs || uploadLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p>No upload logs found yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {uploadLogs.map((log: any) => (
                  <div key={log.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={log.status === "success" ? "default" : "destructive"} className="text-[10px] h-5">
                          {log.status.toUpperCase()}
                        </Badge>
                        <span className="font-medium text-sm truncate max-w-[200px]">{log.file_name}</span>
                        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">
                          {log.bucket_id}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {format(new Date(log.created_at), "MMM d, HH:mm:ss")}
                        </span>
                        {log.profile && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" /> {log.profile.full_name || log.profile.email}
                          </span>
                        )}
                        {log.correlation_id && (
                          <span className="font-mono text-[10px]">ID: {log.correlation_id}</span>
                        )}
                      </div>
                    </div>
                    {log.status === "failed" && log.error_message && (
                      <div className="text-[11px] text-red-600 bg-red-50 p-2 rounded flex-shrink-0 sm:max-w-[300px]">
                        {log.error_message}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
