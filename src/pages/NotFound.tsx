import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { SEOHead } from "@/components/SEOHead";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <SEOHead
        title="404 — Page Not Found"
        description="The Prasadam page you're looking for doesn't exist or has moved. Return home or browse our product catalogue."
        canonical={`https://houskase.com${location.pathname}`}
        noIndex
      />
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-2 text-xl text-muted-foreground">This page could not be found.</p>
        <p className="mb-4 text-sm text-muted-foreground">The link may be outdated, or the page may have moved.</p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
