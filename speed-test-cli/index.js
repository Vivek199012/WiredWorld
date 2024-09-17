const admin = require('firebase-admin');
const moment = require('moment');
const key = require('./admin-key.json');
const ping = require('ping');
const speedTest = require('speedtest-net');

admin.initializeApp({
  credential: admin.credential.cert(key)
});

const db = admin.firestore();

let dropouts = 0;
let totalDropoutsLast24Hours = 0;
const uptimeInterval = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

const testSpeed = async () => {
  // Speed test
  const result = await speedTest({ maxTime: 5000 });
  const time = moment().format('YYYY-MM-DD HH:mm:ss.SSS');

  const data = { ...result, timestamp: time };
  db.collection('host-A-speeds').doc(time).set(data).then(() => {
    console.log(result);
  });
};

testSpeed();
setInterval(testSpeed, 60 * 60 * 1000); // 60 minutes

// Continuously ping Google to monitor network uptime
const pingInterval = 5 * 1000; // 5 seconds
const hostToPing = 'google.com'; // You can change this to your preferred host

const pingHost = async () => {
  try {
    const response = await ping.promise.probe(hostToPing);
    if (!response.alive) {
      dropouts++;
    }
  } catch (error) {
    console.error('Error while pinging:', error);
  }
};

pingHost();
setInterval(pingHost, pingInterval);

// Save total dropouts in the last 24 hours every 24 hours
setInterval(() => {
  totalDropoutsLast24Hours += dropouts;
  const time = moment().format('YYYY-MM-DD HH:mm:ss.SSS');

  // Store totalDropoutsLast24Hours in a separate document
  db.collection('host-A-dropoutStats').doc(time).set({ totalDropoutsLast24Hours, timestamp: time }).then(() => {
    console.log(`Total Dropouts in Last 24 Hours saved: ${totalDropoutsLast24Hours}`);
  });

  dropouts = 0; // Reset the dropouts counter
}, uptimeInterval);
