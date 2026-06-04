# TheForge Server: Cloudflared Infrastructure & Recovery Guide

This guide details the maintenance, self-healing architecture, and automatic deployment procedures for the Cloudflare Tunnel (`cloudflared`) powering the live environments on **TheForge**.

---

## 💡 System Architecture Note
**TheForge** operates on a legacy macOS environment. Modern `cloudflared` binaries rely on a security symbol introduced in newer macOS frameworks, which causes an immediate `dyld: Symbol not found` runtime crash on older operating systems. 

To maintain system stability, **TheForge explicitly locks its global path binary to Version `2023.7.3`**. Do not run `brew upgrade cloudflared` or overwrite this file with a modern upstream release.

---

## 🛠️ The 5-Second Nuclear Recovery Command

If the tunnel ever drops and `cloudflared --version` throws a `dyld` framework crash, open a terminal window on **TheForge** and paste this entire block to purge the corruption and force-restore the verified legacy binary:

```bash
sudo rm -f /usr/local/bin/cloudflared && mkdir -p /tmp/cf-rescue && cd /tmp/cf-rescue && curl -L "[https://github.com/cloudflare/cloudflared/releases/download/2023.7.3/cloudflared-darwin-amd64.tgz](https://github.com/cloudflare/cloudflared/releases/download/2023.7.3/cloudflared-darwin-amd64.tgz)" -o cf.tgz && tar -xzf cf.tgz && sudo mv cloudflared /usr/local/bin/cloudflared && sudo chmod +x /usr/local/bin/cloudflared && rehash && cloudflared --version
```

## 🚀 Hardening the FloraSync Deployment Script

To prevent the tunnel from being a manual dependency, embed this self-healing block directly into the bottom of the script on **TheForge** that triggers when you sync your local `dist` folder.

This ensures that every time you deploy codebase modifications, the infrastructure checks its own health, automatically repairs itself if a system update broke it, and safely decouples the tunnel process to keep the sites live.

### Append to your post-receive/deploy script:

Bash

```
# ==============================================================================
# CLOUDFLARED INFRASTRUCTURE MONITORING & SELF-HEALING BLOCK
# ==============================================================================

# Ensure cloudflared is running in the background
if pgrep -x "cloudflared" > /dev/null
then
    echo "✅ Cloudflare tunnel is already running."
else
    echo "⚠️ Cloudflare tunnel is down. Checking binary integrity..."
    
    # Quick integrity check to catch dyld framework crashes before launching
    if ! cloudflared --version &>/dev/null; then
        echo "❌ cloudflared binary is broken or incompatible. Executing auto-rescue..."
        sudo rm -f /usr/local/bin/cloudflared
        mkdir -p /tmp/cf-auto && cd /tmp/cf-auto
        curl -sL "[https://github.com/cloudflare/cloudflared/releases/download/2023.7.3/cloudflared-darwin-amd64.tgz](https://github.com/cloudflare/cloudflared/releases/download/2023.7.3/cloudflared-darwin-amd64.tgz)" -o cf.tgz
        tar -xzf cf.tgz && sudo mv cloudflared /usr/local/bin/cloudflared
        sudo chmod +x /usr/local/bin/cloudflared
        rehash
    fi

    echo "🚀 Launching Cloudflare tunnel in the background..."
    # Note: Replace 'YOUR_REVEALED_TOKEN_HERE' with your secure token string
    nohup cloudflared tunnel run --token YOUR_REVEALED_TOKEN_HERE > ~/cloudflared.log 2>&1 &
    
    echo "✅ Tunnel spawned. Logs are routing to ~/cloudflared.log"
fi
# ==============================================================================

```

## 🔐 Finding Your Tunnel Token

If you ever need to re-verify or regenerate your tunnel security token:

1.  Log into the [Cloudflare Zero Trust Dashboard](https://one.dash.cloudflare.com/).
    
2.  Navigate to **Networks** ➡️ **Tunnels** in the left sidebar.
    
3.  Select **Configure** from the context menu (`...`) next to **TheForge-Server**.
    
4.  In the **Connectors** card on the Overview tab, click **Add a connector**.
    
5.  Choose **Mac** to reveal the terminal command box. The raw token string is the long alphanumeric sequence following the `--token` flag.