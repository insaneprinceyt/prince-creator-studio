# Prince Creator Studio — Manual Premium Setup

## 1. Enable Cloud Firestore
In Firebase Console for project `prince-creator-studio`, open Build → Firestore Database → Create database. Choose a location and start in **production mode**. Firebase may ask you to select a billing plan; do not upgrade unless you understand the costs.

## 2. Publish Firestore security rules
Open Firestore Database → Rules. Replace the editor with the entire contents of `firestore.rules` in this repository, then press Publish. These rules allow each signed-in user to read only their own membership document. **All client writes are denied**.

## 3. Grant Premium manually (Firebase Console only)
Open Authentication → Users and copy the desired user's **UID** (not their email). Open Firestore Database → Data, create collection `memberships`, and create a document whose ID is exactly that UID. Add a field:
- field: `tier`
- type: string
- value: `premium`

The user can then sign in and tap Membership → Refresh membership. To revoke Premium, delete the document or change its tier to `free`. No user can change their own tier using the web client under these rules.

## Important limitations
- This is Firebase-managed membership status, not a separate paid feature backend. The current tools are public static JavaScript served by GitHub Pages, so **do not put secrets or genuinely Premium-only services in those files**.
- Future Premium-only backend operations must validate Firebase ID tokens and membership status server-side.
- Existing drafts/projects remain stored locally in each browser, not in Firestore.
- No payment gateway, checkout, or automatic subscription billing is included.
- To test: sign out (dashboard should disappear), sign in (dashboard should appear), create a Premium membership document in Console, then refresh Membership.
