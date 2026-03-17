import { loadConfig } from "./config.js";
import { checkStock } from "./scraper.js";
import { sendDiscordNotification } from "./notifier.js";

function formatTimestamp(): string {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}

async function runCheck(
  productUrl: string,
  webhookUrl: string,
  lastWasInStock: { value: boolean | null }
): Promise<void> {
  try {
    const result = await checkStock(productUrl);
    const status = result.inStock ? "IN STOCK" : "SOLD OUT";
    console.log(`[${formatTimestamp()}] Checked: ${status} — ${result.productName} (${result.price})`);

    if (result.inStock) {
      if (lastWasInStock.value !== true) {
        await sendDiscordNotification(webhookUrl, result, productUrl);
        console.log(`[${formatTimestamp()}] Discord notification sent.`);
      }
      lastWasInStock.value = true;
    } else {
      lastWasInStock.value = false;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[${formatTimestamp()}] Error: ${message}`);
  }
}

async function main(): Promise<void> {
  const config = loadConfig();
  const runOnce = process.argv.includes("--once");
  const lastWasInStock = { value: null as boolean | null };

  console.log(`[${formatTimestamp()}] Starting BTS Light Stick stock monitor.`);
  console.log(`[${formatTimestamp()}] Product URL: ${config.productUrl}`);
  console.log(`[${formatTimestamp()}] Check interval: ${config.checkIntervalMinutes} minute(s).`);

  await runCheck(config.productUrl, config.discordWebhookUrl, lastWasInStock);

  if (runOnce) {
    console.log(`[${formatTimestamp()}] Single check done. Exiting.`);
    process.exit(0);
  }

  const intervalMs = config.checkIntervalMinutes * 60 * 1000;
  setInterval(() => {
    runCheck(config.productUrl, config.discordWebhookUrl, lastWasInStock);
  }, intervalMs);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
