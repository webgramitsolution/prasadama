import { supabase } from "@/integrations/supabase/client";

// All storefront media buckets are private; files are served through short-lived signed links.
const PRIVATE_BUCKETS = ["product-images", "category-images", "banners", "reels"] as const;
const cache = new Map<string, Promise<string>>();

function parseStorageUrl(url?: string | null): { bucket: string; path: string } | null {
  if (!url) return null;
  for (const bucket of PRIVATE_BUCKETS) {
    for (const kind of ["public", "sign", "authenticated"]) {
      const marker = `/storage/v1/object/${kind}/${bucket}/`;
      const index = url.indexOf(marker);
      if (index >= 0) {
        const path = decodeURIComponent(url.slice(index + marker.length).split("?")[0] || "");
        return path ? { bucket, path } : null;
      }
    }
  }
  return null;
}

/** True for any URL that points at one of the private storefront buckets. */
export function isProductBucketUrl(url?: string | null) {
  return parseStorageUrl(url) !== null;
}

export const isPrivateStorageUrl = isProductBucketUrl;

export function getProductStoragePathFromUrl(url?: string | null) {
  return parseStorageUrl(url)?.path ?? null;
}

export async function getSignedImageUrl(url?: string | null): Promise<string> {
  const parsed = parseStorageUrl(url);
  if (!url || !parsed) return url || "";

  const cached = cache.get(url);
  if (cached) return cached;

  const promise = (async () => {
    try {
      const { data, error } = await supabase.storage
        .from(parsed.bucket)
        .createSignedUrl(parsed.path, 60 * 60 * 24 * 7);
      if (error || !data?.signedUrl) {
        cache.delete(url);
        return url;
      }
      return data.signedUrl;
    } catch (error) {
      console.warn("Signed image fallback failed", error);
      cache.delete(url);
      return url;
    }
  })();

  cache.set(url, promise);
  return promise;
}

export async function getSignedImageUrls(urls?: (string | null | undefined)[] | null): Promise<string[]> {
  if (!urls?.length) return [];
  return Promise.all(urls.filter(Boolean).map((url) => getSignedImageUrl(url)));
}
