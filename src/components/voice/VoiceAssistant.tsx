import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Mic, MicOff, X, Volume2, VolumeX, Send, MessageCircle, Sparkles, Sofa, Search, Layers, Building2, Calendar, ShoppingCart, Package, ArrowRight, Loader2, ChevronRight, MessageSquare, ThumbsUp, ThumbsDown, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { SignedImage } from "@/components/common/SignedImage";
import { useToast } from "@/hooks/use-toast";
import robotAiAsset from "@/assets/robot-ai.png.asset.json";


interface CategoryRow { id: string; name: string; slug: string; }
interface ProductRow { id: string; name: string; slug: string; images?: string[] | null; }
interface ChatMsg { role: "user" | "assistant"; text: string; ts: number; products?: ProductRow[]; feedback?: number; }

const SR: any =
  typeof window !== "undefined"
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

const isHindi = (text: string) => /[\u0900-\u097F]/.test(text);

const hindiKeywords: Array<{ re: RegExp; intent: string }> = [
  { re: /(श्रेणी|कैटेगरी|categor)/i, intent: "categories" },
  { re: /(कार्ट|टोकरी|cart|बास्केट)/i, intent: "cart" },
  { re: /(ऑर्डर|आर्डर|order).*(ट्रैक|track|कहाँ|कहां)/i, intent: "track" },
  { re: /(लॉगिन|साइन|login|signin)/i, intent: "login" },
  { re: /(डैशबोर्ड|प्रोफ़ाइल|profile|dashboard)/i, intent: "dashboard" },
  { re: /(सहायता|मदद|help|support)/i, intent: "help" },
  { re: /(कोटेशन|आरएफक्यू|rfq|बल्क|थोक|quote)/i, intent: "rfq" },
  { re: /(होम|घर|home|मुख)/i, intent: "home" },
  { re: /(खोज|खोजो|ढूं|search|find|दिखा)/i, intent: "search" },
];

const QUICK_REPLIES = [
  { icon: Sofa, label: "Categories", sub: "Browse all categories", message: "Show me categories" },
  { icon: Search, label: "Find Product", sub: "Search any product", message: "Find a product" },
  { icon: ShoppingCart, label: "My Cart", sub: "View your cart", message: "Show my cart" },
  { icon: Package, label: "Track Order", sub: "Track your order", message: "Track my order" },
  { icon: Calendar, label: "RFQ / Quote", sub: "Request for quote", message: "I want to request a quote" },
  { icon: MessageSquare, label: "Help & Support", sub: "Get quick help", message: "I need help and support" },
];

const POPULAR_QUESTIONS = [
  "How can I track my order?",
  "Do you offer bulk orders?",
  "What is your return policy?",
  "How long is delivery time?",
];

const ACTION_CHIPS: Array<{ label: string; message: string }> = [
  { label: "Categories", message: "Show me categories" },
  { label: "Request Quote", message: "Take me to request quote page" },
  { label: "Track Order", message: "Take me to track order page" },
  { label: "Contact Sales", message: "How do I contact sales?" },
];


const wantsNavigation = (text: string) =>
  /(take me|go to|open|redirect|navigate|show me the|visit)/i.test(text) ||
  /(ले जा|ले चल|पर ले|पेज खोल|खोल दो|दिखा दो पेज|पर जा)/i.test(text);

