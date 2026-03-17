import type { ScrapeResult } from "./scraper.js";

export async function sendDiscordNotification(
  webhookUrl: string,
  result: ScrapeResult,
  productUrl: string
): Promise<void> {
  const payload = {
    content: "**BTS Light Stick Ver.4 is back in stock!**",
    embeds: [
      {
        title: result.productName,
        description: `Price: **${result.price}**\n[Open product page](${productUrl})`,
        url: productUrl,
        color: 0x55b4d4,
        footer: { text: "Weverse Shop Stock Monitor" },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Discord webhook failed (${res.status}): ${text}`);
  }
}
