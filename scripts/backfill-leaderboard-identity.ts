/**
 * One-time backfill: repair leaderboard entry docs with missing username/displayName/photoURL
 * from users/{uid} profile.
 *
 * Run: npx ts-node scripts/backfill-leaderboard-identity.ts
 * (If ts-node not installed: npm i -D ts-node firebase-admin)
 *
 * Env: GOOGLE_APPLICATION_CREDENTIALS (optional), FIREBASE_PROJECT_ID (optional)
 */

import admin from "firebase-admin";

const BATCH_SIZE = 250;

function isMissing(value: unknown): boolean {
  return value === undefined || value === null || (typeof value === "string" && value.trim() === "");
}

function isGenericDisplayName(value: unknown): boolean {
  const s = (value ?? "").toString().trim();
  return !s || s === "Player" || s === "Anonymous" || s === "Unknown User";
}

async function main() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (projectId) {
    admin.initializeApp({ projectId });
  } else {
    admin.initializeApp();
  }
  const db = admin.firestore();

  const leaderboardDocs = await db.collection("leaderboards").listDocuments();
  const periodKeys = leaderboardDocs.map((docRef: { id: string }) => docRef.id);

  let totalScanned = 0;
  let totalPatched = 0;
  let totalSkipped = 0;

  for (const periodKey of periodKeys) {
    const entriesRef = db.collection("leaderboards").doc(periodKey).collection("entries");
    const entriesSnap = await entriesRef.get();

    let scanned = 0;
    let patched = 0;
    let skipped = 0;
    const batchWrites: Array<{ ref: admin.firestore.DocumentReference; data: Record<string, any> }> = [];

    for (const entryDoc of entriesSnap.docs) {
      scanned++;
      const uid = entryDoc.id;
      const data = entryDoc.data();
      const username = data.username;
      const displayName = data.displayName;
      const photoURL = data.photoURL;

      const needsPatch = isMissing(username);
      if (!needsPatch) {
        skipped++;
        continue;
      }

      let resolvedUsername: string | undefined;
      let resolvedDisplayName: string | undefined;
      let resolvedPhotoURL: string | undefined;
      try {
        const userDoc = await db.doc(`users/${uid}`).get();
        if (userDoc.exists) {
          const raw = userDoc.data() ?? {};
          const profile = (raw.profile ?? {}) as any;
          resolvedUsername = (profile.username ?? raw.username ?? "").toString().trim() || undefined;
          resolvedDisplayName = (profile.displayName ?? raw.displayName ?? "").toString().trim() || undefined;
          resolvedPhotoURL = (profile.photoURL ?? raw.photoURL ?? "").toString().trim() || undefined;
        }
      } catch {
        // leave resolved* empty
      }

      const patch: Record<string, any> = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      if (isMissing(username) && resolvedUsername) {
        patch.username = resolvedUsername;
      }
      if ((isMissing(displayName) || isGenericDisplayName(displayName)) && resolvedUsername) {
        patch.displayName = `@${resolvedUsername}`;
      }
      if (isMissing(photoURL) && resolvedPhotoURL) {
        patch.photoURL = resolvedPhotoURL;
      }

      if (Object.keys(patch).length > 1) {
        batchWrites.push({ ref: entryDoc.ref, data: patch });
        patched++;
      } else {
        skipped++;
      }
    }

    // Commit in chunks
    for (let i = 0; i < batchWrites.length; i += BATCH_SIZE) {
      const batch = db.batch();
      const chunk = batchWrites.slice(i, i + BATCH_SIZE);
      for (const { ref, data } of chunk) {
        batch.update(ref, data);
      }
      await batch.commit();
    }

    totalScanned += scanned;
    totalPatched += patched;
    totalSkipped += skipped;
    console.log(
      `[${periodKey}] scanned: ${scanned}, patched: ${patched}, skipped: ${skipped}`
    );
  }

  console.log("\n--- Summary ---");
  console.log(`Periods: ${periodKeys.length}`);
  console.log(`Total scanned: ${totalScanned}`);
  console.log(`Total patched: ${totalPatched}`);
  console.log(`Total skipped: ${totalSkipped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
