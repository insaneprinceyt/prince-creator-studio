import fs from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {config,plans,safeId} from './config.js';
const label='prince-cloud.managed';
export async function provision({docker,db,ownerUid,plan,name}){
  if(!plans[plan]||plans[plan]>config.ramLimitMb)throw Object.assign(new Error('Plan unavailable'),{status:400});
  const existing=await db.collection('servers').where('ownerUid','==',ownerUid).get();
  if(existing.size>=config.maxServers)throw Object.assign(new Error('Server quota reached'),{status:409});
  const serverId=randomUUID(),dir=path.join(config.dataDir,serverId);
  const containers=await docker.listContainers({all:true,filters:{label:[label+'=true']}});
  const used=new Set(containers.flatMap(c=>Object.keys(c.Ports||{}).map(Number)));
  const allocated=new Set((await db.collection('servers').get()).docs.map(d=>d.data().port));
  let port;
  for(let p=config.portStart;p<=config.portEnd;p++){
    if(!allocated.has(p)){port=p;break;}
  }
  if(!port)throw Object.assign(new Error('No ports available'),{status:503});
  await fs.mkdir(dir,{recursive:true,mode:0o700});
  const ref=db.collection('servers').doc(serverId);
  // Reservation is written before container creation; production multi-node deployments need transactional allocation.
  await ref.set({ownerUid,plan,name:String(name||'Minecraft Server').slice(0,48),ramMb:plans[plan],port,status:'provisioning',createdAt:new Date()});
  try{
    const c=await docker.createContainer({
      Image:config.image,Env:['EULA=TRUE','TYPE=PAPER','ONLINE_MODE=TRUE','MEMORY='+plans[plan]+'M'],
      Labels:{[label]:'true','prince-cloud.server-id':serverId},
      ExposedPorts:{'25565/tcp':{}},
      HostConfig:{Binds:[dir+':/data'],Memory:plans[plan]*1024*1024,NanoCpus:1000000000,
        PortBindings:{'25565/tcp':[{HostPort:String(port),HostIp:'0.0.0.0'}]},
        RestartPolicy:{Name:'unless-stopped'},SecurityOpt:['no-new-privileges:true'],CapDrop:['ALL'],PidsLimit:256}
    });
    await ref.update({containerId:c.id,status:'stopped'});
    return {id:serverId,port,ramMb:plans[plan],status:'stopped'};
  }catch(err){await ref.update({status:'failed',error:'Provisioning failed'});throw err;}
}
export async function managedContainer(docker,id,record){
  if(!safeId.test(id)||!record?.containerId)throw Object.assign(new Error('Invalid server'),{status:400});
  const c=docker.getContainer(record.containerId),info=await c.inspect();
  if(info.Config?.Labels?.[label]!=='true'||info.Config?.Labels?.['prince-cloud.server-id']!==id)
    throw Object.assign(new Error('Container label mismatch'),{status:403});
  return c;
}
