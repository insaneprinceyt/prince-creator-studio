import fs from 'node:fs/promises';
import path from 'node:path';
import {pipeline} from 'node:stream/promises';
import {createWriteStream} from 'node:fs';
import {randomUUID} from 'node:crypto';
import tar from 'tar-stream';
import {config} from './config.js';
import {managedContainer} from './provision.js';
const MAX_FILE=2*1024*1024;
function safePath(serverId,file){
  if(typeof file!=='string'||!file||file.includes('\\')||file.startsWith('/')||file.split('/').some(x=>x==='..'||x==='.'||!x))
    throw Object.assign(new Error('Invalid path'),{status:400});
  return path.join(config.dataDir,serverId,file);
}
async function realFile(serverId,file){
  const root=await fs.realpath(path.join(config.dataDir,serverId));
  const target=safePath(serverId,file);
  const real=await fs.realpath(target);
  if(!real.startsWith(root+path.sep))throw Object.assign(new Error('Path outside server'),{status:403});
  return real;
}
export function attachFeatures(app,{docker,db,findOwned,adminOnly}){
  app.get('/api/servers/:id/logs',findOwned,async(req,res,next)=>{
    try{
      const c=await managedContainer(docker,req.params.id,req.serverRecord);
      const stream=await c.logs({stdout:true,stderr:true,tail:100,follow:false});
      let data='';
      for await(const chunk of stream){data+=chunk.toString('utf8');if(data.length>131072)break;}
      res.json({logs:data.slice(-131072)});
    }catch(next){}
  });
  app.get('/api/servers/:id/files',findOwned,async(req,res,next)=>{
    try{
      const root=await fs.realpath(path.join(config.dataDir,req.params.id));
      const entries=await fs.readdir(root,{withFileTypes:true});
      res.json({files:entries.filter(e=>!e.isSymbolicLink()).slice(0,200).map(e=>({name:e.name,type:e.isDirectory()?'directory':'file'}))});
    }catch(next){}
  });
  app.get('/api/servers/:id/files/content',findOwned,async(req,res,next)=>{
    try{
      const target=await realFile(req.params.id,req.query.path);
      const stat=await fs.stat(target);
      if(!stat.isFile()||stat.size>MAX_FILE)return res.status(413).json({error:'File too large or not a file'});
      res.type('text/plain').send(await fs.readFile(target,'utf8'));
    }catch(next){}
  });
  app.put('/api/servers/:id/files/content',findOwned,async(req,res,next)=>{
    try{
      const target=await realFile(req.params.id,req.body?.path);
      const stat=await fs.stat(target);
      if(!stat.isFile()||stat.size>MAX_FILE||typeof req.body?.content!=='string'||Buffer.byteLength(req.body.content)>MAX_FILE)
        return res.status(413).json({error:'Invalid or oversized file'});
      await fs.writeFile(target,req.body.content,{flag:'w'});
      res.json({ok:true});
    }catch(next){}
  });
  app.post('/api/servers/:id/backups',findOwned,async(req,res,next)=>{
    try{
      const c=await managedContainer(docker,req.params.id,req.serverRecord);
      const info=await c.inspect();
      if(info.State?.Running)return res.status(409).json({error:'Stop server before backup to ensure consistency'});
      await fs.mkdir(path.join(config.backupDir,req.params.id),{recursive:true,mode:0o700});
      const backupId=randomUUID(),dest=path.join(config.backupDir,req.params.id,backupId+'.tar');
      const archive=await c.getArchive({path:'/data'});
      await pipeline(archive,createWriteStream(dest,{flags:'wx',mode:0o600}));
      await db.collection('backups').doc(backupId).set({ownerUid:req.serverRecord.ownerUid,serverId:req.params.id,path:dest,createdAt:new Date()});
      res.status(201).json({id:backupId,status:'created'});
    }catch(next){}
  });
  app.get('/api/servers/:id/backups',findOwned,async(req,res,next)=>{
    try{
      const snap=await db.collection('backups').where('serverId','==',req.params.id).limit(50).get();
      res.json({backups:snap.docs.map(d=>({id:d.id,createdAt:d.data().createdAt}))});
    }catch(next){}
  });
  app.post('/api/servers/:id/backups/:backupId/restore',findOwned,async(req,res,next)=>{
    try{
      const snap=await db.collection('backups').doc(req.params.backupId).get();
      if(!snap.exists||snap.data().serverId!==req.params.id)return res.status(404).json({error:'Backup not found'});
      const c=await managedContainer(docker,req.params.id,req.serverRecord);
      const info=await c.inspect();
      if(info.State?.Running)return res.status(409).json({error:'Stop server before restore'});
      // Restoring into an existing volume may leave newer files; full replacement requires a separate validated restore worker.
      return res.status(501).json({error:'Restore worker not deployed. Backup archive is preserved.'});
    }catch(next){}
  });
}
