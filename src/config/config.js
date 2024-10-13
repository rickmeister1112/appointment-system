 const config ={};
 config.WORKING_HOURS_START = process.env.START_HOURS || '19:30'; // Default to 6:30
 config.WORKING_HOURS_END = process.env.END_HOURS || '24:00'; // Default to 12:00 (midnight)
 config.SLOT_DURATION_MINUTES = parseInt(process.env.SLOT_DURATION, 10) || 30; // Default 30 minutes
 config.DEFAULT_TIMEZONE = process.env.TIMEZONE || 'Asia/Kolkata'; // Default timezone =Asia/Kolkata
 module.exports= config;