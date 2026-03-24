import { loadConfig } from "./config.js";
import { checkStock } from "./scraper.js";
import {
  sendDiscordNotification,
  sendDiscordPlainMessage,
} from "./notifier.js";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function formatTimestamp(): string {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}

interface WeeklyAvailability {
  hadInStock: boolean;
  firstSeen: Date | null;
  lastSeen: Date | null;
}

function createWeeklyAvailability(): WeeklyAvailability {
  return { hadInStock: false, firstSeen: null, lastSeen: null };
}

function recordInStockForWeek(weekly: WeeklyAvailability, at: Date): void {
  if (!weekly.hadInStock) {
    weekly.firstSeen = at;
    weekly.hadInStock = true;
  }
  weekly.lastSeen = at;
}

async function sendStartupWebhookPing(
  webhookUrl: string,
  productUrl: string
): Promise<void> {
  try {
    await sendDiscordPlainMessage(
      webhookUrl,
      `**Stock monitor started** — webhook OK.\nWatching: ${productUrl}`
    );
    console.log(`[${formatTimestamp()}] Startup webhook ping sent.`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[${formatTimestamp()}] Startup webhook ping failed: ${message}`);
  }
}

async function sendWeeklySummary(
  webhookUrl: string,
  productUrl: string,
  weekly: WeeklyAvailability
): Promise<void> {
  const hadInStock = weekly.hadInStock;
  const firstSeen = weekly.firstSeen;
  const lastSeen = weekly.lastSeen;

  weekly.hadInStock = false;
  weekly.firstSeen = null;
  weekly.lastSeen = null;

  let content: string;
  if (!hadInStock || !firstSeen || !lastSeen) {
    content =
      `**Weekly summary**\n**Site:** ${productUrl}\nNothing was in stock this week (always sold out).`;
  } else {
    const first = firstSeen.toISOString();
    const last = lastSeen.toISOString();
    const timeLine =
      first === last
        ? `Something was **not** sold out at **${first}** (UTC).`
        : `Something was **not** sold out between **${first}** and **${last}** (UTC).`;
    content = `**Weekly summary**\n**Site:** ${productUrl}\n${timeLine}`;
  }

  try {
    await sendDiscordPlainMessage(webhookUrl, content);
    console.log(`[${formatTimestamp()}] Weekly summary sent.`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[${formatTimestamp()}] Weekly summary failed: ${message}`);
  }
}

async function runCheck(
  productUrl: string,
  webhookUrl: string,
  lastWasInStock: { value: boolean | null },
  weekly: WeeklyAvailability
): Promise<void> {
  try {
    const result = await checkStock(productUrl);
    const status = result.inStock ? "IN STOCK" : "SOLD OUT";
    console.log(`[${formatTimestamp()}] Checked: ${status} — ${result.productName} (${result.price})`);

    if (result.inStock) {
      recordInStockForWeek(weekly, new Date());
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
  const weeklyAvailability = createWeeklyAvailability();

  console.log(`[${formatTimestamp()}] Starting BTS Light Stick stock monitor.`);
  console.log(`[${formatTimestamp()}] Product URL: ${config.productUrl}`);
  console.log(`[${formatTimestamp()}] Check interval: ${config.checkIntervalMinutes} minute(s).`);

  await sendStartupWebhookPing(config.discordWebhookUrl, config.productUrl);

  await runCheck(
    config.productUrl,
    config.discordWebhookUrl,
    lastWasInStock,
    weeklyAvailability
  );

  if (runOnce) {
    console.log(`[${formatTimestamp()}] Single check done. Exiting.`);
    process.exit(0);
  }

  const intervalMs = config.checkIntervalMinutes * 60 * 1000;
  setInterval(() => {
    void runCheck(
      config.productUrl,
      config.discordWebhookUrl,
      lastWasInStock,
      weeklyAvailability
    );
  }, intervalMs);

  setInterval(() => {
    void sendWeeklySummary(
      config.discordWebhookUrl,
      config.productUrl,
      weeklyAvailability
    );
  }, WEEK_MS);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
