import { ImgHTMLAttributes, useEffect, useState } from "react";
import { getSignedImageUrl, isProductBucketUrl } from "@/lib/signedImageUrls";

type SignedImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src?: string | null | undefined;
  fallbackSrc?: string;
};

export function SignedImage({ src, fallbackSrc = "/placeholder.svg", onError, style, ...props }: SignedImageProps) {
  const needsSigning = isProductBucketUrl(src);
  const [currentSrc, setCurrentSrc] = useState(needsSigning ? "" : src || fallbackSrc);
  const [triedSignedFallback, setTriedSignedFallback] = useState(false);

  useEffect(() => {
    let active = true;
    const signing = isProductBucketUrl(src);
    // Avoid rendering the unsigned (always-broken) private-bucket URL first —
    // that causes a broken-image flash on first paint (e.g. hero slider).
    setCurrentSrc(signing ? "" : src || fallbackSrc);
    setTriedSignedFallback(signing);

    if (signing) {
      getSignedImageUrl(src).then((signed) => {
        if (!active) return;
        setCurrentSrc(signed || fallbackSrc);
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
      {...(currentSrc ? { src: currentSrc } : {})}
      style={currentSrc ? style : { ...style, opacity: 0 }}
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
