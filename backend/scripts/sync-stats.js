const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function run() {
  const usersSnap = await db.collection('users').get();
  
  let totalOfficers = 0;
  let approved = 0;
  let pending = 0;
  let totalCredits = 0;
  
  usersSnap.docs.forEach(d => {
    const u = d.data();
    if (u.isAdmin) return;

    totalOfficers++;
    if (u.status === 'approved' || !u.status) approved++;
    if (u.status === 'pending') pending++;
    if (u.status === 'rejected') pending++; 
    totalCredits += (u.credits || 0);
  });
  
  const linksSnap = await db.collection('trackingLinks').get();
  let totalLinks = linksSnap.docs.length;
  let totalCaptures = 0;
  
  linksSnap.docs.forEach(d => {
    const link = d.data();
    if (Array.isArray(link.captures)) {
      totalCaptures += link.captures.length;
    }
  });
  
  console.log({ totalOfficers, approved, pending, totalCredits, totalLinks, totalCaptures });
  
  await db.collection('metadata').doc('dashboardStats').set({
    totalOfficers, approved, pending, totalCredits, totalLinks, totalCaptures
  }, {merge: true});
  
  console.log("Synced all stats correctly!");
  process.exit(0);
}
run();
