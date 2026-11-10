"use strict";
(() => {
 const STORE="pcs-scripts-v1";
 const byId=id=>document.getElementById(id);
 let scripts=[];
 try{const parsed=JSON.parse(localStorage.getItem(STORE)||"[]");if(Array.isArray(parsed))scripts=parsed.filter(x=>x&&typeof x.title==="string"&&typeof x.body==="string")}catch{}
 const persist=()=>{try{localStorage.setItem(STORE,JSON.stringify(scripts));return true}catch{byId("script-status").textContent="Storage unavailable. Copy or download your script instead.";return false}};
 const status=message=>byId("script-status").textContent=message;
 function draft(topic,format,tone){
  const voice={energetic:"This is going to be epic!",friendly:"Let's explore this together.",serious:"Here's what we're going to examine."}[tone];
  if(format==="short")return ["[HOOK | 0–3s]","Minecraft "+topic+" — here's the twist!","","[ACTION | 3–20s]",voice,"Show the key moment of "+topic+".","Add quick cuts, captions and a clear demonstration.","","[PAYOFF | 20–35s]","Reveal the result. What surprised you?","","[OUTRO]","Would you try this? Comment below!"].join("\n");
  if(format==="tutorial")return ["TITLE: How to "+topic+" in Minecraft","","[HOOK]","Want to learn "+topic+"? Here's a simple guide.","","[INTRO]",voice,"Explain what viewers will learn and what they need in-game.","","[STEP 1]","Show the starting setup for "+topic+".","","[STEP 2]","Demonstrate the main technique slowly. Explain common mistakes.","","[STEP 3]","Show the finished result and a quick recap.","","[OUTRO]","Ask viewers what tutorial they want next."].join("\n");
  return ["TITLE: "+topic+" | Minecraft","","[HOOK | First 10 seconds]","Today I'm trying "+topic+" — but there's a challenge!","","[INTRO]","Hey everyone, welcome back! "+voice,"Explain the goal and why it matters.","","[SCENE 1 | SETUP]","Show your Minecraft world, equipment, and the rules for "+topic+".","","[SCENE 2 | THE CHALLENGE]","Record the attempts, funny moments, and what goes wrong.","","[SCENE 3 | THE CLIMAX]","Build suspense, then show the final attempt or result.","","[OUTRO]","Recap the outcome. Ask viewers to share their own ideas in the comments."].join("\n");
 }
 function render(){
  const list=byId("saved-scripts");list.replaceChildren();
  scripts.forEach((entry,index)=>{
   const row=document.createElement("div");row.className="item";
   const name=document.createElement("span");name.textContent=entry.title;
   const open=document.createElement("button");open.textContent="Open";open.addEventListener("click",()=>{byId("script-topic").value=entry.title;byId("script-editor").value=entry.body;status("Saved script loaded for editing.")});
   const del=document.createElement("button");del.textContent="Delete";del.addEventListener("click",()=>{scripts.splice(index,1);persist();render()});
   row.append(name,open,del);list.append(row);
  });
 }
 byId("make-script").addEventListener("click",()=>{
  const topic=byId("script-topic").value.trim();
  if(!topic){status("Enter a video topic first.");byId("script-topic").focus();return}
  byId("script-editor").value=draft(topic,byId("script-style").value,byId("script-tone").value);
  status("Draft created. Edit it to match your actual video.");
 });
 byId("save-script").addEventListener("click",()=>{
  const title=byId("script-topic").value.trim()||"Untitled Minecraft Video";
  const body=byId("script-editor").value.trim();
  if(!body){status("Write or generate a script first.");return}
  scripts.unshift({title,body});if(persist())status("Script saved in this browser.");render();
 });
 byId("copy-script").addEventListener("click",async()=>{
  const body=byId("script-editor").value;if(!body){status("Nothing to copy yet.");return}
  try{await navigator.clipboard.writeText(body);status("Script copied to clipboard.")}catch{byId("script-editor").focus();byId("script-editor").select();status("Select Copy from your phone's text menu.")}
 });
 byId("download-script").addEventListener("click",()=>{
  const body=byId("script-editor").value;if(!body){status("Nothing to download yet.");return}
  const blob=new Blob([body],{type:"text/plain;charset=utf-8"});const url=URL.createObjectURL(blob);
  const a=document.createElement("a");a.href=url;a.download="prince-creator-script.txt";document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);status("Script download started.");
 });
 render();
})();
