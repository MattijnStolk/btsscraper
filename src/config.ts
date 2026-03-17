import "dotenv/config";

const DEFAULT_PRODUCT_URL =
  "https://shop.weverse.io/en/shop/USD/artists/2/sales/54189";
const DEFAULT_CHECK_INTERVAL_MINUTES = 5;

export interface Config {
  discordWebhookUrl: string;
  checkIntervalMinutes: number;
  productUrl: string;
}

function getEnv(name: string, defaultValue?: string): string {
  const value = process.env[name] ?? defaultValue;
  if (value === undefined || value === "") {
    throw new Error(
      `Missing required environment variable: ${name}. Add it to your .env file.`
    );
  }
  return value.trim();
}

export function loadConfig(): Config {
  const discordWebhookUrl = getEnv("DISCORD_WEBHOOK_URL");
  const checkIntervalMinutes = parseInt(
    getEnv("CHECK_INTERVAL_MINUTES", String(DEFAULT_CHECK_INTERVAL_MINUTES)),
    10
  );
  const productUrl = getEnv("PRODUCT_URL", DEFAULT_PRODUCT_URL);

  if (isNaN(checkIntervalMinutes) || checkIntervalMinutes < 1) {
    throw new Error(
      "CHECK_INTERVAL_MINUTES must be a positive number (e.g. 5)"
    );
  }

  try {
    new URL(discordWebhookUrl);
  } catch {
    throw new Error(
      "DISCORD_WEBHOOK_URL must be a valid URL (starts with https://discord.com/api/webhooks/...)"
    );
  }

  try {
    new URL(productUrl);
  } catch {
    throw new Error("PRODUCT_URL must be a valid URL");
  }

  return {
    discordWebhookUrl,
    checkIntervalMinutes,
    productUrl,
  };
}
