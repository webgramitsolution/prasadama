import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { 
  Search, 
  MessageSquare, 
  Clock, 
  ArrowLeft,
  Send,
  Loader2,
  Mail,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export default function AdminChat() {
  const { toast } = useToast();
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConversation, setActiveConversation] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [otherTyping, setOtherTyping] = useState(false);
  const typingChannelRef = useRef<any>(null);
  const otherTypingTimerRef = useRef<any>(null);

  const fetchConversations = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from("chat_conversations")
        .select(`
          *,
          buyer_profile:profiles!chat_conversations_buyer_id_fkey(
            full_name,
            email,
            company_name,
            buyer_type
          )
        `)
        .order("last_message_at", { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      toast({ title: "Error", description: "Failed to load chats", variant: "destructive" });
    }
    setIsLoading(false);
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase.from("chat_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
      
      // Use RPC to mark conversation as read
      await supabase.rpc("mark_conversation_read", { _conversation_id: conversationId });
      
      setConversations(prev => 
        prev.map(c => c.id === conversationId ? { ...c, is_read: true } : c)
      );

      // Typing channel for active conversation
      if (typingChannelRef.current) supabase.removeChannel(typingChannelRef.current);
      
      const { data: { user } } = await supabase.auth.getUser();
      const typingCh = supabase
        .channel(`typing-${conversationId}`, { config: { broadcast: { self: false } } })
        .on("broadcast", { event: "typing" }, (payload) => {
          if (payload['payload']?.userId && payload['payload'].userId !== user?.id) {
            setOtherTyping(true);
            if (otherTypingTimerRef.current) clearTimeout(otherTypingTimerRef.current);
            otherTypingTimerRef.current = setTimeout(() => setOtherTyping(false), 2500);
          }
        })
        .subscribe();
      typingChannelRef.current = typingCh;
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  useEffect(() => {
    fetchConversations();

    const channel = supabase
      .channel("admin-chat-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_conversations" }, () => {
        fetchConversations();
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, (payload: any) => {
        const msg = payload.new;
        if (activeConversation && msg.conversation_id === activeConversation.id) {
          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          // Mark new message as read if active
          supabase.rpc("mark_conversation_read", { _conversation_id: activeConversation.id });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (typingChannelRef.current) supabase.removeChannel(typingChannelRef.current);
      if (otherTypingTimerRef.current) clearTimeout(otherTypingTimerRef.current);
    };
  }, [activeConversation?.id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    if (activeConversation && typingChannelRef.current) {
      supabase.auth.getUser().then(({ data }) => {
        if (data.user) {
          typingChannelRef.current.send({
            type: "broadcast",
            event: "typing",
            payload: { userId: data.user.id }
          });
        }
      });
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConversation || !newMessage.trim() || isSending) return;

    setIsSending(true);
    const text = newMessage.trim();
    setNewMessage("");
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("chat_messages")
        .insert({
          conversation_id: activeConversation.id,
          sender_id: user.id,
          message: text
        });

      if (error) throw error;
      
      // Update conversation to mark as unread for the buyer and update timestamp
      await supabase.from("chat_conversations")
        .update({ 
          last_message_at: new Date().toISOString(),
          is_read: false 
        })
        .eq("id", activeConversation.id);
      
      // Update local state
      setConversations(prev => prev.map(c => 
        c.id === activeConversation.id ? { ...c, last_message_at: new Date().toISOString(), is_read: true } : c
      ).sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()));

    } catch (error) {
      console.error("Error sending message:", error);
      setNewMessage(text); // Restore message on error
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
    }
    setIsSending(false);
  };

  const filteredConversations = conversations.filter(conv => {
    const profile = conv.buyer_profile;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = (
      profile?.full_name?.toLowerCase().includes(searchLower) ||
      profile?.email?.toLowerCase().includes(searchLower) ||
      profile?.company_name?.toLowerCase().includes(searchLower) ||
      conv.subject?.toLowerCase().includes(searchLower) ||
      conv.id.toLowerCase().includes(searchLower)
    );
    return matchesSearch;
  });

  return (
    <div className="flex h-[calc(100vh-120px)] bg-background rounded-xl border border-border overflow-hidden shadow-card">
      <div className={cn(
        "w-full lg:w-80 border-r border-border flex flex-col bg-muted/30",
        activeConversation && "hidden lg:flex"
      )}>
        <div className="p-4 border-b border-border space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Customer Chats
            </h2>
              <Button variant="ghost" size="icon" onClick={fetchConversations}>
                <Clock className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/dev/email-preview-internal" className="text-xs">
                  <Mail className="h-4 w-4 mr-1" /> Preview
                </Link>
              </Button>
            </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name, email, subject..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" /></div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No conversations found</div>
          ) : (
            <div className="divide-y divide-border">
              {filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => {
                    setActiveConversation(conv);
                    fetchMessages(conv.id);
                  }}
                  className={cn(
                    "w-full p-4 text-left transition-colors hover:bg-muted/50 relative",
                    activeConversation?.id === conv.id && "bg-muted/80"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarFallback className={cn("bg-primary text-primary-foreground", !conv.is_read && "bg-shop")}>
                        {(conv.buyer_profile?.full_name || conv.buyer_profile?.email || "U")[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={cn("text-sm truncate", !conv.is_read ? "font-bold" : "font-medium")}>
                          {conv.buyer_profile?.full_name || conv.buyer_profile?.company_name || "Customer"}
                        </p>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {conv.last_message_at ? format(new Date(conv.last_message_at), "MMM d") : ""}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {conv.buyer_profile?.email}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <p className={cn("text-xs truncate flex-1", !conv.is_read ? "text-foreground font-semibold" : "text-muted-foreground")}>
                          {conv.subject || "New conversation"}
                        </p>
                        {!conv.is_read && (
                          <span className="h-2 w-2 rounded-full bg-shop ml-2 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      <div className={cn(
        "flex-1 flex flex-col",
        !activeConversation && "hidden lg:flex"
      )}>
        {activeConversation ? (
          <>
            <div className="p-4 border-b border-border flex items-center gap-3 bg-background/50">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setActiveConversation(null)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-accent text-accent-foreground">
                  {(activeConversation.buyer_profile?.full_name || "U")[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">
                  {activeConversation.buyer_profile?.full_name || activeConversation.buyer_profile?.company_name || "Customer"}
                </p>
                <p className={cn("text-xs flex items-center gap-1", otherTyping ? "text-success" : "text-muted-foreground")}>
                  {otherTyping ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                      typing...
                    </>
                  ) : (
                    activeConversation.buyer_profile?.email
                  )}
                </p>
              </div>
              <Badge variant="outline" className="text-xs">
                {activeConversation.status || "Open"}
              </Badge>
            </div>

            <ScrollArea className="flex-1 p-4 bg-muted/10">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex max-w-[80%] flex-col gap-1",
                      msg.sender_id !== activeConversation.buyer_id ? "ml-auto items-end" : "items-start"
                    )}
                  >
                    <div className={cn(
                      "rounded-2xl p-3 text-sm shadow-sm",
                      msg.sender_id !== activeConversation.buyer_id 
                        ? "bg-primary text-primary-foreground rounded-tr-none" 
                        : "bg-background border border-border rounded-tl-none"
                    )}>
                      {msg.message}
                    </div>
                    <span className="text-[10px] text-muted-foreground px-1">
                      {format(new Date(msg.created_at), "p")}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="p-4 border-t border-border bg-background">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input 
                  placeholder="Type your reply..." 
                  value={newMessage}
                  onChange={handleInputChange}
                  disabled={isSending}
                  className="bg-muted/30 focus-visible:ring-primary"
                />
                <Button type="submit" disabled={isSending || !newMessage.trim()} size="icon" className="flex-shrink-0">
                  {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 bg-muted/5">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageSquare className="h-8 w-8 text-primary" />
            </div>
            <div className="max-w-xs">
              <h3 className="text-lg font-bold">Select a Chat</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Choose a customer conversation from the list to start messaging.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
