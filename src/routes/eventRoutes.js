const express = require('express');
const { createEvent, getEvents, getFreeSlots } = require('../controllers/eventController');

const router = express.Router();

// Define routes for events
router.post('/events', createEvent);
router.get('/events', getEvents);
router.get('/freeslots', getFreeSlots);

module.exports = router;
