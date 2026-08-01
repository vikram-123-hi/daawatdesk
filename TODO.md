# TODO List — DaawatDesk

## Firebase Cloud Function — Auto Delete Auth Account
- **Status:** Pending (requires Blaze plan upgrade)
- **What:** When admin deletes a user, Firebase Auth account should also be auto-deleted
- **Files created:**
  - `firebase.json` — Functions config ✅
  - `functions/index.js` — `onUserDeleted` Firestore trigger ✅
  - `functions/package.json` — Dependencies ✅
  - `functions/node_modules/` — Installed ✅
- **Remaining steps:**
  1. Upgrade to Blaze plan: https://console.firebase.google.com/project/daawatdesk-auth/usage/details
  2. Set billing budget alert (₹0 or ₹100) to avoid surprises
  3. Deploy: `npx firebase-tools deploy --only functions --project daawatdesk-auth`
- **Current workaround:** After admin deletes user, user registers again with same old password + new license key. Register flow handles `email-already-in-use` by auto-login + creating new Firestore doc.
- **Cloud Function code:**
  ```js
  // functions/index.js
  // Triggers on Firestore users/{userId} document delete
  // Deletes corresponding Firebase Auth account via Admin SDK
  exports.onUserDeleted = onDocumentDeleted("users/{userId}", async (event) => {
    await admin.auth().deleteUser(event.params.userId);
  });
  ```

## Temporary Feature — Manual Expire/Renew License
- **Status:** Active — needs to be removed before production launch
- **What:** Admin can manually expire or renew any user's license from admin portal
- **Marked with comments:** `/* TEMPORARY FEATURE */` and `/* END TEMPORARY FEATURE */` in `src/components/Admin.jsx`
- **To remove:** Search for `TEMPORARY FEATURE` in Admin.jsx and delete those blocks

## Tally Export Feature (PetPooja-like Integration)
- **Status:** Planned — Implementation pending
- **What:** Export POS sales, GST, and expense data as Tally-compatible XML files for import into TallyPrime
- **Plan approved:** Yes — ready to implement
- **Files to create:**
  - `src/utils/tallyXml.js` — XML generation utilities (Sales Voucher, Receipt Voucher, Payment Voucher)
  - `src/components/TallyExport.jsx` — Export page with date picker, preview, download button
- **Files to modify:**
  - `src/App.jsx` — Add `/tally-export` route with CodeAccessRoute
  - `src/components/Dashboard.jsx` — Add Tally Export module card
- **Export types:**
  - Full Export (Sales + GST + Payments + Expenses)
  - Daily Summary (one consolidated voucher/day)
  - Bill-wise (individual voucher per transaction)
  - GST Only (for filing)
  - Expense Only
- **XML format:** TallyPrime compatible `<ENVELOPE>` structure with Sales/Receipt/Payment vouchers
- **Tally XML reference:** https://help.tallysolutions.com/sample-xml
- **Key details:**
  - One-way sync: POS → Tally (user manually imports XML into Tally)
  - Ledger names configurable (Sales, CGST, SGST, Cash, UPI, Card)
  - Date format: YYYYMMDD (Tally requirement)
  - Accessible via CodeAccessRoute (workers can export)

## Notes
- Spark plan current usage: Writes 0.1%, Reads 0.3%, Deletes 0% — well within limits
- Current daily limits: 20K writes, 50K reads, 20K deletes
- Blaze plan needed only for Cloud Functions, not for current features
