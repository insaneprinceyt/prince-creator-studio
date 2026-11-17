# Prince Cloud V2 — Firebase setup (no app installation)

The GitHub website now contains working Firebase Authentication and Firestore hosting-request logic. It **does not run Minecraft servers**.

1. Open [Firebase Console](https://console.firebase.google.com/) → project `prince-creator-studio` (or change the project configuration if using another project).
2. Project settings → Your apps → Web app: copy the **public** `apiKey`, `authDomain`, `projectId`, `appId` into `firebase-config.js`. Do not paste service account keys or private keys.
3. Authentication → Sign-in method → enable **Email/Password**.
4. Authentication → Settings → Authorized domains: ensure `insaneprinceyt.github.io` is authorized.
5. Firestore Database → Rules: review `firestore.rules` and **publish** it. IMPORTANT: publishing these rules replaces existing Firestore rules; merge them with any other rules you need before publishing.
6. Optional admin: Authentication → Users → copy your UID. Firestore → `admins` collection → document ID equal to your UID → Boolean field `enabled` set to `true`. Only a trusted Firebase Console administrator should create this document.
7. GitHub → Settings → Pages → deploy from `main`, `/(root)`. Test account registration and a hosting request.

## Functional today (after configuration)
- Email/password registration, sign-in, sign-out
- Create hosting requests in Firestore
- Show requests owned by the signed-in user
- Admin review, approve and reject requests, authorized by Firestore rules

## Not supported by GitHub Pages and Firebase alone
- Starting/stopping Minecraft server processes
- Live Minecraft console, file operations, backups
- Automatic server provisioning or hosting capacity
- Payment processing

For actual Minecraft server hosting, a Linux server or supported third-party Minecraft host with an authenticated API is required. Never put server credentials in frontend JavaScript.

## Security
Firestore rules authorize all request reads and writes. Admin status is not trusted from browser state alone. Hosting request approval is **administrative approval only**, not actual server provisioning. Do not expose Firebase Admin SDK credentials in GitHub.
