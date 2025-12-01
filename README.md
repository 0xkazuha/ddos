# DDoS Testing Lab

Express.js monitoring server with CLI attack tool.

## Quick Start

```bash
# Terminal 1 - Start server
npm run server

# Terminal 2 - Check network access
npm run check

# Terminal 3 - Run attack
npm run attack
```

## Network Access

**Server is accessible at:**
- Local: `http://localhost:3000`
- Network: `http://192.168.1.6:3000` (run `npm run check` to see your IP)

**From another device (phone/tablet/PC):**
1. Connect to same WiFi network
2. Run `npm run check` on server to get IP
3. Open `http://YOUR_IP:3000` on the device

**If connection fails:**
```bash
# Allow port through firewall
sudo ufw allow 3000

# Verify server is listening on all interfaces
ss -tulpn | grep :3000
```

## Attack Tool Arguments

- `-t, --target <url>` - Target URL (default: http://localhost:3000)
- `-w, --workers <num>` - Concurrent workers (default: 100)
- `-d, --duration <sec>` - Duration in seconds (default: 60)
- `--delay <ms>` - Delay between requests (default: 10)
- `-h, --help` - Show help

## Examples

```bash
# Default attack
npm run attack

# Custom workers and duration
npm run attack -- -w 50 -d 30

# Attack with low intensity
npm run attack -- -w 10 --delay 100

# High intensity attack
npm run attack -- -w 500 -d 60 --delay 1

# Attack from network
npm run attack -- -t http://192.168.1.6:3000 -w 200
```

## API Endpoints

- `GET /api/stats` - Real-time stats
- `GET /api/logs` - Request logs (params: limit, offset, ip, method)
- `GET /api/logs/export` - Export logs to JSON
- `POST /api/stats/reset` - Reset statistics

## Monitoring

Access these URLs in browser or curl:
```bash
curl http://localhost:3000/api/stats
curl http://192.168.1.6:3000/api/logs?limit=50
```

## Scripts

- `npm run server` - Start monitoring server
- `npm run attack` - Launch attack CLI
- `npm run check` - Show network URLs

## Note

For local testing only. Do not target unauthorized servers.
