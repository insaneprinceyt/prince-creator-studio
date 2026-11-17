import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import Docker from 'dockerode';
import admin from 'firebase-admin';
import {provision,managedContainer} from './provision.js';
import {attachFeatures} from './features.js';
import {attachBilling} from './billing.js';

const app=express();
const port=Number(process.env.PORT||8080);
const origin=process.env.ALLOWED_ORIGIN;
if(!origin)throw new Error('Set ALLOWED_ORIGIN to your exact HTTPS website origin');
if(!process.env.GOOGLE_APPLICATION_CREDENTIALS)throw new Error('Set GOOGLE_APPLICATION_CREDENTIALS to a private Firebase service-account JSON path');
admin.initializeApp({credential:admin.credential.applicationDefault()});
const db=admin.firestore();
const docker=new Docker({socketPath:process.env.DOCKER_SOCKET||'/var/run/docker.sock'});
const nodeSecret=process.env.MC_NODE_SECRET;
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({origin,methods:['GET','POST'],allowedHeaders:['Authorization','Content-Type']}));
app.use(express.json({limit:'2mb'}));
app.use(rateLimit({windowMs:60000,limit:60,standardHeaders:'draft-7',legacyHeaders:false}));
app.get('/api/health',(_req,res)=>res.json({service:'Prince Cloud V2',api:'online',minecraftNode:'check /api/node/status'}));
async function authenticate(req,res,next){
  const match=/^Bearer (.+)$/.exec(req.get('Authorization')||'');
  if(!match)return res.status(401).json({error:'Authentication required'});
  try{req.user=await admin.auth().verifyIdToken(match[1],true);next();}
  catch{return res.status(401).json({error:'Invalid authentication token'});}
}
attachBilling(app,{authenticate});
app.use('/api',authenticate);
async function adminOnly(req,res,next){
  try{
    const snap=await db.collection('admins').doc(req.user.uid).get();
    if(snap.exists&&snap.data()?.enabled===true)return next();
    return res.status(403).json({error:'Administrator required'});
  }catch(next){}
}
const allowedActions=new Set(['start','stop','restart']);
const safeId=/^[a-zA-Z0-9_-]{1,80}$/;
async function findOwned(req,res,next){
  if(!safeId.test(req.params.id||''))return res.status(400).json({error:'Invalid server ID'});
  try{
    const snap=await db.collection('servers').doc(req.params.id).get();
    if(!snap.exists)return res.status(404).json({error:'Server not found'});
    if(snap.data().ownerUid!==req.user.uid){
      const adminSnap=await db.collection('admins').doc(req.user.uid).get();
      if(adminSnap.data()?.enabled!==true)return res.status(403).json({error:'Not authorized'});
    }
    req.serverRecord=snap.data();next();
  }catch(next){}
}
app.get('/api/servers',async(req,res,next)=>{
  try{
    const snap=await db.collection('servers').where('ownerUid','==',req.user.uid).limit(50).get();
    res.json({servers:snap.docs.map(d=>({id:d.id,name:d.data().name||'Minecraft Server',status:d.data().status||'unknown',ramMb:d.data().ramMb||0}))});
  }catch(next){}
});
app.get('/api/node/status',adminOnly,async(_req,res)=>{
  try{await docker.ping();res.json({docker:'connected'});}
  catch{res.status(503).json({docker:'unavailable'});}
});
app.post('/api/servers/:id/actions',findOwned,async(req,res,next)=>{
  const action=req.body?.action;
  if(!allowedActions.has(action))return res.status(400).json({error:'Unsupported action'});
  const containerId=req.serverRecord.containerId;
  if(typeof containerId!=='string'||!safeId.test(containerId))return res.status(409).json({error:'No valid container linked'});
  try{
    const container=docker.getContainer(containerId);
    const info=await container.inspect();
    if(info.Config?.Labels?.['prince-cloud.managed']!=='true'||info.Config?.Labels?.['prince-cloud.server-id']!==req.params.id)
      return res.status(403).json({error:'Container ownership labels mismatch'});
    if(action==='start')await container.start();
    if(action==='stop')await container.stop({t:15});
    if(action==='restart')await container.restart({t:15});
    res.json({ok:true,action,serverId:req.params.id});
  }catch(err){
    if(err.statusCode===304||err.statusCode===409)return res.status(409).json({error:'Server already in requested state'});
    next(err);
  }
});
app.post('/api/admin/provision',adminOnly,async(req,res,next)=>{
  try{
    const {ownerUid,plan,name}=req.body||{};
    if(typeof ownerUid!=='string'||!safeId.test(ownerUid))return res.status(400).json({error:'Invalid owner'});
    const user=await admin.auth().getUser(ownerUid);
    const result=await provision({docker,db,ownerUid:user.uid,plan,name});
    res.status(201).json(result);
  }catch(next){}
});
attachFeatures(app,{docker,db,findOwned,adminOnly});
app.get('/api/admin/requests',adminOnly,async(_req,res,next)=>{
  try{
    const snap=await db.collection('hostingRequests').limit(100).get();
    res.json({requests:snap.docs.map(d=>({id:d.id,...d.data()}))});
  }catch(next){}
});
app.use((err,_req,res,_next)=>{console.error(err);res.status(err.status||500).json({error:err.status&&err.status<500?err.message:'Server operation failed'});});
app.listen(port,'127.0.0.1',()=>console.log('Prince Cloud API listening on localhost:'+port));
