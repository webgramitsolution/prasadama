import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { SEOHead } from "@/components/SEOHead";

export default function Chat() {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Chat Support" description="Get instant support from Prasadam team. Ask about products, pricing, and orders." />
      <div className="flex h-dvh flex-col">
        <div className="shrink-0"><Header /></div>
      
      <main className="min-h-0 flex-1">
        <div className="container mx-auto h-full px-4 py-2">
          <ChatInterface />
        </div>
      </main>
      </div>

      <Footer />
    </div>
  );
}