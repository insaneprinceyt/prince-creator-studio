"use strict";
(()=>{
 const canvas=document.getElementById("skin-3d"),g=canvas.getContext("2d",{alpha:false}),source=()=>window.princeSkinTexture;
 let yaw=.55,pitch=-.12,spin=true,drag=false,lastX=0,lastY=0,dirty=true,lastFrame=0;
 const parts=[
 {cx:0,cy:13,cz:0,w:8,h:8,d:8,uv:[8,0]},
 {cx:0,cy:3,cz:0,w:8,h:12,d:4,uv:[20,16]},
 {cx:-6,cy:3,cz:0,w:4,h:12,d:4,uv:[44,16]},
 {cx:6,cy:3,cz:0,w:4,h:12,d:4,uv:[36,48]},
 {cx:-2,cy:-9,cz:0,w:4,h:12,d:4,uv:[4,16]},
 {cx:2,cy:-9,cz:0,w:4,h:12,d:4,uv:[20,48]}
 ];
 // Each face uses standard Minecraft 64x64 atlas: top, bottom, right, front, left, back.
 function faces(p){const [u,v]=p.uv,w=p.w,h=p.h,d=p.d;
 return [
 {name:"front",rect:[u+d,v+d,w,h],shade:1},
 {name:"back",rect:[u+2*d+w,v+d,w,h],shade:.66},
 {name:"left",rect:[u,v+d,d,h],shade:.78},
 {name:"right",rect:[u+d+w,v+d,d,h],shade:.83},
 {name:"top",rect:[u+d,v,w,d],shade:1.12},
 {name:"bottom",rect:[u+d+w,v,w,d],shade:.58}
 ]}
 const corners=(p,face)=>{
 const x=p.cx,y=p.cy,z=p.cz,X=p.w/2,Y=p.h/2,Z=p.d/2;
 const v={
 front:[[-X,Y,Z],[X,Y,Z],[X,-Y,Z],[-X,-Y,Z]],
 back:[[X,Y,-Z],[-X,Y,-Z],[-X,-Y,-Z],[X,-Y,-Z]],
 left:[[-X,Y,-Z],[-X,Y,Z],[-X,-Y,Z],[-X,-Y,-Z]],
 right:[[X,Y,Z],[X,Y,-Z],[X,-Y,-Z],[X,-Y,Z]],
 top:[[-X,Y,-Z],[X,Y,-Z],[X,Y,Z],[-X,Y,Z]],
 bottom:[[-X,-Y,Z],[X,-Y,Z],[X,-Y,-Z],[-X,-Y,-Z]]
 }[face];
 return v.map(q=>[q[0]+x,q[1]+y,q[2]+z]);
 };
 function transform(v){const co=Math.cos(yaw),si=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);const x=v[0]*co+v[2]*si,z=-v[0]*si+v[2]*co;return [x,v[1]*cp-z*sp,v[1]*sp+z*cp]}
 function project(v){const k=10.2;return [210+v[0]*k,260-v[1]*k]}
 function polygon(points,fill){g.beginPath();g.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)g.lineTo(points[i][0],points[i][1]);g.closePath();g.fillStyle=fill;g.fill()}
 function draw(){
 g.fillStyle="#111427";g.fillRect(0,0,420,540);
 const grad=g.createRadialGradient(210,190,25,210,270,320);grad.addColorStop(0,"#342b5b");grad.addColorStop(1,"#111427");g.fillStyle=grad;g.fillRect(0,0,420,540);
 const texture=source();if(!texture)return;
 const pixels=texture.getContext("2d",{willReadFrequently:true}).getImageData(0,0,64,64).data;
 const queue=[];
 for(const p of parts)for(const f of faces(p)){
  const vertices=corners(p,f.name).map(transform);
  const edge1=vertices[1].map((v,i)=>v-vertices[0][i]),edge2=vertices[3].map((v,i)=>v-vertices[0][i]);
  const normal=[edge1[1]*edge2[2]-edge1[2]*edge2[1],edge1[2]*edge2[0]-edge1[0]*edge2[2],edge1[0]*edge2[1]-edge1[1]*edge2[0]];
  if(normal[2]<=0)continue;
  const [ux,uy,uw,uh]=f.rect;
  for(let py=0;py<uh;py++)for(let px=0;px<uw;px++){
   const ix=(uy+py)*64+(ux+px),offset=ix*4,alpha=pixels[offset+3];if(!alpha)continue;
   const blend=(s,t)=>vertices[0].map((_,i)=>vertices[0][i]*(1-s)*(1-t)+vertices[1][i]*s*(1-t)+vertices[2][i]*s*t+vertices[3][i]*(1-s)*t);
   const s=px/uw,t=py/uh,S=(px+1)/uw,T=(py+1)/uh;
   const v=[blend(s,t),blend(S,t),blend(S,T),blend(s,T)];
   const depth=v.reduce((sum,q)=>sum+q[2],0)/4;
   const shade=f.shade,fill="rgba("+Math.min(255,Math.round(pixels[offset]*shade))+","+Math.min(255,Math.round(pixels[offset+1]*shade))+","+Math.min(255,Math.round(pixels[offset+2]*shade))+","+(alpha/255)+")";
   queue.push({depth,pts:v.map(project),fill});
  }
 }
 queue.sort((a,b)=>a.depth-b.depth);
 for(const q of queue)polygon(q.pts,q.fill);
 g.font="13px system-ui";g.fillStyle="#aeb6d2";g.textAlign="center";g.fillText("DRAG TO ROTATE • 64 × 64 SKIN",210,516);
 }
 function frame(now){if(document.getElementById("skin").classList.contains("active")&&now-lastFrame>70){if(spin&&!drag){yaw+=.018;dirty=true}if(dirty){draw();dirty=false}lastFrame=now}requestAnimationFrame(frame)}
 canvas.addEventListener("pointerdown",e=>{drag=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId)});
 canvas.addEventListener("pointermove",e=>{if(!drag)return;yaw+=(e.clientX-lastX)*.012;pitch=Math.max(-.8,Math.min(.8,pitch+(e.clientY-lastY)*.008));lastX=e.clientX;lastY=e.clientY;dirty=true});
 const stop=()=>drag=false;canvas.addEventListener("pointerup",stop);canvas.addEventListener("pointercancel",stop);canvas.addEventListener("lostpointercapture",stop);
 document.getElementById("skin-spin").addEventListener("click",e=>{spin=!spin;e.target.textContent=spin?"Pause Rotation":"Auto Rotate";dirty=true});
 document.getElementById("skin-front").addEventListener("click",()=>{yaw=0;pitch=0;spin=false;document.getElementById("skin-spin").textContent="Auto Rotate";dirty=true});
 document.getElementById("skin-back").addEventListener("click",()=>{yaw=Math.PI;pitch=0;spin=false;document.getElementById("skin-spin").textContent="Auto Rotate";dirty=true});
 window.addEventListener("pcs-skin-change",()=>dirty=true);
 requestAnimationFrame(frame);
})();