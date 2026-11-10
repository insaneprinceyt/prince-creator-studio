import {initializeApp} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {getAuth,onAuthStateChanged,createUserWithEmailAndPassword,signInWithEmailAndPassword,sendPasswordResetEmail,signOut,GoogleAuthProvider,signInWithPopup} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {getFirestore,doc,getDoc,collection,getDocs,query,limit,setDoc} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import {firebaseConfig} from "./firebase-config.js";
const $=id=>document.getElementById(id),status=message=>{$("auth-status").textContent=message};
let mode="login",auth,db,activeUid=null;window.princeSignedIn=false;window.princeIsAdmin=false;
function switchMode(next){mode=next;$("auth-submit").textContent=mode==="login"?"Login":"Create account";$("auth-password").autocomplete=mode==="login"?"current-password":"new-password";status("");}
$("auth-login-tab").onclick=()=>switchMode("login");$("auth-register-tab").onclick=()=>switchMode("register");
const configured=["apiKey","authDomain","projectId","appId"].every(key=>typeof firebaseConfig[key]==="string"&&firebaseConfig[key].trim()&&!firebaseConfig[key].includes("REPLACE_"));
if(!configured){status("Setup needed: add your Firebase web configuration to firebase-config.js. No account has been created.");}
else {
 try {
  const app=initializeApp(firebaseConfig);auth=getAuth(app);db=getFirestore(app);
  $("auth-setup").textContent="Sign in or create an account with your email. Never share your password.";
  $("auth-submit").disabled=false;$("auth-reset").disabled=false;$("auth-google").disabled=false;
  onAuthStateChanged(auth,async user=>{
   window.princeSignedIn=!!user;
   document.body.classList.toggle("auth-locked",!user);
   $("auth-signed-out").hidden=!!user;$("auth-signed-in").hidden=!user;
   $("auth-user").textContent=user?.email||"";
   $("account-header").textContent=user?"My Account":"Login / Register";
   if(!user){activeUid=null;setAdmin(false);setTier("Free","Sign in to see your membership.");show("account");return;}
   activeUid=user.uid;
   show("home");
   await Promise.all([refreshTier(user.uid),checkAdmin(user.uid)]);
  },()=>{window.princeSignedIn=false;document.body.classList.add("auth-locked");show("account");status("Could not check login status. Verify Firebase settings.");});
 }catch(e){status("Firebase setup error. Check firebase-config.js and authorised domains.");}
}
$("auth-form").addEventListener("submit",async e=>{
 e.preventDefault();if(!auth)return;
 const email=$("auth-email").value.trim(),password=$("auth-password").value;
 $("auth-submit").disabled=true;status("Please wait...");
 try{
  if(mode==="register"){await createUserWithEmailAndPassword(auth,email,password);status("Account created and signed in.");}
  else{await signInWithEmailAndPassword(auth,email,password);status("Signed in.");}
  $("auth-password").value="";
 }catch(error){const codes={"auth/email-already-in-use":"This email already has an account. Try Login.","auth/invalid-email":"Enter a valid email address.","auth/weak-password":"Choose a stronger password.","auth/invalid-credential":"Incorrect email or password.","auth/operation-not-allowed":"Enable Email/Password in Firebase Authentication.","auth/unauthorized-domain":"Add your GitHub Pages domain to Firebase authorised domains.","auth/too-many-requests":"Too many attempts. Try again later."};status(codes[error.code]||"Authentication failed. Check your details and Firebase configuration.");}
 finally{$("auth-submit").disabled=false;}
});
$("auth-reset").onclick=async()=>{if(!auth)return;const email=$("auth-email").value.trim();if(!email){status("Enter your email address first.");return}try{await sendPasswordResetEmail(auth,email);status("If an account exists, check your email for password reset instructions.");}catch{status("Unable to request reset right now. Try again later.");}};
$("auth-logout").onclick=async()=>{if(!auth)return;try{await signOut(auth);status("Signed out.");}catch{status("Could not sign out. Try again.");}};

