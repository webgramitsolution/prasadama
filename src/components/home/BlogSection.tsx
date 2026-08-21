import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SignedImage } from "@/components/common/SignedImage";
import { SectionHeading } from "./SectionHeading";
import { Button } from "@/components/ui/button";

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image: string | null;
  author: string | null;
  published_at: string;
}

export function BlogSection() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    const newSlide = Math.round(scrollLeft / clientWidth);
    setActiveSlide(newSlide);
  };

  useEffect(() => {
    let cancelled = false;
    const fetchPosts = async () => {
      const { data } = await supabase
        .from("blog_posts")
        .select("id, title, slug, excerpt, cover_image, author, published_at")
        
        .order("sort_order", { ascending: true })
        .order("published_at", { ascending: false })
        .limit(4);
      if (!cancelled) setPosts((data as BlogPost[]) || []);
    };
    fetchPosts();
    const channel = supabase
      .channel("blog_posts_home")
      .on("postgres_changes", { event: "*", schema: "public", table: "blog_posts" }, fetchPosts)
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  if (posts.length === 0) return null;

  return (
    <section className="py-8 sm:py-10 bg-background">
      <div className="container mx-auto px-3 sm:px-4">
        <SectionHeading title="From Our Blog" />
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="grid grid-cols-2 gap-3 sm:gap-[10px] md:grid-cols-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide flex-nowrap flex md:grid"
        >
          {posts.map((post) => (
            <Link
              key={post.id}
              to={`/blog/${post.slug}`}
              className="group rounded-xl border border-border bg-card overflow-hidden flex flex-col hover:shadow-[0_4px_20px_rgba(0,0,0,0.1)] transition-shadow min-w-[280px] md:min-w-0 snap-start"
            >
              <div className="aspect-[21/9] bg-secondary overflow-hidden">
                <SignedImage
                  src={post.cover_image}
                  alt={post.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-3 sm:p-4 flex flex-col flex-grow">
                <h3 className="text-base font-semibold text-foreground line-clamp-2 leading-tight">{post.title}</h3>
                {post.excerpt && (
                  <p className="mt-1.5 text-sm text-muted-foreground line-clamp-3">{post.excerpt}</p>
                )}
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent">
                  Read more <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
        
        {/* Slider Dots - Mobile Only */}
        <div className="flex justify-center gap-2 mt-4 md:hidden">
          {Array.from({ length: posts.length }).map((_, idx) => (
            <button
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === activeSlide ? "bg-accent w-6" : "bg-accent/30 w-1.5"
              }`}
              onClick={() => {
                if (scrollRef.current) {
                  scrollRef.current.scrollTo({
                    left: idx * scrollRef.current.clientWidth,
                    behavior: "smooth"
                  });
                }
              }}
            />
          ))}
        </div>
        <div className="mt-5 text-center">
          <Link to="/blog">
            <Button variant="outline" className="text-sm">View all posts</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}