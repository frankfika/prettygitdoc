import ArticleClient from "./client";

// Generate static params for static export
// Return a fallback route for client-side routing
export function generateStaticParams() {
  return [{ slug: ["_fallback"] }];
}

export default function ArticlePage({ params }: { params: { slug?: string[] } }) {
  const id = Array.isArray(params?.slug)
    ? params.slug.join('/')
    : params?.slug || '';

  return <ArticleClient id={id} />;
}
