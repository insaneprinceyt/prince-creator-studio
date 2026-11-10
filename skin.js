"use strict";
(()=>{
 const $=id=>document.getElementById(id),canvas=$("skin-canvas"),ctx=canvas.getContext("2d",{willReadFrequently:true});
 ctx.imageSmoothingEnabled=false;
 const display=document.createElement("canvas");display.width=64;display.height=64;
 const d=display.getContext("2d",{willReadFrequently:true});
 const status=t=>$("skin-status").textContent=t;
 const undo=[],redo=[];let dragging=false,changed=false,lastPixel=null;
 function snapshot(){return d.getImageData(0,0,64,64)}
 function remember(){undo.push(snapshot());if(undo.length>35)undo.shift();redo.length=0}
 function render(){ctx.clearRect(0,0,64,64);ctx.fillStyle="#c5c5cf";ctx.fillRect(0,0,64,64);ctx.fillStyle="#f0f0f5";for(let y=0;y<64;y+=8)for(let x=0;x<64;x+=8)if((x+y)%16===0)ctx.fillRect(x,y,8,8);ctx.drawImage(display,0,0)}
 function pos(e){const rect=canvas.getBoundingClientRect();return {x:Math.max(0,Math.min(63,Math.floor((e.clientX-rect.left)*64/rect.width))),y:Math.max(0,Math.min(63,Math.floor((e.clientY-rect.top)*64/rect.height)))}}
 function hex(rgb){return "#"+[rgb[0],rgb[1],rgb[2]].map(v=>v.toString(16).padStart(2,"0")).join("")}
 function color(){const value=$("skin-color").value;return [parseInt(value.slice(1,3),16),parseInt(value.slice(3,5),16),parseInt(value.slice(5,7),16),255]}
 function flood(x,y){const image=snapshot(),pixels=image.data,origin=(y*64+x)*4,target=Array.from(pixels.slice(origin,origin+4)),replacement=color();if(target.every((v,i)=>v===replacement[i]))return false;const queue=[y*64+x],visited=new Uint8Array(4096);let cursor=0;while(cursor<queue.length){const index=queue[cursor++];if(visited[index])continue;visited[index]=1;const p=index*4;if(!target.every((v,i)=>pixels[p+i]===v))continue;pixels.set(replacement,p);const px=index%64,py=Math.floor(index/64);if(px>0)queue.push(index-1);if(px<63)queue.push(index+1);if(py>0)queue.push(index-64);if(py<63)queue.push(index+64)}d.putImageData(image,0,0);return true}
 function apply(e){const {x,y}=pos(e),tool=$("skin-tool").value;if(lastPixel===x+","+y&&tool!=="pick")return;lastPixel=x+","+y;if(tool==="pick"){const c=d.getImageData(x,y,1,1).data;if(c[3]){$("skin-color").value=hex(c);status("Colour picked.")}return}if(tool==="fill"){if(!changed){remember();changed=true}flood(x,y);render();return}if(!changed){remember();changed=true}if(tool==="erase")d.clearRect(x,y,1,1);else{const c=color();d.fillStyle="rgba("+c[0]+","+c[1]+","+c[2]+",1)";d.fillRect(x,y,1,1)}render()}
 canvas.addEventListener("pointerdown",e=>{dragging=true;changed=false;lastPixel=null;canvas.setPointerCapture(e.pointerId);apply(e);if($("skin-tool").value==="fill"||$("skin-tool").value==="pick")dragging=false});
 canvas.addEventListener("pointermove",e=>{if(dragging)apply(e)});
 function end(){dragging=false;lastPixel=null}canvas.addEventListener("pointerup",end);canvas.addEventListener("pointercancel",end);canvas.addEventListener("lostpointercapture",end);
 $("skin-zoom").addEventListener("change",()=>{const n=Number($("skin-zoom").value);canvas.style.width=64*n+"px";canvas.style.height=64*n+"px"});
 $("skin-zoom").dispatchEvent(new Event("change"));
 $("skin-undo").addEventListener("click",()=>{if(!undo.length){status("Nothing to undo.");return}redo.push(snapshot());d.putImageData(undo.pop(),0,0);render();status("Undone.")});
 $("skin-redo").addEventListener("click",()=>{if(!redo.length){status("Nothing to redo.");return}undo.push(snapshot());d.putImageData(redo.pop(),0,0);render();status("Redone.")});
 $("skin-clear").addEventListener("click",()=>{if(!confirm("Start a blank skin? Unsaved pixels will be cleared."))return;remember();d.clearRect(0,0,64,64);render();status("Blank 64 × 64 skin ready.")});
 $("skin-upload").addEventListener("change",e=>{const file=e.target.files?.[0];if(!file)return;if(file.type!=="image/png"||file.size>5*1024*1024){status("Choose a PNG smaller than 5 MB.");return}const url=URL.createObjectURL(file),img=new Image();img.onload=()=>{URL.revokeObjectURL(url);if(img.width!==64||img.height!==64){status("This editor accepts only 64 × 64 PNG skins.");return}remember();d.clearRect(0,0,64,64);d.drawImage(img,0,0);render();status("Skin imported. Paint to edit it.")};img.onerror=()=>{URL.revokeObjectURL(url);status("Could not read this PNG.")};img.src=url});
 $("skin-export").addEventListener("click",()=>{display.toBlob(blob=>{if(!blob){status("PNG export failed.");return}const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="prince-minecraft-skin-64x64.png";document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),15000);status("64 × 64 skin PNG exported.")},"image/png")});
 render();
})();