// const admin = require('firebase-admin');
// const serviceAccount = require('./serviceAccountKey.json'); // Path to your service account key
//
// // Initialize the Firebase Admin SDK
// admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//     databaseURL: "https://calendar-system-e048d.firebaseio.com",
// });
//
// // Initialize Firestore
// const db = admin.firestore();
//
// module.exports = db; // Export the Firestore database instance
const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json'); // Path to your service account key

// Initialize the Firebase Admin SDK
if (!admin.apps.length) { // Only initialize if there are no apps already initialized
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://calendar-system-e048d.firebaseio.com",
    });
}

// Initialize Firestore
const db = admin.firestore();

module.exports = db; // Export the Firestore database instance
