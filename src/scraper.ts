import * as cheerio from "cheerio";

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export interface ScrapeResult {
  inStock: boolean;
  productName: string;
  price: string;
  rawHtml?: string;
}

function parseWithCheerio(html: string): ScrapeResult | null {
  try {
    const $ = cheerio.load(html);
    const text = $("body").text();
    const normalizedText = text.replace(/\s+/g, " ").trim();
    const soldOut = normalizedText.includes("SOLD OUT");

    let productName = "BTS OFFICIAL LIGHT STICK VER.4";
    const nameMatch = normalizedText.match(/BTS OFFICIAL LIGHT STICK VER\.?4/i);
    if (nameMatch) {
      productName = nameMatch[0];
    }

    let price = "";
    const priceMatch = normalizedText.match(/USD\s*\$?([\d.]+)/i);
    if (priceMatch) {
      price = `USD $${priceMatch[1]}`;
    }

    return {
      inStock: !soldOut,
      productName,
      price: price || "Unknown",
    };
  } catch {
    return null;
  }
}

function fallbackParse(html: string): ScrapeResult {
  const soldOut = html.includes("SOLD OUT");
  return {
    inStock: !soldOut,
    productName: "BTS OFFICIAL LIGHT STICK VER.4",
    price: "Unknown",
  };
}

export async function checkStock(productUrl: string): Promise<ScrapeResult> {
  const res = await fetch(productUrl, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }

  const html = await res.text();
  const parsed = parseWithCheerio(html);
  if (parsed) {
    return parsed;
  }
  return fallbackParse(html);
}
