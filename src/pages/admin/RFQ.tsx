import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileText,
  Search,
  MoreHorizontal,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  Loader2,
  Building2,
  Store,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SignedImage } from "@/components/common/SignedImage";

type RFQRequest = Tables<"rfq_requests">;

interface RFQItem {
  id: string;
  product_name: string | null;
  product_image: string | null;
  variation_details: string | null;
  quantity: number;
  target_price: number | null;
  quoted_price: number | null;
}

const statusConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  pending: { icon: Clock, color: "bg-warning/10 text-warning", label: "Pending" },
  quoted: { icon: DollarSign, color: "bg-primary/10 text-primary", label: "Quoted" },
  accepted: { icon: CheckCircle, color: "bg-success/10 text-success", label: "Accepted" },
  rejected: { icon: XCircle, color: "bg-destructive/10 text-destructive", label: "Rejected" },
  expired: { icon: Clock, color: "bg-muted text-muted-foreground", label: "Expired" },
};

const rfqStatuses = ["pending", "quoted", "accepted", "rejected", "expired"];

export default function AdminRFQ() {
  const [rfqs, setRfqs] = useState<RFQRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRfq, setSelectedRfq] = useState<RFQRequest | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [quotedPrice, setQuotedPrice] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [rfqItems, setRfqItems] = useState<RFQItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const { toast } = useToast();

  const fetchRfqs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("rfq_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRfqs(data || []);
    } catch (error) {
      console.error("Error fetching RFQs:", error);
      toast({ title: "Error", description: "Failed to load RFQ requests", variant: "destructive" });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchRfqs();
  }, []);

  const handleViewRfq = async (rfq: RFQRequest) => {
    setSelectedRfq(rfq);
    setQuotedPrice(rfq.quoted_price?.toString() || "");
    setAdminNotes(rfq.admin_notes || "");
    setDialogOpen(true);
    
    setLoadingItems(true);
    try {
      const { data, error } = await supabase
        .from("rfq_items")
        .select("*")
        .eq("rfq_id", rfq.id);

      if (error) throw error;
      setRfqItems(data || []);
    } catch (error) {
      console.error("Error fetching RFQ items:", error);
    } finally {
      setLoadingItems(false);
    }
  };

  const handleSendQuote = async () => {
    if (!selectedRfq || !quotedPrice) {
      toast({ title: "Error", description: "Please enter a quoted price", variant: "destructive" });
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("rfq_requests")
        .update({
          status: "quoted" as any,
          quoted_price: parseFloat(quotedPrice),
          admin_notes: adminNotes || null,
        })
        .eq("id", selectedRfq.id);

      if (error) throw error;

      toast({ title: "Quote Sent", description: "The quote has been sent to the buyer." });
      setDialogOpen(false);
      fetchRfqs();
    } catch (error) {
      console.error("Error sending quote:", error);
      toast({ title: "Error", description: "Failed to send quote", variant: "destructive" });
    }
    setIsUpdating(false);
  };

  const handleUpdateStatus = async (rfqId: string, newStatus: string) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("rfq_requests")
        .update({ status: newStatus as any })
        .eq("id", rfqId);

      if (error) throw error;

      toast({ title: "RFQ Updated", description: `Status changed to ${newStatus}` });
      fetchRfqs();
      if (selectedRfq?.id === rfqId) {
        setSelectedRfq(prev => prev ? { ...prev, status: newStatus as any } : null);
      }
    } catch (error) {
      console.error("Error updating RFQ:", error);
      toast({ title: "Error", description: "Failed to update RFQ", variant: "destructive" });
    }
    setIsUpdating(false);
  };

  const filteredRfqs = rfqs.filter(rfq => {
    const matchesSearch = (rfq.rfq_number || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rfq.product_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rfq.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rfq.email || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || rfq.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusStats = () => {
    return {
      total: rfqs.length,
      pending: rfqs.filter(r => r.status === "pending").length,
      quoted: rfqs.filter(r => r.status === "quoted").length,
      accepted: rfqs.filter(r => r.status === "accepted").length,
    };
  };

  const stats = getStatusStats();

  return (
    <div className="space-y-6">


      <div className="grid sm:grid-cols-4 gap-4">
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total RFQs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.quoted}</p>
                <p className="text-sm text-muted-foreground">Quoted</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.accepted}</p>
                <p className="text-sm text-muted-foreground">Accepted</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by RFQ number, product, or buyer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {rfqStatuses.map(status => (
                  <SelectItem key={status} value={status}>
                    {statusConfig[status]?.label || status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredRfqs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No RFQ requests found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>RFQ #</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Target Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRfqs.map(rfq => {
                const statusLabel = rfq.status || "pending";
                const status = statusConfig[statusLabel] || statusConfig['pending'];
                const StatusIcon = status?.icon;
                  return (
                    <TableRow key={rfq.id}>
                      <TableCell className="font-medium">{rfq.rfq_number}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{rfq.product_name}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{rfq.full_name}</p>
                          <p className="text-sm text-muted-foreground">{rfq.company_name || rfq.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{rfq.quantity.toLocaleString()} units</TableCell>
                      <TableCell>
                        {rfq.target_price ? `₹${Number(rfq.target_price).toLocaleString("en-IN")}` : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("gap-1", status?.color)}>
                          {StatusIcon && <StatusIcon className="h-3 w-3" />}
                          {status?.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(rfq.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewRfq(rfq)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View & Quote
                            </DropdownMenuItem>
                            {rfqStatuses
                              .filter(s => s !== rfq.status)
                              .map(s => (
                                <DropdownMenuItem key={s} onClick={() => handleUpdateStatus(rfq.id, s)}>
                                  Mark as {statusConfig[s]?.label}
                                </DropdownMenuItem>
                              ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>RFQ {selectedRfq?.rfq_number}</DialogTitle>
            <DialogDescription>
              Submitted on {selectedRfq && new Date(selectedRfq.created_at).toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          {selectedRfq && (() => {
            const statusLabel = selectedRfq.status || "pending";
            const status = statusConfig[statusLabel] || statusConfig['pending'];
            return (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <Badge className={cn("gap-1", status?.color)}>
                    {status?.label}
                  </Badge>
                  {selectedRfq.buyer_type && (
                    <Badge className={selectedRfq.buyer_type === "shop" ? "bg-shop/10 text-shop" : "bg-retail/10 text-retail"}>
                      {selectedRfq.buyer_type === "shop" ? <Building2 className="h-3 w-3 mr-1" /> : <Store className="h-3 w-3 mr-1" />}
                      {selectedRfq.buyer_type}
                    </Badge>
                  )}
                </div>

                <div className="p-4 rounded-xl border">
                  <h4 className="font-medium mb-3">Buyer Information</h4>
                  <div className="grid sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Name</p>
                      <p className="font-medium">{selectedRfq.full_name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Email</p>
                      <p className="font-medium">{selectedRfq.email}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Company</p>
                      <p className="font-medium">{selectedRfq.company_name || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Phone</p>
                      <p className="font-medium">{selectedRfq.phone || "N/A"}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Requested Products ({rfqItems.length || 1})
                  </h4>
                  
                  {loadingItems ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : rfqItems.length > 0 ? (
                    <ScrollArea className="max-h-[300px]">
                      <div className="space-y-3">
                        {rfqItems.map((item) => (
                          <div key={item.id} className="flex gap-3 p-3 border rounded-lg">
                            {item.product_image && (
                              <SignedImage src={(item as any).product_image || undefined} alt={item.product_name || "Product"} className="w-12 h-12 rounded object-cover" />
                            )}
                            <div>
                              <p className="font-medium text-sm">{item.product_name}</p>
                              <p className="text-xs text-muted-foreground">{item.variation_details}</p>
                              <p className="text-xs font-medium mt-1">Qty: {item.quantity}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <p className="text-sm text-muted-foreground">No items found.</p>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Quoted Price (₹)</Label>
                    <Input type="number" value={quotedPrice} onChange={e => setQuotedPrice(e.target.value)} placeholder="0.00" />
                  </div>
                  <div className="space-y-2">
                    <Label>Admin Notes</Label>
                    <Textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} placeholder="Add internal notes..." />
                  </div>
                </div>
              </div>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSendQuote} disabled={isUpdating}>
              {isUpdating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Send Quote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
