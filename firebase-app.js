import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {getAuth,onAuthStateChanged,createUserWithEmailAndPassword,signInWithEmailAndPassword,signOut} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {getFirestore,doc,getDoc,setDoc,addDoc,collection,query,where,getDocs,serverTimestamp,updateDoc} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import {firebaseConfig} from './firebase-config.js';

const status=document.getElementById('auth-status');
const authButton=document.getElementById('auth-btn');
const authForm=document.getElementById('auth-form');
const logoutButton=document.getElementById('logout-btn');
const list=document.getElementById('request-list');
const adminList=document.getElementById('admin-requests');
let auth,db,currentUser=null,isAdmin=false;
const configured=!!firebaseConfig.apiKey&&!firebaseConfig.apiKey.startsWith('REPLACE_')&&!!firebaseConfig.appId&&!firebaseConfig.appId.startsWith('REPLACE_');
function message(text){status.textContent=text;}
function el(tag,text){const node=document.createElement(tag);node.textContent=text;return node;}
function button(label,action){const b=el('button',label);b.className='outline';b.addEventListener('click',action);return b;}
if(configured){
  try{
    const app=initializeApp(firebaseConfig);
    auth=getAuth(app);db=getFirestore(app);
    message('Sign in or create an account.');
    onAuthStateChanged(auth,async user=>{
      currentUser=user;isAdmin=false;
      authButton.textContent=user?'Account':'Sign in';
      authForm.hidden=!!user;logoutButton.hidden=!user;
      if(user){message('Signed in as '+(user.email||user.uid));}
      else{message('Sign in or create an account.');}
      list.replaceChildren();adminList.replaceChildren();
      if(!user){list.textContent='Sign in to view your hosting requests.';adminList.textContent='Admin sign-in required.';return;}
      try{
        const adminDoc=await getDoc(doc(db,'admins',user.uid));
        isAdmin=adminDoc.exists()&&adminDoc.data().enabled===true;
      }catch(err){console.warn('Admin permission lookup failed:',err.code);}
      await Promise.all([loadRequests(user),loadAdminRequests(user)]);
    });
  }catch(err){message('Firebase initialization failed: '+err.message);}
}else{
  message('Firebase not configured. Add the web app apiKey and appId to firebase-config.js.');
  list.textContent='Configure Firebase to enable hosting requests.';
  adminList.textContent='Configure Firebase to enable admin requests.';
}
authForm.addEventListener('submit',async e=>{
  e.preventDefault();
  if(!auth){message('Configure Firebase first.');return;}
  try{await signInWithEmailAndPassword(auth,document.getElementById('email').value.trim(),document.getElementById('password').value);}
  catch(err){message('Sign-in failed: '+err.code);}
});
document.getElementById('register-btn').addEventListener('click',async()=>{
  if(!auth){message('Configure Firebase first.');return;}
  const email=document.getElementById('email').value.trim(),password=document.getElementById('password').value;
  if(!email||password.length<6){message('Enter a valid email and a password of at least 6 characters.');return;}
  try{await createUserWithEmailAndPassword(auth,email,password);}
  catch(err){message('Registration failed: '+err.code);}
});
logoutButton.addEventListener('click',async()=>{if(auth)await signOut(auth);});
document.querySelectorAll('[data-plan]').forEach(b=>b.addEventListener('click',async()=>{
  if(!currentUser||!db){alert('Sign in with a configured Firebase account first.');return;}
  const plan=b.dataset.plan;
  if(!confirm('Submit a '+plan+' hosting request? This does not create a Minecraft server.'))return;
  b.disabled=true;
  try{await addDoc(collection(db,'hostingRequests'),{ownerUid:currentUser.uid,plan,status:'pending',createdAt:serverTimestamp()});alert('Hosting request saved. No server has been provisioned.');await loadRequests(currentUser);}
  catch(err){alert('Request failed: '+err.code);}
  finally{b.disabled=false;}
}));
async function loadRequests(user){
  list.replaceChildren();
  try{
    const snap=await getDocs(query(collection(db,'hostingRequests'),where('ownerUid','==',user.uid)));
    const records=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
    list.append(el('h3','Your hosting requests'));
    if(!records.length)list.append(el('p','No requests yet.'));
    records.forEach(r=>{const row=el('div',r.plan+' · '+r.status+' · Request '+r.id.slice(0,8));row.className='file-row';list.append(row);});
  }catch(err){list.textContent='Unable to load requests: '+err.code;}
}
async function loadAdminRequests(user){
  adminList.replaceChildren();
  if(!isAdmin){adminList.textContent='Admin access requires a server-enforced Firestore admin record.';return;}
  try{
    const snap=await getDocs(collection(db,'hostingRequests'));
    adminList.append(el('h3','Hosting requests ('+snap.size+')'));
    if(snap.empty)adminList.append(el('p','No hosting requests.'));
    snap.forEach(record=>{
      const data=record.data(),row=document.createElement('div');
      row.className='file-row';row.style.flexWrap='wrap';row.style.gap='8px';
      row.append(el('span',data.plan+' · '+data.status+' · '+data.ownerUid.slice(0,12)));
      if(data.status==='pending'){
        row.append(button('Approve request',async()=>{
          if(!confirm('Approve request for review? This does not provision a server.'))return;
          try{await updateDoc(doc(db,'hostingRequests',record.id),{status:'approved'});await loadAdminRequests(user);}
          catch(err){alert('Approval failed: '+err.code);}
        }));
        row.append(button('Reject',async()=>{
          try{await updateDoc(doc(db,'hostingRequests',record.id),{status:'rejected'});await loadAdminRequests(user);}
          catch(err){alert('Rejection failed: '+err.code);}
        }));
      }
      adminList.append(row);
    });
  }catch(err){adminList.textContent='Unable to load admin requests: '+err.code;}
}
