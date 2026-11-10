import {initializeApp} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {getAuth,onAuthStateChanged,createUserWithEmailAndPassword,signInWithEmailAndPassword,sendPasswordResetEmail,signOut} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {firebaseConfig} from "./firebase-config.js";
const $=id=>document.getElementById(id),status=message=>{$("auth-status").textContent=message};
let mode="login",auth;
function switchMode(next){mode=next;$("auth-submit").textContent=mode==="login"?"Login":"Create account";$("auth-password").autocomplete=mode==="login"?"current-password":"new-password";status("");}
$("auth-login-tab").onclick=()=>switchMode("login");$("auth-register-tab").onclick=()=>switchMode("register");
const configured=["apiKey","authDomain","projectId","appId"].every(key=>typeof firebaseConfig[key]==="string"&&firebaseConfig[key].trim()&&!firebaseConfig[key].includes("REPLACE_"));
if(!configured){status("Setup needed: add your Firebase web configuration to firebase-config.js. No account has been created.");}
else {
 try {
  auth=getAuth(initializeApp(firebaseConfig));
  $("auth-setup").textContent="Sign in or create an account with your email. Never share your password.";
  $("auth-submit").disabled=false;$("auth-reset").disabled=false;
  onAuthStateChanged(auth,user=>{
   $("auth-signed-out").hidden=!!user;$("auth-signed-in").hidden=!user;
   $("auth-user").textContent=user?.email||"";
   $("account-header").textContent=user?"My Account":"Login / Register";
  },()=>status("Could not check login status. Verify Firebase settings."));
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
