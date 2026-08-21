import { ImgHTMLAttributes, useEffect, useState } from "react";
import { getSignedImageUrl, isProductBucketUrl } from "@/lib/signedImageUrls";

type SignedImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src?: string | null;
  fallbackSrc?: string;
};

export function SignedImage({ src, fallbackSrc = "/placeholder.svg", onError, ...props }: SignedImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src || fallbackSrc);
  const [triedSignedFallback, setTriedSignedFallback] = useState(false);

  useEffect(() => {
    let active = true;
    setCurrentSrc(src || fallbackSrc);
    setTriedSignedFallback(false);

    // The product bucket is private, so a stored "public" URL never loads directly.
    // Sign it up-front instead of waiting for an onError round-trip (avoids broken
    // image flashes in the admin image library and on product pages).
    if (isProductBucketUrl(src)) {
      setTriedSignedFallback(true);
      getSignedImageUrl(src).then((signed) => {
        if (active && signed) setCurrentSrc(signed);
      });
    }

    return () => {
      active = false;
    };
  }, [src, fallbackSrc]);

  return (
    <img
      {...props}
      data-signed-image="true"
      src={currentSrc}
      decoding={props.decoding || "async"}
      onError={async (event) => {
        if (!triedSignedFallback && isProductBucketUrl(src)) {
          setTriedSignedFallback(true);
          const signed = await getSignedImageUrl(src);
          if (signed && signed !== currentSrc) {
            setCurrentSrc(signed);
            return;
          }
        }

        if (currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
          return;
        }

        onError?.(event);
      }}
    />
  );
}
