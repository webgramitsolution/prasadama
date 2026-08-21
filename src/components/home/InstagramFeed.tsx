
import React, { useEffect, useRef, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Instagram, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionHeading } from "./SectionHeading";

interface InstagramPost {
  id: string;
  caption?: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string;
  permalink: string;
  thumbnail_url?: string;
  timestamp: string;
}

const InstagramFeed = () => {
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<{ message: string; details?: string; length?: number } | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ status: 'success' | 'failed'; message: string; username?: string } | null>(null);

  const testConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const { data, error: functionError } = await supabase.functions.invoke('instagram-feed', {
        body: { type: 'test' }
      });
      
      if (functionError) {
        let errorMsg = "Connection test failed.";
        try {
          const body = await functionError.context.json();
          errorMsg = body.message || errorMsg;
        } catch (e) {}
        setTestResult({ status: 'failed', message: errorMsg });
      } else if (data && data.status === 'success') {
        setTestResult({ 
          status: 'success', 
          message: `Successfully connected to Instagram as @${data.username}!` 
        });
      }
    } catch (err: any) {
      setTestResult({ status: 'failed', message: err.message || "An unexpected error occurred." });
    } finally {
      setIsTesting(false);
    }
  };

  const fetchFeed = async (cursor?: string) => {
    try {
      if (cursor) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const { data, error: functionError } = await supabase.functions.invoke('instagram-feed', {
        body: { 
          after: cursor, 
          limit: '12' 
        }
      });
      
      if (functionError) {
        console.error("Function Error Detail:", functionError);
        // Try to parse the error message if possible
        let message = "Instagram feed is temporarily unavailable.";
        let length = undefined;
        
        try {
          const errorBody = await functionError.context.json();
          message = errorBody.message || message;
          length = errorBody.length;
        } catch (e) {}
        
        throw { message, length };
      }
      
      if (data && data.data) {
        if (cursor) {
          setPosts(prev => [...prev, ...data.data]);
        } else {
          setPosts(data.data);
        }
        
        if (data.paging && data.paging.cursors) {
          setNextCursor(data.paging.cursors.after || null);
        } else {
          setNextCursor(null);
        }
        setError(null);
      } else if (!cursor) {
        setError({ message: "No posts found" });
      }
    } catch (err: any) {
      console.error("Instagram Feed Error:", err);
      if (!cursor) {
        setError({ 
          message: err.message || "Instagram feed is temporarily unavailable.",
          length: err.length
        });
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  const scrollerRef = useRef<HTMLDivElement>(null);

  // Infinite horizontal scroll: load more as the user swipes towards the end
  const handleScroll = () => {
    const el = scrollerRef.current;
    if (!el || loadingMore || !nextCursor) return;
    if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 300) {
      fetchFeed(nextCursor);
    }
  };

  if (loading) {
    return (
      <section className="pt-12 pb-7 bg-white">
        <div className="container mx-auto px-4">
          <SectionHeading
            title="Instagram Feed"
            action={<Skeleton className="h-9 w-28 rounded-[10px]" />}
          />
          <div className="flex gap-4 overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <Skeleton
                key={i}
                className="aspect-[4/5] shrink-0 rounded-xl w-[calc((100%-16px)/2)] md:w-[calc((100%-48px)/4)] lg:w-[calc((100%-64px)/5)]"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error || posts.length === 0) {
    return (
      <section className="pt-12 pb-7 bg-white">
        <div className="container mx-auto px-4 text-center">
          <SectionHeading title="Instagram Feed" />
          <div className="bg-orange-50 border border-orange-100 p-6 rounded-xl max-w-2xl mx-auto mb-8">
            <p className="text-orange-700 font-medium mb-2">Setup Required</p>
            <p className="text-orange-600 text-sm mb-4">
              To display your Instagram posts, you need to provide a valid <strong>Instagram User Access Token</strong>.
            </p>
            
            {error?.length && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-left">
                <p className="text-red-700 text-xs font-bold uppercase">Token Length Warning</p>
                <p className="text-red-600 text-sm">
                  Detected token length: <strong>{error.length} characters</strong>. 
                  A real Instagram token is usually 100+ characters. 
                  You might have copied the App ID or Client Secret by mistake.
                </p>
              </div>
            )}

            <div className="text-gray-700 text-xs text-left border-t border-orange-100 pt-4 space-y-4">
              <div>
                <p className="font-bold mb-2">Step-by-Step Instructions:</p>
                <ol className="list-decimal ml-4 space-y-1">
                  <li>Go to <a href="https://developers.facebook.com/" target="_blank" className="text-blue-600 underline">Meta for Developers</a>.</li>
                  <li>Create an App (Type: "Consumer" or "Business").</li>
                  <li>Add the <strong>Instagram Basic Display</strong> product.</li>
                  <li>Generate a <strong>User Token</strong> using the "User Token Generator" in the Basic Display settings.</li>
                  <li>Copy that token and add it to your <strong>Backend Secrets</strong> as <code className="bg-gray-100 px-1 rounded">INSTAGRAM_ACCESS_TOKEN</code>.</li>
                </ol>
              </div>

              <div className="pt-2 border-t border-orange-100">
                <p className="font-bold mb-2">Verify Connection:</p>
                <div className="flex flex-col gap-2">
                  <Button 
                    onClick={testConnection} 
                    disabled={isTesting}
                    size="sm"
                    variant="outline"
                    className="w-full md:w-auto self-start border-orange-200 text-orange-700 hover:bg-orange-100 rounded-[8px]"
                  >
                    {isTesting ? "Testing..." : "Test Instagram Connection"}
                  </Button>
                  
                  {testResult && (
                    <div className={`p-2 rounded text-[11px] ${testResult.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {testResult.message}
                    </div>
                  )}
                </div>
              </div>

              <p className="mt-2 text-[10px] text-gray-500 italic">Current error: {error?.message || "Invalid Token"}</p>
            </div>
          </div>
          <Button 
            onClick={() => window.open('https://www.instagram.com/houskase_official', '_blank')}
            className="bg-[#E4405F] hover:bg-[#D82D4B] text-white rounded-[10px]"
          >
            <Instagram className="mr-2 h-4 w-4" /> Visit our Instagram
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="pt-12 pb-7 bg-white">
      <div className="container mx-auto px-4">
        <SectionHeading
          title="Instagram Feed"
          action={
            <Button
              onClick={() => window.open('https://www.instagram.com/houskase_official', '_blank')}
              variant="outline"
              size="sm"
              className="border-[#E4405F] text-[#E4405F] hover:bg-[#E4405F] hover:text-white rounded-[10px] transition-colors duration-300"
            >
              <Instagram className="mr-2 h-4 w-4" /> Follow Us
            </Button>
          }
        />

        <div
          ref={scrollerRef}
          onScroll={handleScroll}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {posts.map((post) => (
            <a 
              key={post.id} 
              href={post.permalink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="group relative block aspect-[4/5] shrink-0 snap-start overflow-hidden rounded-xl bg-gray-100 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 w-[calc((100%-16px)/2)] md:w-[calc((100%-48px)/4)] lg:w-[calc((100%-64px)/5)]"
            >
              <img 
                src={post.media_type === 'VIDEO' ? (post.thumbnail_url || post.media_url) : post.media_url} 
                alt={post.caption || "Instagram post"} 
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://placehold.co/400x400?text=Instagram+Post';
                }}
              />
              
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <div className="flex flex-col items-center text-white p-4 text-center">
                  <ExternalLink className="mb-2 h-6 w-6" />
                  <span className="text-xs font-medium uppercase tracking-wider">View Post</span>
                </div>
              </div>

              {post.media_type === 'VIDEO' && (
                <div className="absolute top-2 right-2 rounded-full bg-black/50 p-1.5 text-white backdrop-blur-sm">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              )}
              
              {post.media_type === 'CAROUSEL_ALBUM' && (
                <div className="absolute top-2 right-2 rounded-full bg-black/50 p-1.5 text-white backdrop-blur-sm">
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <line x1="3" y1="9" x2="21" y2="9" />
                    <line x1="9" y1="21" x2="9" y2="3" />
                  </svg>
                </div>
              )}
            </a>
          ))}
          {loadingMore &&
            [...Array(2)].map((_, i) => (
              <Skeleton
                key={`more-${i}`}
                className="aspect-[4/5] shrink-0 rounded-xl w-[calc((100%-16px)/2)] md:w-[calc((100%-48px)/4)] lg:w-[calc((100%-64px)/5)]"
              />
            ))}
        </div>
      </div>
    </section>
  );
};

export default InstagramFeed;
