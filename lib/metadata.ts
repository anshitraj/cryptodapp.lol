import * as cheerio from "cheerio";

export type SiteMetadata = {
  title: string | null;
  description: string | null;
  imageUrl: string | null;
};

const EMPTY: SiteMetadata = { title: null, description: null, imageUrl: null };

// Scrapes Open Graph / Twitter Card / favicon metadata from a submitted URL
// so listings don't have to be filled in by hand — this is the same
// "auto bio + icon" behavior every outbid.lol-style site has. Best-effort:
// any failure (unreachable site, no meta tags) just falls back to nulls.
export async function fetchSiteMetadata(url: string): Promise<SiteMetadata> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; BidYourDappBot/1.0; +https://cryptodapp.lol)" },
      signal: AbortSignal.timeout(8000),
      redirect: "follow",
    });
    if (!res.ok) return EMPTY;

    const html = await res.text();
    const $ = cheerio.load(html);

    const title =
      $('meta[property="og:title"]').attr("content") ||
      $('meta[name="twitter:title"]').attr("content") ||
      $("title").first().text() ||
      null;

    const description =
      $('meta[property="og:description"]').attr("content") ||
      $('meta[name="description"]').attr("content") ||
      $('meta[name="twitter:description"]').attr("content") ||
      null;

    let imageUrl =
      $('meta[property="og:image"]').attr("content") ||
      $('meta[name="twitter:image"]').attr("content") ||
      $('link[rel="icon"]').attr("href") ||
      $('link[rel="shortcut icon"]').attr("href") ||
      null;

    if (imageUrl) {
      try {
        imageUrl = new URL(imageUrl, res.url).toString();
      } catch {
        imageUrl = null;
      }
    }
    if (!imageUrl) {
      // Last-resort guess at the conventional favicon path.
      imageUrl = new URL("/favicon.ico", res.url).toString();
    }

    return {
      title: title?.trim().slice(0, 200) || null,
      description: description?.trim().slice(0, 300) || null,
      imageUrl,
    };
  } catch {
    return EMPTY;
  }
}
