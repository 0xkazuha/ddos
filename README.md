# DDoS Testing Lab

Express.js monitoring server with CLI attack tool.

## Structure

```
server/     - Monitoring server with APIs
attack/     - Attack scripts
  cli.js    - CLI tool with arguments (main)
  load-test-simple.js - Simple attack script
logs/       - Exported logs
```

## Usage

### Start Server (Terminal 1)
```bash
npm run server
```

### Launch Attack (Terminal 2)

**Default attack (localhost, 100 workers, 60s):**
```bash
npm run attack
```

**With custom arguments:**
```bash
npm run attack -- --target http://localhost:3000 --workers 50 --duration 30 --delay 10
```

**Or directly:**
```bash
node attack/cli.js -t http://localhost:3000 -w 200 -d 60 --delay 5
```

### Arguments

- `-t, --target <url>`       Target URL (default: http://localhost:3000)
- `-w, --workers <num>`      Number of concurrent workers (default: 100)
- `-d, --duration <sec>`     Duration in seconds (default: 60)
- `--delay <ms>`             Delay between requests in ms (default: 10)
- `-h, --help`               Show help message

### Examples

```bash
# Attack localhost with 50 workers for 30 seconds
npm run attack -- -w 50 -d 30

# Attack custom target with 200 workers
npm run attack -- -t http://example.com -w 200 -d 120

# Low intensity attack
npm run attack -- -w 10 -d 10 --delay 100

# High intensity attack
npm run attack -- -w 500 -d 60 --delay 1
```

## API Endpoints

- `GET /api/stats` - Real-time stats (requests, IPs, RPS, data transfer)
- `GET /api/logs` - Request logs (params: `limit`, `offset`, `ip`, `method`)
- `GET /api/logs/export` - Export logs to JSON file
- `POST /api/stats/reset` - Reset statistics

## Metrics

**Per Request:** IP, method, path, user-agent, request/response size, response time, headers

**Aggregated:** Total requests, unique IPs, requests by IP/endpoint, data transfer, RPS

## Note

Local testing only. Do not target external servers.
