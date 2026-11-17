# Prince Cloud Hosting V2 — Linux VPS backend

**Status:** Backend source code only. No VPS is connected and no Minecraft server is provisioned by this repository.

## Implemented
- Express API health endpoint
- Firebase ID-token verification on protected routes
- Firestore-backed per-user server listing
- Start/stop/restart of **already provisioned** Docker containers
- Docker container ownership-label checks before control
- Admin-only Docker node status and hosting-request listing
- Rate limiting, strict CORS origin, HTTP security headers

## Not implemented
- Minecraft server provisioning, container creation, or billing
- Console WebSockets, file manager, backups, quotas, or public user onboarding
- Automated deployments, Minecraft networking, or node orchestration

## Linux VPS prerequisites
- Linux VPS with Docker Engine and enough CPU/RAM/disk
- Node.js 20+ and npm
- Firebase service account with least-privilege access, stored outside GitHub
- HTTPS reverse proxy and a trusted process manager
- Firewall and private Docker access

## Local setup on VPS
1. Clone this GitHub repository on the VPS.
2. `cd backend && npm install`
3. Copy `.env.example` to `.env` and configure your exact origin and Firebase credentials. Node does not automatically load `.env`; use a process manager with an environment file or `node --env-file=.env server.js` on Node 20.6+.
4. Start with `npm start` after injecting the environment variables.
5. Test `http://127.0.0.1:8080/api/health` from the VPS.
6. Put an HTTPS reverse proxy in front of port 8080. The API listens on localhost by design.

## Security warnings
- **Never** publish a Docker socket, Docker API port, Firebase service account, or node secret to the internet.
- Running a Docker-controlling API gives the service extensive host privileges. Isolate it and restrict who can administer the VPS.
- The `servers` Firestore collection is intended for trusted backend writes only; clients must not be able to forge `containerId` or `ownerUid`.
- Provisioning must enforce resource limits, quotas, approved images, filesystem isolation, ownership and rate limits before enabling customer server creation.
- This backend does not yet connect to the website's UI. Do not claim start/stop works in the browser until authenticated API integration and a real node are tested.

## Example requests
- `GET /api/health` (public)
- `GET /api/servers` (Firebase Bearer token)
- `POST /api/servers/:id/actions` with JSON `{"action":"start"}` (authorized owner)
- `GET /api/node/status` (admin only)
- `GET /api/admin/requests` (admin only)

This code is a foundation for a real VPS deployment, not a hosted Minecraft service by itself.

## Additional source modules
- `provision.js`: admin-triggered Minecraft container creation with fixed image and resource limits (requires a VPS).
- `features.js`: bounded log reading, limited file read/edit, stopped-server backup archives; restore explicitly returns 501 until implemented.
- `billing.js`: optional checkout-session code; payments disabled without configuration and verified webhook handling.
- `compose.yaml`: VPS-only deployment draft. Review host privileges before use.
- `DEPLOYMENT.md`: networking and deployment checklist.
- GitHub Actions workflow: syntax validation, **not** a live deployment.

**Important limitations:** No VPS is attached; websocket console, full file operations, backup restore, subscription webhook entitlement, automated deployment and multi-node scheduling are not complete. Never represent them as operational.
