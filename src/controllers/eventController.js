const admin = require('firebase-admin');
const moment = require('moment-timezone');
const db = require('../utils/firebase'); // Import Firestore instance
const Model = require('../Model/eventModel');
const config = require('../config/config');
const responseHandler = require("../utils/responseHandler");

// Create an event
const createEvent = async (req, res) => {
    try {
        let {dateTime, duration, title} = req.body;
        console.log("req.body", req.body);
        // Validate inputs
        if (!dateTime || typeof dateTime !== 'string' || !duration || typeof duration !== 'number' || !title || typeof title !== 'string' || duration <= 0) {
            return await responseHandler(res, 400, 'Missing required fields: dateTime (string), duration (integer), title (string).');
        }
        // Now, proceed to modify the duration if necessary
        if(duration > config.SLOT_DURATION_MINUTES) {
            let factor = duration / config.SLOT_DURATION_MINUTES;
            if (duration % config.SLOT_DURATION_MINUTES !== 0) {
                factor = Math.ceil(factor);
                duration = config.SLOT_DURATION_MINUTES * factor;
            }
        }
        else{
            duration = config.SLOT_DURATION_MINUTES;
        }
        // Parse dateTime and convert to a timestamp
        const startHour = moment.tz(dateTime, config.DEFAULT_TIMEZONE);
        const endHour = startHour.clone().add(duration, 'minutes');

        // Convert working hours to timestamps
        const workingStart = moment.tz(startHour.format('YYYY-MM-DD') + ' ' + config.WORKING_HOURS_START + ':00', config.DEFAULT_TIMEZONE).valueOf();
        const workingEnd = moment.tz(startHour.format('YYYY-MM-DD') + ' ' + config.WORKING_HOURS_END + ':00', config.DEFAULT_TIMEZONE).valueOf();

        // Check if the new booking is within working hours
        if (startHour.valueOf() < workingStart || endHour.valueOf() > workingEnd) {
            return await responseHandler(res, 400, 'Selected time is out of availability hours.');
        }

        // Convert start and end times to timestamps
        const startTimestamp = startHour.valueOf();  // Start time in milliseconds
        const endTimestamp = endHour.valueOf();      // End time in milliseconds

        // Firestore transaction
        let isClash = false;
        await db.runTransaction(async (transaction) => {
            const bookedSlotsSnapshot = await transaction.get(db.collection('events')
                .where('date', '==', startHour.format('YYYY-MM-DD')));

        bookedSlotsSnapshot.forEach(doc => {
            const booked = doc.data();
            const bookedStart = booked.startTime; // Existing booking start time
            const bookedEnd = booked.endTime;     // Existing booking end time

            // Check for any overlap
            if (startTimestamp < bookedEnd && endTimestamp > bookedStart) {
                isClash = true; // There's an overlap
            }
        });
            if(!isClash)
            transaction.set(db.collection('events').doc(), {
                title,
                date: startHour.format('YYYY-MM-DD'),
                startTime: startTimestamp,
                endTime: endTimestamp,
                duration: duration,
                timezone: config.DEFAULT_TIMEZONE,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        });

        if (isClash) {
            return await responseHandler(res, 422, 'The selected time slot is already booked.');
        } else {
            return await responseHandler(res, 200, 'Event created successfully.');
        }
    } catch (error) {
        if (error.message === 'Slot already booked') {
            return await responseHandler(res, 422, 'The selected time slot is already booked.');
        }
        console.error('Error:', error);
        return await responseHandler(res, 500, 'An unexpected error occurred.');
    }
}
// get event
const getEvents = async (req, res) => {
    const { startDate, endDate } = req.query;

    // Validate input
    if (!startDate || !endDate) {
        return await responseHandler(res, 400, 'Missing required fields: startDate, endDate.');
    }
     try {
         // Convert startDate and endDate to timestamps
         const startTimestamp = moment.tz(startDate, config.DEFAULT_TIMEZONE).valueOf(); // Convert to timestamp in milliseconds
         const endTimestamp = moment.tz(endDate, config.DEFAULT_TIMEZONE).valueOf(); // Convert to timestamp in milliseconds

         // Fetch events between the given start and end times
         const snapshot = await Model.fetchEventsBetweenTimestamps(startTimestamp, endTimestamp);

         if (snapshot.length === 0) { // Check if no documents were found
             console.log('No matching events found.');
             return await responseHandler(res, 200, 'No matching events found.', []); // Return an empty array if no events found
         }

         const events = snapshot.map(doc => ({
             id: doc.id,
             ...doc.data()
         }));
         return await responseHandler(res, 200, 'Events fetched successfully.', events); // Send events in the response
     }
     catch (error) {
         console.error('Error fetching events:', error);
         return await responseHandler(res, 500, 'An unexpected error occurred.');
     }
};
// Get free slots
const getFreeSlots = async (req, res) => {
    const { date, timezone = config.DEFAULT_TIMEZONE } = req.query;

    if (!date) {
        return await responseHandler(res, 400, 'Date is required.');
    }

    // Working hours in the requested timezone
    const workingHoursStart = moment.tz(`${date} ${config.WORKING_HOURS_START}`, config.DEFAULT_TIMEZONE).valueOf()/*unix()*/;
    const workingHoursEnd = moment.tz(`${date} ${config.WORKING_HOURS_END}`, config.DEFAULT_TIMEZONE).valueOf()/*unix()*/;

    console.log(`Working hours (UTC): ${workingHoursStart} to ${workingHoursEnd}`);
    try {
        const eventsSnapshot = await Model.filterEventOnTimeZone(res)/*db.collection('events').where('timezone', '==', config.DEFAULT_TIMEZONE).get()*/;
        const allEvents = eventsSnapshot.docs.map(doc => {
            const eventData = doc.data();
            const start = moment(eventData.startTime/*.toDate()*/).valueOf(); // Convert Firestore Timestamp to moment and get UNIX ms
            const end = moment(eventData.endTime/*.toDate()*/).valueOf();     // Convert Firestore Timestamp to moment and get UNIX ms
            return { ...eventData, start, end };
        });

        // Filter events for the given date and within working hours
        const appointments = allEvents.filter(event => {
            return event.start < workingHoursEnd && event.end > workingHoursStart; // Use basic comparison operators
        });

        console.log(`Filtered appointments: ${JSON.stringify(appointments)}`);

        // Merged appointments
        // Step 1: Sort the appointments based on the start time using the sort() function
        appointments.sort((a, b) => a.start - b.start);

       // Step 2: Initialize an empty array for merged appointments
        const mergedAppointments = [];

        for (let i = 0; i < appointments.length; i++) {
            const currentAppointment = appointments[i];
            const start = currentAppointment.start; // UNIX timestamp in ms
            const end = currentAppointment.end; // UNIX timestamp in ms

            // If mergedAppointments is empty or no overlap, add the current appointment
            if (mergedAppointments.length === 0 || mergedAppointments[mergedAppointments.length - 1].end <= start) {
                mergedAppointments.push({ start, end });
            } else {
                // There is an overlap, so we merge the appointments
                const lastMergedAppointment = mergedAppointments[mergedAppointments.length - 1];
                lastMergedAppointment.end = Math.max(lastMergedAppointment.end, end); // Keep the max end time
            }
        }


        console.log(`Merged appointments: ${JSON.stringify(mergedAppointments)}`);

        //const freeSlots = [];
        // Assuming workingHoursStart and workingHoursEnd are in timestamp format (UNIX time)
       // config.SLOT_DURATION_MINUTES should also be in minutes

        let currentTime = workingHoursStart; // Start in UNIX timestamp
        const freeSlots = [];

// This part remains the same for gathering free slots
        for (let i = currentTime; i < workingHoursEnd /*- config.SLOT_DURATION_MINUTES * 60 * 1000*/; i += config.SLOT_DURATION_MINUTES * 60 * 1000) {
            const slotStart = i; // Current time in timestamp (UNIX format)
            const slotEnd = i + config.SLOT_DURATION_MINUTES * 60 * 1000; // Slot end time

            const isBooked = mergedAppointments.some(({ start, end }) => {
                return slotStart < end && slotEnd > start; // Check for overlap
            });

            if (!isBooked) {
                freeSlots.push({
                    start: slotStart,
                    end: slotEnd
                });
            }
        }

// Convert free slots from UTC to the requested timezone and format them
        const convertedFreeSlots = freeSlots.map(slot => {
            return {
                //start: moment.tz(slot.start, timezone).format('hh:mm A'), // Convert to desired timezone
                //end: moment.tz(slot.end, timezone).format('hh:mm A'), // Convert to desired timezone
                startWithDate: moment(slot.start).tz(timezone).format('YYYY-MM-DD HH:mm:ss'),
                endWithDate: moment(slot.end).tz(timezone).format('YYYY-MM-DD HH:mm:ss'),
                startEpoch: slot.start,
                endEpoch : slot.end
            };
        });

        console.log(`Converted free slots (to ${timezone}): ${JSON.stringify(convertedFreeSlots)}`);
        return await responseHandler(res, 200, 'Free slots retrieved successfully.', convertedFreeSlots);

    } catch (error) {
        console.error('Error fetching appointments:', error);
        return await responseHandler(res, 500, 'Internal Server Error');
    }
};

module.exports = {
    createEvent,
    getEvents,
    getFreeSlots
};
// Problem 1 ) with meeting application(Test) I booked 7:30 slot and checked in Asia/Kolkata ideally 3:00 should be booked in Europe/London.