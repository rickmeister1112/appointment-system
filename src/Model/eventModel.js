const db = require('../utils/firebase');
const config = require('../config/config');
const responseHandler = require("../utils/responseHandler"); // Import Firestore instance


const filterEventOnTimeZone = async function(){
   return await db.collection('events')
        .where('timezone', '==', config.DEFAULT_TIMEZONE).get();

}
// const filterEventOnTimeZone = async (res) => {
//     console.log("timezone", config.DEFAULT_TIMEZONE);
//     try {
//         const snapshot = await db.collection('events')
//             .where('timezone', '==', config.DEFAULT_TIMEZONE)
//             .get();
//
//         // Check if there are no events
//         if (snapshot.empty) {
//             return responseHandler(res, 404, 'No events found for the specified timezone.', []);
//         }
//
//         const events = snapshot.docs.map(doc => ({
//             id: doc.id,
//             ...doc.data()
//         }));
//
//         return responseHandler(res, 200, 'Events retrieved successfully.', events);
//     } catch (error) {
//         console.error('Error filtering events:', error);
//         return responseHandler(res, 500, 'Internal Server Error: Could not filter events.');
//     }
// };
const fetchEventsBetweenTimestamps = async (startTimestamp, endTimestamp) => {
    try {
        const eventsRef = db.collection('events');
        const snapshot = await eventsRef
            .where('startTime', '>=', startTimestamp)
            .where('endTime', '<=', endTimestamp)
            .get();

        return snapshot.docs; // Return the array of documents
    } catch (error) {
        console.error('Error fetching events:', error);
        throw new Error('Could not fetch events.');
    }
};
// const fetchEventsBetweenTimestamps = async (startTimestamp, endTimestamp, res) => {
//     try {
//         const eventsRef = db.collection('events');
//         const snapshot = await eventsRef
//             .where('startTime', '>=', startTimestamp)
//             .where('endTime', '<=', endTimestamp)
//             .get();
//
//         if (snapshot.empty) { // Check if no documents were found
//             return responseHandler(res, 404, 'No events found between the specified timestamps.', []);
//         }
//
//         const events = snapshot.docs.map(doc => ({
//             id: doc.id,
//             ...doc.data()
//         }));
//
//      return events
//     } catch (error) {
//         console.error('Error fetching events:', error);
//         return responseHandler(res, 500, 'Internal Server Error: Could not fetch events.');
//     }
// };
module.exports = {
    filterEventOnTimeZone,
    fetchEventsBetweenTimestamps
};