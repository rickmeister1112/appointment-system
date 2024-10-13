// const express = require('express');
// const moment = require('moment-timezone');
// const admin = require('firebase-admin');
// const serviceAccount = require('./serviceAccountKey.json'); // Ensure this path is correct
//
// // Initialize Firebase Admin SDK
// admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount)
// });
//
// const db = admin.firestore(); // Create Firestore instance
// const app = express();
// app.use(express.json()); // Middleware to parse JSON requests
// const cors = require('cors');
// app.use(cors());
// require('dotenv').config(); // Load environment variables from .env file
//
// const PORT = process.env.PORT || 3000;
//
// // Config variables
// const CONFIG = {
//     startHours: '10:00',
//     endHours: '17:00',
//     duration: 30, // Duration in minutes
//     timezone: 'America/Los_Angeles'
// };

// Helper function to calculate available slots


// API to get free slots
// Add this route in your src/index.js file
// app.get('/api/freeslots', async (req, res) => {
//     const { startDate, endDate } = req.query;
//
//     try {
//         // Ensure dates are valid
//         if (!startDate || !endDate) {
//             return res.status(400).json({ error: "Start date and end date are required" });
//         }
//
//         const start = moment(startDate).toDate();
//         const end = moment(endDate).toDate();
//
//         // Fetch events within the specified date range
//         const eventsSnapshot = await db.collection('events')
//             .where('dateTime', '>=', start)
//             .where('dateTime', '<=', end)
//             .get();
//
//         const bookedSlots = eventsSnapshot.docs.map(doc => doc.data());
//
//         // Define a function to generate available slots
//         const freeSlots = getFreeSlots(bookedSlots, start, end);
//
//         res.json(freeSlots);
//     } catch (error) {
//         console.error("Error retrieving free slots:", error);
//         res.status(500).json({ error: "Error retrieving free slots" });
//     }
// });
//
// // Function to determine free slots based on booked slots
// function getFreeSlots(bookedSlots, start, end) {
//     const freeSlots = [];
//     const slotDuration = 30; // Duration of each slot in minutes
//     let current = moment(start);
//
//     while (current.isBefore(end)) {
//         const next = moment(current).add(slotDuration, 'minutes');
//
//         // Check if the current slot overlaps with any booked slots
//         const isBooked = bookedSlots.some(slot => {
//             const slotStart = moment(slot.dateTime.toDate());
//             const slotEnd = moment(slotStart).add(slot.duration, 'minutes');
//             return current.isBetween(slotStart, slotEnd, null, '[]');
//         });
//
//         if (!isBooked) {
//             freeSlots.push({ start: current.toISOString(), end: next.toISOString() });
//         }
//
//         current = next; // Move to the next slot
//     }
//
//     return freeSlots;
// }
//
// // API to create an event
// app.post('/api/events', async (req, res) => {
//     const { dateTime, duration, title } = req.body;
//
//     try {
//         const eventRef = db.collection('events').doc(); // Create a new document reference
//
//         // Check if event already exists at the given dateTime
//         const existingEvent = await eventRef.get();
//         if (existingEvent.exists) {
//             return res.status(422).json({ error: 'Event already exists' });
//         }
//
//         // Store the new event
//         await eventRef.set({
//             dateTime: admin.firestore.Timestamp.fromDate(new Date(dateTime)),
//             duration,
//             title
//         });
//
//         res.status(200).json({ message: 'Event created successfully', eventId: eventRef.id });
//     } catch (error) {
//         console.error('Error creating event:', error);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// });
//
// // API to get events in a date range
// app.get('/api/events', async (req, res) => {
//     const { startDate, endDate } = req.query;
//
//     try {
//         const start = new Date(startDate);
//         const end = new Date(endDate);
//
//         // Query Firestore for events in the date range
//         const eventsRef = db.collection('events');
//         const snapshot = await eventsRef
//             .where('dateTime', '>=', admin.firestore.Timestamp.fromDate(start))
//             .where('dateTime', '<=', admin.firestore.Timestamp.fromDate(end))
//             .get();
//
//         const events = [];
//         snapshot.forEach(doc => {
//             events.push({ id: doc.id, ...doc.data() });
//         });
//
//         res.status(200).json(events);
//     } catch (error) {
//         console.error('Error retrieving events:', error);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// });

// Start the server
// app.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}`);
// });
const express = require('express');
//const db = require('./firebase'); // Import Firestore instance
const eventRoutes = require('./routes/eventRoutes'); // Import event routes
const cors = require('cors');
require('dotenv').config(); // Load environment variables from .env file

const app = express();
app.use(express.json()); // Middleware to parse JSON requests
app.use(cors());

const PORT = process.env.PORT || 3000;
// Use the event routes
app.use('/api', eventRoutes);

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
