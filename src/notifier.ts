import type { ScrapeResult } from "./scraper.js";

async function postDiscordWebhook(
  webhookUrl: string,
  payload: Record<string, unknown>
): Promise<void> {
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

export async function sendDiscordPlainMessage(
  webhookUrl: string,
  content: string
): Promise<void> {
  await postDiscordWebhook(webhookUrl, { content });
}

export async function sendDiscordNotification(
  webhookUrl: string,
  result: ScrapeResult,
  productUrl: string
): Promise<void> {
  await postDiscordWebhook(webhookUrl, {
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
  });
}
