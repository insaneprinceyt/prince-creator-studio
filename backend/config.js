export const config={
  port:Number(process.env.PORT||8080),
  origin:process.env.ALLOWED_ORIGIN,
  image:process.env.MC_IMAGE||'itzg/minecraft-server:java21',
  ramLimitMb:Number(process.env.MAX_RAM_MB||8192),
  maxServers:Number(process.env.MAX_SERVERS_PER_USER||2),
  portStart:Number(process.env.MC_PORT_START||25565),
  portEnd:Number(process.env.MC_PORT_END||25665),
  backupDir:process.env.BACKUP_DIR||'/var/lib/prince-cloud/backups',
  dataDir:process.env.DATA_DIR||'/var/lib/prince-cloud/servers'
};
export const plans={Starter:2048,Pro:4096,Elite:8192};
export const safeId=/^[a-zA-Z0-9_-]{1,80}$/;
