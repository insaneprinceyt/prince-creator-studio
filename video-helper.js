"use strict";
(()=>{
 const $=id=>document.getElementById(id);
 let videoURL=null;
 const status=t=>$("vh-status").textContent=t;
 const clean=s=>s.replace(/\.[^.]+$/,"").replace(/[_-]+/g," ").replace(/\b(?:final|export|untitled|edited|copy|video|recording|screenrecord|screen recording|mp4|mov)\b/gi," ").replace(/\s+/g," ").trim();
 $("vh-file").addEventListener("change",()=>{
  const file=$("vh-file").files?.[0],player=$("vh-player");
  if(videoURL){URL.revokeObjectURL(videoURL);videoURL=null}
  player.pause();player.removeAttribute("src");player.hidden=true;player.load();
  if(!file){$("vh-file-info").textContent="No video selected.";return}
  if(!file.type.startsWith("video/")){status("Choose a video file.");return}
  videoURL=URL.createObjectURL(file);player.src=videoURL;player.hidden=false;
  $("vh-file-info").textContent=file.name+" • "+(file.size/1024/1024).toFixed(1)+" MB • Local preview only";
  if(!$("vh-topic").value.trim()){const suggested=clean(file.name);if(suggested&&!/^\d+$/.test(suggested))$("vh-topic").value=suggested}
  status("Video selected. Describe its content for more accurate suggestions.");
 });
 $("vh-generate").addEventListener("click",()=>{
  const file=$("vh-file").files?.[0],topic=$("vh-topic").value.trim()||(file?clean(file.name):"");
  if(!topic){status("Enter what happens in your video first.");return}
  const kind=$("vh-format").value,style=$("vh-style").value;
  const t=topic.slice(0,95),isShort=kind==="short";
  const titles={
   exciting:[t+"! 🔥", "You Won't Believe This "+t+" Moment!",t+" — Epic Minecraft Gameplay!"],
   simple:[t+" | Minecraft",t+" Gameplay",t+" Highlights"],
   challenge:["Can I Win "+t+"?","I Tried "+t+" in Minecraft!",t+" Challenge!"]
  };
  const title=titles[style][0]+(isShort?" #Shorts":"");
  const intro=kind==="tutorial"?"In this tutorial, I walk through "+t+".":isShort?"Check out this Minecraft short featuring "+t+".":"In today's Minecraft video, I'm sharing "+t+".";
  const description=intro+"\n\nWatch the video and tell me your favourite moment in the comments!\n\nSubscribe for more Minecraft videos, PvP, challenges and Shorts.\n\n#Minecraft #MinecraftGaming"+(isShort?" #Shorts":"");
  const tags=[t,"minecraft","minecraft gameplay","minecraft pvp",isShort?"minecraft shorts":"minecraft video"].filter(Boolean).join(", ");
  $("vh-title").value=title.slice(0,150);$("vh-description").value=description;$("vh-tags").value=tags;
  status("Editable drafts generated from your topic and filename. Review them against the video before publishing.");
 });
 async function copy(id){const value=$(id).value.trim();if(!value){status("Generate or write text first.");return}try{await navigator.clipboard.writeText(value);status("Copied to clipboard.")}catch{status("Clipboard blocked. Select the text and copy manually.")}}
 $("vh-copy-title").addEventListener("click",()=>copy("vh-title"));
 $("vh-copy-description").addEventListener("click",()=>copy("vh-description"));
 $("vh-download").addEventListener("click",()=>{
  const title=$("vh-title").value.trim(),description=$("vh-description").value.trim(),tags=$("vh-tags").value.trim();
  if(!title&&!description&&!tags){status("Generate or write a draft first.");return}
  const blob=new Blob(["TITLE\n"+title+"\n\nDESCRIPTION\n"+description+"\n\nTAGS\n"+tags],{type:"text/plain;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="prince-video-metadata.txt";document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);status("Metadata draft downloaded.");
 });
 window.addEventListener("pagehide",()=>{if(videoURL)URL.revokeObjectURL(videoURL)});
})();