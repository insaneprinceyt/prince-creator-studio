# Prince Cloud Hosting V2

Mobile-friendly **frontend prototype** for a Minecraft hosting control panel. Original UI inspired by common Minecraft hosting dashboard patterns.

## Current status
- GitHub Pages-ready static site (HTML, CSS, JavaScript).
- Dashboard, servers, console, file manager, backups, hosting plans, login preview, and admin panel preview.
- **No real server control, sign-in, billing, provisioning, backup or administration is implemented.** All unavailable controls are disabled and clearly labelled.
- No API keys, Firebase credentials, payment credentials, or secrets are stored in the frontend.

## Publish on GitHub Pages
Repository → Settings → Pages → Deploy from a branch → `main` → `/(root)` → Save.

## Backend architecture for real hosting
```
Android browser
    |
    v
HTTPS web app (static UI; later API client)
    |
    v
HTTPS API + authenticated WebSocket gateway (Linux VPS)
    |-- Identity provider (Firebase Auth or other) and server-side token verification
    |-- Database: users, roles, servers, quotas, audit logs
    |-- Provisioning worker / job queue
    |-- Per-server authorization and rate limits
    |
    v
Minecraft node agent (private, authenticated network)
    |-- Docker Engine on real Linux host
    |-- Isolated per-server containers and resource quotas
    |-- Server-scoped console, file API, backup jobs
    v
Minecraft Java / Bedrock servers
```

### Implementation phases
1. **VPS:** Obtain an actual Linux VPS with adequate RAM, CPU, disk, public IP, and provider permission for game hosting. Android PRoot is useful for development but not a substitute for a Docker-capable VPS.
2. **DNS + TLS:** Configure a hostname, HTTPS reverse proxy and firewall. Expose only required public services and Minecraft ports.
3. **Auth:** Integrate Firebase Authentication or an equivalent provider. Verify tokens and admin claims **on the backend**. Never trust a client-side admin flag.
4. **Database:** Store users, server ownership, allocations, node IDs, lifecycle status, quotas and audit trails. Enforce authorization for every request.
5. **Node agent:** Install Docker on the VPS; connect a private authenticated agent that provisions Minecraft server containers with CPU/RAM/disk limits and isolated file paths.
6. **Control API:** Implement authenticated start/stop/restart, server-scoped file management, logs via authenticated WebSockets, backup/restore and job status.
7. **Safety:** Restrict console and file access by ownership; avoid exposing Docker socket to the web; validate all paths; apply rate limits, resource quotas, secret management, audit logs and regular updates.
8. **Frontend integration:** Replace disabled demo actions with real API calls and server-driven state. Do not expose VPS tokens or privileged secrets in GitHub Pages.
9. **Testing:** Verify owner/admin permissions, isolation, backups and restores, server resource limits, recovery and error handling before offering public hosting.

### Suggested API routes (not yet implemented)
- `GET /api/servers`
- `POST /api/servers` (admin or approved quota only)
- `POST /api/servers/:id/actions` (start, stop, restart)
- `GET /api/servers/:id/files`
- `POST /api/servers/:id/backups`
- `GET /api/admin/nodes` (admin only)
- `GET /api/servers/:id/console/ws` (authenticated WebSocket upgrade)

**Important:** GitHub Pages cannot run Minecraft servers, backend APIs, or Docker. Real hosting requires separate infrastructure and ongoing costs.