export function VoiceAssistant() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);

  const [listening, setListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [muted, setMuted] = useState(false);
  const [interim, setInterim] = useState("");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [thinking, setThinking] = useState(false);
  const [supported] = useState<boolean>(!!SR && typeof window !== "undefined" && "speechSynthesis" in window);

  const [permError, setPermError] = useState("");

  const recognitionRef = useRef<any>(null);
  const categoriesRef = useRef<CategoryRow[]>([]);
  const productsRef = useRef<ProductRow[]>([]);
  const femaleEnRef = useRef<SpeechSynthesisVoice | null>(null);
  const femaleHiRef = useRef<SpeechSynthesisVoice | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mutedRef = useRef(false);
  useEffect(() => { mutedRef.current = muted; }, [muted]);

  const hidden = pathname.startsWith("/admin") || pathname !== "/help";

  useEffect(() => {
    if (hidden) return;
    const fetchData = async () => {
      const [catRes, prodRes] = await Promise.all([
        supabase.from("categories").select("id, name, slug").eq("is_active", true),
        supabase.from("products").select("id, name, slug, images").eq("is_active", true).limit(500),
      ]);
      categoriesRef.current = (catRes.data as CategoryRow[]) || [];
      productsRef.current = (prodRes.data as ProductRow[]) || [];
    };
    fetchData();
  }, [hidden]);


  useEffect(() => {
    if (!supported) return;
    const pickVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices.length) return;
      femaleEnRef.current =
        voices.find((v) => /Google.*(Indian|India|en-IN)/i.test(v.name)) ||
        voices.find((v) => /Microsoft.*(Aria|Jenny|Neerja)/i.test(v.name)) ||
        voices.find((v) => /(Samantha|Karen|Tessa|Moira|Veena|Priya|Raveena)/i.test(v.name)) ||
        voices[0] || null;
      femaleHiRef.current =
        voices.find((v) => /Google.*हिन्दी|Google.*Hindi/i.test(v.name)) ||
        voices.find((v) => /hi-IN/i.test(v.lang)) ||
        femaleEnRef.current;
    };
    pickVoices();
    window.speechSynthesis.onvoiceschanged = pickVoices;
  }, [supported]);

  const speak = useCallback((text: string) => {
    if (!supported || mutedRef.current || !text) return;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      const useHindi = isHindi(text);
      
      console.log(`[VoiceAssistant] Speaking in ${useHindi ? 'Hindi' : 'English'}`);

      if (useHindi) {
        utter.voice = femaleHiRef.current || femaleEnRef.current;
        utter.lang = "hi-IN";
      } else {
        utter.voice = femaleEnRef.current || null;
        utter.lang = "en-US"; // Use standard EN-US for better compatibility if IN fails
      }
      
      utter.rate = 1.0;
      utter.pitch = 1.0;

      utter.onstart = () => setIsSpeaking(true);
      utter.onend = () => setIsSpeaking(false);
      utter.onerror = (e) => {
        console.error("SpeechSynthesis error:", e);
        setIsSpeaking(false);
      };

      window.speechSynthesis.speak(utter);
    } catch (err) {
      console.error("Speech synthesis error:", err);
      setIsSpeaking(false);
    }
  }, [supported]);




  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, interim, thinking]);

  const respond = useCallback((text: string, products?: ProductRow[]) => {
    setMessages((m) => [...m, { role: "assistant", text, ts: Date.now(), products: products || [] }]);
    speak(text);
  }, [speak]);

  const handleFeedback = async (msgIndex: number, rating: number) => {
    const msg = messages[msgIndex];
    if (!msg) return;
    const prevMsg = messages[msgIndex - 1];
    
    setMessages(prev => prev.map((m, i) => i === msgIndex ? { ...m, feedback: rating } : m));

    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("assistant_feedback").insert({
        user_id: user?.id || null,
        message_text: prevMsg?.text || "",
        response_text: msg.text,
        rating: rating
      });
      toast({ title: "Feedback submitted", description: "Thank you for helping us improve!" });
    } catch (err) {
      console.error("Feedback error:", err);
    }
  };

  const searchProducts = useCallback((q: string): ProductRow[] => {
    const norm = q.toLowerCase().trim();
    if (!norm) return [];
    const tokens = norm.split(/\s+/).filter((t) => t.length > 1);
    const all = productsRef.current;
    const direct = all.filter((p) => p.name.toLowerCase().includes(norm));
    if (direct.length) return direct.slice(0, 6);
    if (!tokens.length) return [];
    const scored = all
      .map((p) => {
        const lname = p.name.toLowerCase();
        const score = tokens.reduce((s, t) => s + (lname.includes(t) ? 1 : 0), 0);
        return { p, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score);
    return scored.slice(0, 6).map((x) => x.p);
  }, []);

  const handleCommand = useCallback((raw: string) => {
    const original = raw.trim();
    if (!original) return;
    setMessages((m) => [...m, { role: "user", text: original, ts: Date.now() }]);

    const text = original.toLowerCase();
    const hindi = isHindi(original);
    const t = (en: string, hi: string) => (hindi ? hi : en);
    const navIntent = wantsNavigation(original);
    const closeAndGo = (path: string) => { setOpen(false); navigate(path); };

    if (/(hello|hi|hey|namaste|नमस्ते)/i.test(original)) {
      return respond(t(
        "Hello! I am your Houskase shopping assistant.",
        "नमस्ते! मैं हौसकेस की शॉपिंग सहायक हूँ।"
      ));
    }

    const cleaned = original
      .replace(/^(please\s+)?(take me to|go to|open|show me|find|search)\s+/i, "")
      .trim();

    const productMatches = searchProducts(cleaned || original);
    if (navIntent && productMatches.length === 1 && productMatches[0]) {
      const match = productMatches[0];
      return closeAndGo(`/product/${match.slug}`);
    }
    if (/(search|find|show|खोज|ढूं|दिखा)/i.test(original) && productMatches.length) {
      return respond(
        t(`Found ${productMatches.length} products.`, `${productMatches.length} प्रोडक्ट मिले।`),
        productMatches
      );
    }

    (async () => {
      setThinking(true);
      try {
        const { data, error } = await supabase.functions.invoke("assistant-chat", {
          body: { 
            message: original, 
            history: messages.slice(-4).map(m => ({ role: m.role, text: m.text })),
            siteContext: {
              categories: categoriesRef.current.slice(0, 20),
              products: productsRef.current.slice(0, 20)
            }
          },
        });
        if (error) throw error;
        respond(data.text, data.products);
      } catch (err) {
        respond(t(
          "I'm having trouble connecting right now. Please try again in a moment.",
          "मुझे अभी जुड़ने में परेशानी हो रही है। कृपया थोड़ी देर बाद फिर से प्रयास करें।"
        ));
      } finally {
        setThinking(false);
      }
    })();
  }, [navigate, respond, searchProducts, messages]);

  const startListening = useCallback(() => {
    if (!supported) {
      toast({
        title: isHindi("") ? "समर्थित नहीं है" : "Not Supported",
        description: isHindi("") ? "आपका ब्राउज़र वॉयस सर्च का समर्थन नहीं करता है।" : "Your browser does not support voice search.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      window.speechSynthesis.cancel();
      const rec = new SR();
      rec.lang = "hi-IN";
      rec.continuous = false;
      rec.interimResults = true;

      rec.onstart = () => {
        setListening(true);
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setListening(false);
        let msg = "Microphone error occurred.";
        let title = "Mic Error";
        
        if (event.error === 'not-allowed') {
          title = "Permission Denied";
          msg = "Please allow microphone access to use voice search.";
        } else if (event.error === 'no-speech') {
          title = "No Speech Detected";
          msg = "I didn't hear anything. Please try again.";
        } else if (event.error === 'network') {
          title = "Network Error";
          msg = "Network error occurred during speech recognition.";
        }

        toast({
          title: title,
          description: msg,
          variant: "destructive",
        });
      };

      rec.onresult = (e: any) => {
        const res = e.results[0];
        setInterim(res[0].transcript);
        if (res.isFinal) {
          handleCommand(res[0].transcript);
          setInterim("");
          setListening(false);
        }
      };

      rec.onend = () => {
        setListening(false);
      };

      rec.start();
      recognitionRef.current = rec;
    } catch (err) {
      console.error("Failed to start speech recognition", err);
      setListening(false);
      toast({
        title: "Microphone Error",
        description: "Could not access the microphone. Please check your settings.",
        variant: "destructive",
      });
    }
  }, [supported, handleCommand, toast]);

  useEffect(() => {
    const handleOpen = () => {
      setOpen(true);
      setTimeout(() => startListening(), 500);
    };
    window.addEventListener('open-voice-assistant', handleOpen);
    return () => window.removeEventListener('open-voice-assistant', handleOpen);
  }, [startListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      setListening(false);
    }
  }, []);

  if (hidden) return null;

  const BRAND = "#C62828";

  return (
    <>
      {/* Floating bubble */}
      <AnimatePresence>
        {!open && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-24 right-4 z-[9999] flex items-center gap-2"
          >
            <div className="hidden sm:block rounded-xl bg-white shadow-lg border border-black/5 px-3 py-2 text-[11px] leading-tight text-[#333333]">
              Hi! Need help?
              <br />
              Chat with us 😊
            </div>
            <button
              onClick={() => { setOpen(true); setMinimized(false); }}
              aria-label="Open Houskase Assistant"
              className="relative h-16 w-16 rounded-full shadow-xl flex items-center justify-center hover:scale-105 transition-transform"
              style={{ backgroundColor: BRAND }}
            >
              <span className="h-11 w-11 rounded-full bg-white flex items-center justify-center overflow-hidden">
                <img src="/favicon.png" alt="Houskase Assistant" className="h-8 w-8 object-contain" />
              </span>
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-white text-[10px] font-bold flex items-center justify-center shadow" style={{ color: BRAND }}>
                1
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Minimized card */}
      <AnimatePresence>
        {open && minimized && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-4 z-[9999] w-[280px] rounded-xl overflow-hidden bg-white shadow-2xl border border-black/5"
          >
            <div className="flex items-center justify-between px-3 py-2.5" style={{ backgroundColor: BRAND }}>
              <div className="flex items-center gap-2">
                <span className="h-8 w-8 rounded-full bg-white flex items-center justify-center overflow-hidden">
                  <img src="/favicon.png" alt="" className="h-6 w-6 object-contain" />
                </span>
                <div className="text-white">
                  <p className="text-xs font-bold leading-tight">Houskase Assistant</p>
                  <span className="flex items-center gap-1 text-[9px] text-white/80">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400" /> Online
                  </span>
                </div>
              </div>
              <button onClick={() => { setOpen(false); setMinimized(false); }} className="text-white/90 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-3 space-y-3">
              <div className="flex items-start gap-2 rounded-lg bg-[#F7F7F7] p-2.5">
                <img src="/favicon.png" alt="" className="h-4 w-4 object-contain mt-0.5" />
                <p className="text-[11px] text-[#333333]">Hi! How can I help you today?</p>
              </div>
              <button
                onClick={() => setMinimized(false)}
                className="w-full rounded-lg border py-2 text-xs font-semibold"
                style={{ borderColor: BRAND, color: BRAND }}
              >
                Open Chat
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat window */}
      <AnimatePresence>
        {open && !minimized && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-4 z-[9999] w-[calc(100vw-32px)] sm:w-[380px] h-[600px] max-h-[85vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-black/5"
          >
            {/* Listening overlay */}
            {listening && (
              <div className="absolute inset-0 z-[60] bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center space-y-8 p-6 text-center">
                <div className="relative">
                  <motion.div
                    animate={{ scale: [1, 1.12, 1] }}
                    transition={{ repeat: Infinity, duration: 1.8 }}
                    className="h-24 w-24 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(198,40,40,0.45)]"
                    style={{ backgroundColor: BRAND }}
                  >
                    <Mic className="h-10 w-10 text-white" />
                  </motion.div>
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0.5 }}
                    animate={{ scale: 2, opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 1.8 }}
                    className="absolute inset-0 rounded-full"
                    style={{ backgroundColor: BRAND }}
                  />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#333333]">Listening...</h3>
                  <p className="text-sm text-[#333333]/60 mt-2">Go ahead, I'm listening to your voice.</p>
                </div>
                <button
                  onClick={stopListening}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold border"
                  style={{ color: BRAND, borderColor: BRAND }}
                >
                  <Square className="h-4 w-4 fill-current" />
                  Stop
                </button>
              </div>
            )}

            {/* Header */}
            <div className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: BRAND }}>
              <div className="flex items-center gap-3">
                <span className="h-10 w-10 rounded-full bg-white flex items-center justify-center overflow-hidden">
                  <img src="/favicon.png" className="h-7 w-7 object-contain" alt="Houskase Assistant" />
                </span>
                <div className="text-white">
                  <h3 className="font-bold text-sm leading-tight">Houskase Assistant</h3>
                  <div className="flex items-center gap-1.5 text-[10px] text-white/85">
                    <span className={cn("w-1.5 h-1.5 rounded-full", thinking || listening || isSpeaking ? "bg-amber-300 animate-pulse" : "bg-green-400")} />
                    {listening ? "Listening..." : thinking ? "Thinking..." : isSpeaking ? "Speaking..." : "Online"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-white">
                <button onClick={() => setMuted(!muted)} className="p-1.5 hover:bg-white/15 rounded transition-colors" title={muted ? "Unmute" : "Mute"}>
                  {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
                <button onClick={() => setMinimized(true)} className="p-1.5 hover:bg-white/15 rounded transition-colors" title="Minimize">
                  <span className="block h-[2px] w-4 bg-white rounded-full" />
                </button>
                <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-white/15 rounded transition-colors" title="Close">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-white">
              {messages.length === 0 ? (
                <div className="space-y-5">
                  <div className="text-center space-y-2 pt-2">
                    <img src="/favicon.png" alt="" className="h-12 w-12 object-contain mx-auto" />
                    <h3 className="font-bold text-lg text-[#333333]">Welcome to Houskase 👋</h3>
                    <p className="text-[13px] text-[#333333]/70 leading-relaxed px-2">
                      Hi! I'm your shopping assistant. Ask me about products, orders, delivery, or anything else. I'm here to help!
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {QUICK_REPLIES.map((reply, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleCommand(reply.message)}
                        className="text-left rounded-xl border border-black/10 p-3 hover:shadow-md transition-shadow bg-white flex items-start gap-2.5"
                      >
                        <reply.icon className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: BRAND }} />
                        <span className="min-w-0">
                          <span className="block text-[12px] font-bold text-[#333333] leading-tight truncate">{reply.label}</span>
                          <span className="block text-[10px] text-[#333333]/60 leading-tight mt-0.5 truncate">{reply.sub}</span>
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="pt-1 border-t border-black/5">
                    <p className="text-[10px] tracking-[0.15em] text-[#333333]/50 text-center my-2.5">POPULAR QUESTIONS</p>
                    <div className="grid grid-cols-2 gap-2">
                      {POPULAR_QUESTIONS.map((q) => (
                        <button
                          key={q}
                          onClick={() => handleCommand(q)}
                          className="rounded-lg border border-black/10 px-2.5 py-2 text-[11px] leading-tight text-[#333333] hover:bg-[#F7F7F7] transition-colors text-center"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              ) : (
                <>
                  <div className="flex justify-center">
                    <span className="rounded-full bg-[#F7F7F7] px-3 py-1 text-[10px] text-[#333333]/60">Today</span>
                  </div>
                  {messages.map((m, i) => (
                    <div key={i} className={cn("flex gap-2", m.role === "user" ? "justify-end" : "items-start")}>
                      {m.role === "assistant" && (
                        <span className="h-7 w-7 rounded-full bg-[#F7F7F7] flex items-center justify-center flex-shrink-0 mt-1">
                          <img src="/favicon.png" alt="" className="h-4 w-4 object-contain" />
                        </span>
                      )}
                      <div className="max-w-[78%] space-y-2">
                        <div
                          className={cn(
                            "relative group rounded-2xl px-3.5 py-2.5 text-[13px] leading-snug text-[#333333]",
                            m.role === "user" ? "bg-[#FDECEC] rounded-br-md" : "bg-[#F7F7F7] rounded-bl-md"
                          )}
                        >
                          {m.text}
                          <div className="mt-1 text-[9px] text-[#333333]/45 text-right">
                            {new Date(m.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                          {m.role === "assistant" && (
                            <div className="absolute -bottom-5 right-1 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleFeedback(i, 1)} className={cn("p-1", m.feedback === 1 && "text-[#C62828]")}>
                                <ThumbsUp className="h-3 w-3" />
                              </button>
                              <button onClick={() => handleFeedback(i, -1)} className={cn("p-1", m.feedback === -1 && "text-[#C62828]")}>
                                <ThumbsDown className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                        </div>

                        {m.role === "assistant" && m.products && m.products.length > 0 && (
                          <div className="grid grid-cols-1 gap-2">
                            {m.products.map((p) => (
                              <button
                                key={p.id}
                                onClick={() => { setOpen(false); navigate(`/product/${p.slug}`); }}
                                className="flex items-center gap-3 p-2 bg-white border border-black/10 rounded-xl hover:shadow-md text-left transition-all"
                              >
                                <div className="h-12 w-12 rounded-lg overflow-hidden flex-shrink-0 border border-black/10">
                                  <SignedImage src={p.images?.[0] || "/placeholder.svg"} className="h-full w-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold truncate text-[#333333]">{p.name}</p>
                                  <p className="text-[10px] flex items-center gap-1" style={{ color: BRAND }}>
                                    View details <ChevronRight className="h-3 w-3" />
                                  </p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {interim && (
                    <div className="flex justify-end">
                      <div className="max-w-[78%] rounded-2xl rounded-br-md bg-[#FDECEC] px-3.5 py-2.5 text-[13px] italic text-[#333333]/70">{interim}</div>
                    </div>
                  )}

                  {thinking && (
                    <div className="flex items-start gap-2">
                      <span className="h-7 w-7 rounded-full bg-[#F7F7F7] flex items-center justify-center flex-shrink-0">
                        <img src="/favicon.png" alt="" className="h-4 w-4 object-contain" />
                      </span>
                      <div className="bg-[#F7F7F7] px-3.5 py-3 rounded-2xl rounded-bl-md">
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#333333]/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-[#333333]/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-[#333333]/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-1">
                    {ACTION_CHIPS.map((c) => (
                      <button
                        key={c.label}
                        onClick={() => handleCommand(c.message)}
                        className="rounded-lg border px-3 py-1.5 text-[11px] font-medium"
                        style={{ borderColor: BRAND, color: BRAND }}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Composer */}
            <div className="px-3 pt-3 pb-2 border-t border-black/5 bg-white">
              <form onSubmit={(e) => { e.preventDefault(); handleCommand(input); setInput(""); }} className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 rounded-full border border-black/10 px-4 h-11">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 bg-transparent text-[13px] outline-none text-[#333333] placeholder:text-[#333333]/40"
                  />
                  <button
                    type="button"
                    onClick={listening ? stopListening : startListening}
                    className={cn("text-[#333333]/50 hover:text-[#333333]", listening && "text-[#C62828] animate-pulse")}
                    title="Voice input"
                  >
                    {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="h-11 w-11 rounded-full text-white flex items-center justify-center disabled:opacity-50 flex-shrink-0"
                  style={{ backgroundColor: BRAND }}
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
              <p className="text-center text-[10px] text-[#333333]/50 mt-2">We're here 24/7 to help you! ❤️</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

