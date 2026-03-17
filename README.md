# BTS Light Stick Stock Monitor

Monitors the Weverse Shop product page for **BTS OFFICIAL LIGHT STICK VER.4** and sends a Discord notification when it’s back in stock.

## Setup

1. **Copy the example env file**

   ```bash
   cp .env.example .env
   ```

2. **Add your Discord webhook URL**

   - In Discord, open the server and channel where you want notifications.
   - Go to **Channel settings** (gear icon) → **Integrations** → **Webhooks** → **New Webhook**.
   - Name it (e.g. “Weverse Stock”), copy the **Webhook URL**.
   - Paste that URL into `.env` as the value of `DISCORD_WEBHOOK_URL`:

   ```env
   DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/123456789/abcdef...
   ```

3. **(Optional)** Adjust in `.env`:

   - `CHECK_INTERVAL_MINUTES` – how often to check (default: 5).
   - `PRODUCT_URL` – product page URL (default is the BTS Light Stick Ver.4 USD page).

## Run

- **Continuous monitoring** (checks immediately, then every N minutes):

  ```bash
  npm start
  ```

- **Single check** (no interval, exits after one run):

  ```bash
  npm run check
  ```

Requires Node.js 18+.

---

## Running on Docker (Portainer / Open Media Vault)

You can run the monitor as a Docker container on your home server so it keeps running 24/7.

### Prerequisites

- Docker (and Docker Compose) on your server. On Open Media Vault this is often under **Services** or via the **omv-extras** plugin.
- Portainer installed (e.g. as a Docker container) so you can manage containers from the web UI.

---

### Step 1: Get the project on your server

SSH into your server (or use the OMV shell) and put the project in a folder Docker can use, for example `/srv/scraperbts`:

**If you use git:**

```bash
cd /srv
git clone <your-repo-url> scraperbts
cd scraperbts
```

**If you don’t use git:** copy the whole project folder onto the server (e.g. with SCP, SFTP, or a shared folder). It must include at least: `Dockerfile`, `docker-compose.yml`, `package.json`, `package-lock.json`, `tsconfig.json`, and the `src/` directory.

---

### Step 2: Create the `.env` file

In the same folder as `docker-compose.yml`:

```bash
cd /srv/scraperbts   # or your project path
cp .env.example .env
nano .env
```

Set your Discord webhook URL (and optionally the other variables):

```env
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_ID/YOUR_TOKEN
```

Save and exit (in nano: Ctrl+O, Enter, Ctrl+X).

---

### Step 3: Run with Docker

**From the command line (e.g. SSH):**

```bash
cd /srv/scraperbts
docker compose up -d --build
```

The first run will build the image (may take a minute), then start the container. It will restart automatically after a server reboot.

**From Portainer:**

1. Go to **Stacks** → **Add stack**.
2. Name it (e.g. `scraperbts`).
3. If your Portainer can use a path on the host:
   - Choose **Load from file** or **Path** and set the path to the project folder (e.g. `/srv/scraperbts` or `/srv/scraperbts/docker-compose.yml`).
   - Click **Deploy the stack**.
4. If Portainer only has a “Web editor” and no host path:
   - Build the image first via SSH: `cd /srv/scraperbts && docker build -t bts-lightstick-monitor:latest .`
   - In Portainer go to **Containers** → **Add container**.
   - **Image**: `bts-lightstick-monitor:latest`.
   - **Name**: `bts-lightstick-monitor`.
   - **Restart policy**: Unless stopped.
   - Under **Env**, add: name `DISCORD_WEBHOOK_URL`, value your webhook URL. Add `CHECK_INTERVAL_MINUTES` or `PRODUCT_URL` only if you use custom values.
   - Deploy the container.

---

### Step 4: Check that it’s running

- **Command line:** `docker logs bts-lightstick-monitor`
- **Portainer:** **Containers** → click `bts-lightstick-monitor` → **Logs**

You should see lines like:

`[date time] Checked: SOLD OUT — BTS OFFICIAL LIGHT STICK VER.4 (USD $35.05)`

---

### Optional: change check interval or product URL

Edit `.env` (if you use `docker compose` or a stack with `env_file`) or the container’s environment in Portainer:

- `CHECK_INTERVAL_MINUTES=10` — check every 10 minutes
- `PRODUCT_URL=https://shop.weverse.io/...` — different product page

Then restart: `docker compose restart` or restart the container in Portainer.
