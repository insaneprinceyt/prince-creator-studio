# Prince Creator Studio Admin Panel Setup

1. **Publish updated rules**: Open Firebase Console → Firestore Database → Rules. Replace existing rules with the contents of `firestore.rules` in this repository and tap Publish. Previous rules deny all client writes, so the admin panel cannot manage memberships until this is done.
2. **Create your first admin in Firebase Console**: Authentication → Users → copy your own exact UID. Firestore Database → Data → Start collection `admins`. Document ID must equal your UID. Add field `enabled` of type **boolean**, value **true**. Save. **Do not use a public form or allow users to create admin records.**
3. **Sign in** at https://insaneprinceyt.github.io/prince-creator-studio/ and refresh the page. The Admin Panel sidebar link appears after Firebase confirms your admin record.
4. **Grant Premium**: In Authentication → Users, copy a user's UID. In Admin Panel paste that UID, choose Premium, and save. Choose Free to revoke. You can view up to 100 existing membership records; accounts with no record default to Free.

Security notes:
- Firestore rules allow only Firebase Console/Admin SDK to change admin records. A user can read only their own admin record. Membership writes are restricted to signed-in accounts with `admins/{uid}.enabled == true`.
- This is **client UI backed by Firestore security rules**, not a private server. All premium-only paid API endpoints must independently verify Firebase authentication and role server-side.
- The admin panel cannot list all Firebase Authentication users, only membership documents. You must obtain UIDs from Firebase Console.
- Avoid placing service-account keys, admin SDK credentials, or passwords in the GitHub repository.
- The site's browser-local creator drafts are not shared with admins or stored in Firestore.
