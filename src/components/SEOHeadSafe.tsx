import { SEOHead } from "@/components/SEOHead";

/** Placeholder if SEOHead or its props are problematic in some contexts */
export const SEOHeadSafe = (props: any) => {
  const safeProps = { ...props };
  if (safeProps.canonical === undefined) delete safeProps.canonical;
  if (safeProps.ogImage === undefined) delete safeProps.ogImage;
  if (safeProps.keywords === undefined) delete safeProps.keywords;
  if (safeProps.jsonLd === undefined) delete safeProps.jsonLd;
  return <SEOHead {...safeProps} />;
};
