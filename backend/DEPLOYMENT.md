# VPS deployment and networking

This is a VPS deployment blueprint, not a running deployment. No GitHub-hosted VPS exists.

1. Provision a dedicated Linux VPS with a public IP, Docker Engine, sufficient RAM/disk, and provider approval for Minecraft hosting.
2. Install Docker and Compose, Node.js 22 if not using Compose, and a TLS reverse proxy.
3. Clone the repo, enter backend/, create .env from .env.example, and configure Firebase credentials outside the repository.
4. Choose a fixed, reviewed Minecraft image (pin its digest), configure a dedicated DATA_DIR and BACKUP_DIR, and set RAM and port limits.
5. Run docker compose up -d --build from backend/ only after checking the Compose mounts and privileges.
6. Proxy HTTPS api.your-domain.example to 127.0.0.1:8080. Keep Docker socket and API backend private; expose only 443 and allocated Minecraft TCP ports.
7. Add an A record for the Minecraft host and optionally an SRV record for nonstandard Java ports.
8. Add server provisioning integration to the frontend, authenticate API calls using Firebase ID tokens, and test per-user authorization.
9. Implement billing webhook verification and restore worker before enabling billing or claiming fully automated service.
10. Validate resource quotas, port allocation concurrency, firewall rules, EULA acceptance, node health, and backup recovery before public launch.

The repository includes CI syntax validation, not automatic production deployment. Do not store SSH keys, Firebase service accounts, Docker socket endpoints, or payment secrets in GitHub files.