$("auth-google").addEventListener("click",async()=>{
 if(!auth){status("Firebase is not configured yet.");return}
 const button=$("auth-google");button.disabled=true;status("Opening Google sign-in...");
 try{
  const provider=new GoogleAuthProvider();provider.setCustomParameters({prompt:"select_account"});
  const result=await signInWithPopup(auth,provider);
  status("Signed in with Google as "+(result.user.email||"your account")+".");
 }catch(error){
  const messages={
   "auth/operation-not-allowed":"Enable Google under Firebase Authentication → Sign-in method.",
   "auth/unauthorized-domain":"Add insaneprinceyt.github.io to Firebase Authentication authorised domains.",
   "auth/popup-blocked":"Your browser blocked the Google popup. Allow popups for this site and try again.",
   "auth/popup-closed-by-user":"Google sign-in was cancelled.",
   "auth/cancelled-popup-request":"A previous sign-in window was replaced. Try again.",
   "auth/account-exists-with-different-credential":"This email uses another sign-in method. Sign in using that method first.",
   "auth/network-request-failed":"Network error. Check your connection and try again."
  };
  status(messages[error.code]||"Google sign-in failed. Check Firebase Google provider and authorised domains.");
 }finally{button.disabled=false}
});

function setTier(tier,message){
 $("auth-tier").textContent=tier;
 $("membership-status").textContent=message;
 $("membership-premium").textContent=tier==="Premium"?"Active":"Not active";
}
async function refreshTier(uid){
 setTier("Free","Checking your membership in Firebase...");
 try{
  const snapshot=await getDoc(doc(db,"memberships",uid));
  if(activeUid!==uid)return;
  const tier=snapshot.exists()&&snapshot.data().tier==="premium"?"Premium":"Free";
  setTier(tier,tier==="Premium"?"Premium membership active.":"Free membership active. Premium is granted manually by the site owner.");
 }catch(error){
  if(activeUid!==uid)return;
  setTier("Free","Membership could not be verified. Free access only. Check Firestore setup and security rules.");
 }
}
$("membership-refresh").addEventListener("click",()=>{if(auth?.currentUser)refreshTier(auth.currentUser.uid);});
if(!configured)show("account");

function setAdmin(allowed){
 window.princeIsAdmin=allowed;
 $("admin-nav").hidden=!allowed;
 if(!allowed){$("admin-list").replaceChildren();$("admin-message").textContent="Admin access is not enabled for this account.";}
}
async function checkAdmin(uid){
 setAdmin(false);
 try{
  const snap=await getDoc(doc(db,"admins",uid));
  if(activeUid!==uid)return;
  const allowed=snap.exists()&&snap.data().enabled===true;
  setAdmin(allowed);
  if(allowed){$("admin-message").textContent="Admin access verified.";await loadMembers();}
 }catch(error){if(activeUid===uid)$("admin-message").textContent="Unable to verify admin access. Check Firestore rules.";}
}
async function loadMembers(){
 if(!window.princeIsAdmin||!auth?.currentUser)return;
 const list=$("admin-list");list.replaceChildren();
 $("admin-message").textContent="Loading membership records...";
 try{
  const snapshot=await getDocs(query(collection(db,"memberships"),limit(100)));
  if(!window.princeIsAdmin)return;
  snapshot.forEach(s=>{
   const row=document.createElement("div");row.className="admin-member";
   const name=document.createElement("code");name.textContent=s.id;
   const tier=document.createElement("strong");tier.textContent=s.data().tier==="premium"?"Premium":"Free";
   const edit=document.createElement("button");edit.type="button";edit.className="secondary";edit.textContent="Edit";edit.addEventListener("click",()=>{$("admin-uid").value=s.id;$("admin-tier").value=s.data().tier==="premium"?"premium":"free";$("admin-uid").focus();});
   row.append(name,tier,edit);list.append(row);
  });
  $("admin-message").textContent="Showing "+snapshot.size+" membership records (up to 100). Accounts without records are Free.";
 }catch(error){$("admin-message").textContent="Cannot list memberships. Publish the updated Firestore rules first.";}
}
$("admin-reload").addEventListener("click",loadMembers);
$("admin-form").addEventListener("submit",async event=>{
 event.preventDefault();
 if(!window.princeIsAdmin||!auth?.currentUser)return;
 const uid=$("admin-uid").value.trim(),tier=$("admin-tier").value;
 if(!/^[A-Za-z0-9]{10,128}$/.test(uid)){$("admin-message").textContent="Enter a valid Firebase Authentication UID.";return;}
 if(!confirm("Set membership for UID "+uid+" to "+tier+"?"))return;
 $("admin-message").textContent="Saving membership...";
 try{
  await setDoc(doc(db,"memberships",uid),{tier});
  $("admin-message").textContent="Membership saved for "+uid+".";
  await loadMembers();
  if(uid===auth.currentUser.uid)await refreshTier(uid);
 }catch(error){$("admin-message").textContent="Save denied. Confirm your admin record and published Firestore rules.";}
});
