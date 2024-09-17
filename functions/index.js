const functions = require("firebase-functions");
const admin = require("firebase-admin");
const sgMail = require("@sendgrid/mail");
const dotenv = require('dotenv');
const { Firestore } = require('@google-cloud/firestore');
const { Storage } = require('@google-cloud/storage');
//const cors = require('cors')({origin: true});
const cors = require('cors');
const express = require('express');
const stripe = require('stripe')('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');
//const stripe = require('stripe')('sk_test_51OLU7lKGOtHP6zWlSvp1CKA4XhdFWSZXTZgiFIrvvn2NSPVwn6UgMyainjgf3sd29bzUdUBzrnKrT2YvdmNhTCZb00IH04u1eT');
const app = express();
// Automatically allow cross-origin requests
app.use(cors({ origin: true }));

admin.initializeApp(); // Initialize Firebase Admin SDK

// Load environment variables from the .env file
dotenv.config({ path: 'sendgrid.env' });

// Initialize SendGrid with your API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Define your Firestore trigger function
exports.sendEmailOnNewFeedback = functions.firestore
  .document("feedbacks/{feedbackId}")
  .onCreate(async (snapshot, context) => {
    try {
      const feedbackData = snapshot.data();

      // Wait for a short delay (e.g., 2 seconds) to ensure synchronization
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Construct the message text manually, including the desired fields
      const messageText = `
        A new feedback has been added:
        Airbnb Link: ${feedbackData.airbnbLink}
        City: ${feedbackData.city}
        Country: ${feedbackData.country}
        Download Speed: ${feedbackData.downloadSpeed} Mbps
        Upload Speed: ${feedbackData.uploadSpeed} Mbps
        Ping Speed: ${feedbackData.pingSpeed} ms
        Dropouts: ${feedbackData.dropouts}
        Open LAN Ports: ${feedbackData.openLanPorts}
        Timestamp: ${feedbackData.timestamp.toDate().toLocaleString()}
      `;

      const msg = {
        to: "thewirednomad@gmail.com", // Replace with your email address
        from: "nomad@em8865.thewirednomad.com",
        subject: "New Listing Added to The Wired Nomad",
        text: messageText,
      };

      await sgMail.send(msg);

      console.log("Email sent successfully");
      return null;
    } catch (error) {
      console.error("Error sending email:", error);
      return null;
    }
  });

exports.updateCountsOnNewFeedback = functions.firestore
  .document("feedbacks/{feedbackId}")
  .onCreate(async (snapshot, context) => {
    const db = admin.firestore();

    // Get the country of the new feedback
    const newCountry = snapshot.data().country;

    // Reference to the counts document
    const countsDocRef = db.collection('stats').doc('counts');

    // Get the current counts
    const countsDoc = await countsDocRef.get();
    let { totalCountries, totalListings } = countsDoc.data();

    // Increment totalListings
    totalListings += 1;

    // Check if the country is unique
    const isUniqueCountry = !await db.collection('feedbacks').where('country', '==', newCountry).limit(2).get().then(querySnapshot => querySnapshot.size > 1);
    if (isUniqueCountry) {
        totalCountries += 1;
    }

    // Update the counts document
    return countsDocRef.update({ totalCountries, totalListings });
});

exports.getFirebaseConfig = functions.https.onCall((data, context) => {
    const firebaseConfig = {
        apiKey: functions.config().myfirebase.apikey,
        authDomain: functions.config().myfirebase.authdomain,
        projectId: functions.config().myfirebase.projectid,
        storageBucket: functions.config().myfirebase.storagebucket,
        messagingSenderId: functions.config().myfirebase.messagingsenderid,
        appId: functions.config().myfirebase.appid,
        measurementId: functions.config().myfirebase.measurementid
    };

    return { firebaseConfig };
});

exports.addFeedback = functions.https.onCall(async (data, context) => {
    // Ensure the user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    try {
        // Add data to Firestore
        await admin.firestore().collection('feedbacks').add(data);
        return { success: true };
    } catch (error) {
        console.error('Error adding feedback:', error);
        throw new functions.https.HttpsError('internal', 'Error adding feedback to Firestore.');
    }
});

exports.getListings = functions.https.onRequest(async (req, res) => {
    // Handle Preflight request
    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Origin', 'https://thewirednomad.com');
      res.set('Access-Control-Allow-Methods', 'POST');
      res.set('Access-Control-Allow-Headers', 'Content-Type');
      res.status(204).send('');
      return;
    }

    res.set('Access-Control-Allow-Origin', 'https://thewirednomad.com');
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    try {
      console.log('Received request:', req.body);  // Log received request body
      const criteria = req.body.criteria;
      let query = db.collection('feedbacks');

      if (criteria) {
        Object.keys(criteria).forEach((key) => {
          query = query.where(key, '==', criteria[key]);
        });
      }

      const snapshot = await query.get();

      if (snapshot.empty) {
        console.log('No matching documents.');
        res.status(200).send([]);
        return;
      }

      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log('Sending response:', data);  // Log response data
      res.status(200).send(data);
    } catch (error) {
      console.error('Error:', error);  // Log error
      res.status(500).send({ error: error.message });
    }
});



const firestore = new Firestore({
  projectId: 'thewirednomad',
  timestampsInSnapshots: true,
});

const storage = new Storage();

exports.backupFeedbacks = functions.https.onRequest(async (req, res) => {
    try {
        const feedbacksRef = firestore.collection('feedbacks');
        const snapshot = await feedbacksRef.get();

        let feedbacks = [];
        snapshot.forEach(doc => {
            feedbacks.push({
                id: doc.id,
                ...doc.data()
            });
        });

        const bucketName = 'thewirednomad-backup';
        const fileName = `feedbacks-backup-${new Date().toISOString()}.json`;

        const file = storage.bucket(bucketName).file(fileName);
        const writeStream = file.createWriteStream({
            metadata: {
                contentType: 'application/json',
                cacheControl: 'no-cache',
            },
        });

        writeStream.on('error', (err) => {
            console.error('Error during upload:', err);
            res.status(500).send('Error during upload!');
        });

        writeStream.on('finish', () => {
            console.log(`Backup complete for ${feedbacks.length} feedbacks. Saved to ${fileName}`);
            res.status(200).send('Backup complete!');
        });

        writeStream.end(JSON.stringify(feedbacks));

    } catch (error) {
        console.error('Error during backup:', error);
        res.status(500).send('Error during backup!');
    }
});

exports.getStatsCounts = functions.https.onCall(async (data, context) => {
    try {
        const db = admin.firestore();
        const countsDoc = await db.collection('stats').doc('counts').get();
        return countsDoc.data();
    } catch (error) {
        console.error("Error fetching stats counts:", error);
        throw new functions.https.HttpsError('internal', 'Failed to fetch stats counts');
    }
});


exports.getFeedbacks = functions.https.onRequest(async(req, res) => {
    // Handle Preflight request
    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Origin', 'https://thewirednomad.com');
      res.set('Access-Control-Allow-Methods', 'POST');
      res.set('Access-Control-Allow-Headers', 'Content-Type');
      res.status(204).send('');
      return;
    }

    // Set CORS headers
    res.set('Access-Control-Allow-Origin', 'https://thewirednomad.com');
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    try {
        console.log('Request received:', req.body); // Log request payload
        // Check if the body and criteria are provided
        if (!req.body) {
            res.status(400).send('Bad Request: Request body is missing.');
            return;
        }
        const criteria = req.body.criteria;

        // Check if criteria is an object if it's provided
        if (criteria && typeof criteria !== 'object') {
            res.status(400).send('Bad Request: Criteria should be an object.');
            return;
        }

        let query = admin.firestore().collection('feedbacks');
        if (criteria) {
            Object.keys(criteria).forEach((key) => {
                query = query.where(key, '==', criteria[key]);
            });
        }

        const snapshot = await query.get();
        const data = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
        res.status(200).send(data);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error.');
    }
});

exports.submitForm = functions.https.onRequest(async (req, res) => {
    // Handle Preflight request
    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Origin', 'https://thewirednomad.com');
      res.set('Access-Control-Allow-Methods', 'POST');
      res.set('Access-Control-Allow-Headers', 'Content-Type');
      res.status(204).send('');
      return;
    }

    res.set('Access-Control-Allow-Origin', 'https://thewirednomad.com');
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    try {
        const formData = req.body;

        // Example data validation (ensure more according to your use-case)
        if (!formData.city || !formData.country) {
            res.status(400).send('Invalid data submitted!');
            return;
        }

        // Convert UNIX timestamp to Firestore Timestamp
        if (formData.timestamp) {
            formData.timestamp = admin.firestore.Timestamp.fromMillis(formData.timestamp);
        }

        // Here, 'feedbacks' is the Firestore collection where we want to store our data
        await admin.firestore().collection('feedbacks').add(formData);
        res.status(200).send('Submission successful!');
        }
        catch (error) {
            console.error('Error submitting form:', error);
            res.status(500).send('Internal Server Error: ' + error.message);
        }
});

exports.getListingById = functions.https.onRequest((req, res) => {
    // Enable CORS
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST');

    // Check for POST request
    if (req.method !== 'POST') {
        res.status(400).send('Please send a POST request');
        return;
    }

    // Check for request body
    if (!req.body || !req.body.id) {
        res.status(400).send('Request body missing or invalid');
        return;
    }

    // Fetch data from Firestore
    admin.firestore().collection('feedbacks').doc(req.body.id).get()
        .then(doc => {
            if (!doc.exists) {
                res.status(404).send('No listing found');
                return;
            }
            res.json({ id: doc.id, ...doc.data() });
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            res.status(500).send('Internal Server Error');
        });
});

exports.getLocationData = functions.https.onCall(async (data, context) => {
  try {
    const doc = await admin.firestore().collection('feedbacks').doc(data.locationId).get();
    if (doc.exists) {
      return { data: doc.data(), id: doc.id };
    } else {
      throw new functions.https.HttpsError('not-found', 'No document found');
    }
  } catch (error) {
    console.error('Error getting data:', error);
    throw new functions.https.HttpsError('internal', 'Error getting data');
  }
});

exports.getMaxPrice = functions.https.onRequest(async (req, res) => {
  // Handle Preflight request
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Origin', 'https://thewirednomad.com');
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.status(204).send('');
    return;
  }

  // Enable CORS for actual request
  res.set('Access-Control-Allow-Origin', 'https://thewirednomad.com');

  try {
    const feedbacksSnapshot = await admin.firestore().collection('feedbacks').get();
    const prices = feedbacksSnapshot.docs.map(doc => doc.data().price || 0);
    const maxPrice = Math.max(...prices);
    res.status(200).json({ maxPrice });
  } catch (error) {
    console.error('Error getting max price:', error);
    res.status(500).send('Internal Server Error');
  }
});

// For Hardware component
exports.fetchSpeedTests = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST');
  const db = admin.firestore();

  try {
    const collectionName = req.query.collection;
    const speedTestsCollection = db.collection(collectionName);
    const snapshot = await speedTestsCollection.get();

    const speedTests = snapshot.docs.map(doc => {
      const data = doc.data();
      const downloadSpeedInMbps = data.download.bandwidth / 125000;
      const uploadSpeedInMbps = data.upload.bandwidth / 125000;

      return {
        ...data,
        downloadSpeed: downloadSpeedInMbps,
        uploadSpeed: uploadSpeedInMbps,
        pingSpeed: data.ping.latency,
        jitterSpeed: data.ping.jitter
      };
    });

    res.status(200).json(speedTests);
  } catch (error) {
    console.error('Error fetching speed tests:', error);
    res.status(500).send('Internal Server Error');
  }
});

// For Hardware component
exports.fetchLatestTestResults = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST');

  const db = admin.firestore();

  // Check if the 'collection' query parameter is present
  const collectionName = req.query.collection;
  if (!collectionName) {
    console.error('Missing collection query parameter');
    res.status(400).send('Bad Request: Missing collection query parameter');
    return;
  }

  console.log(`Received request for collection: ${collectionName}`);

  try {
    const speedTestsCollection = db.collection(collectionName);

    // Order the documents by timestamp in descending order and limit to 1
    const snapshot = await speedTestsCollection.orderBy('timestamp', 'desc').limit(1).get();

    if (snapshot.empty) {
      console.log('No speed tests found in collection:', collectionName);
      res.status(404).send('No speed tests found');
      return;
    }

    const latestSpeedTestDoc = snapshot.docs[0];
    const latestSpeedTestData = latestSpeedTestDoc.data();
    console.log('Latest speed test data:', latestSpeedTestData);

    const latestSpeedTest = {
      ...latestSpeedTestData,
      downloadSpeed: latestSpeedTestData.download.bandwidth / 125000,
      uploadSpeed: latestSpeedTestData.upload.bandwidth / 125000,
      pingSpeed: latestSpeedTestData.ping.latency,
      jitterSpeed: latestSpeedTestData.ping.jitter,
    };

    res.status(200).json(latestSpeedTest);
  } catch (error) {
    console.error('Error fetching latest speed test:', error);
    res.status(500).send('Internal Server Error');
  }
});

exports.getHostName = functions.https.onRequest(async (req, res) => {
    // Handle Preflight request
    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Origin', 'https://thewirednomad.com');
      res.set('Access-Control-Allow-Methods', 'GET, POST');
      res.set('Access-Control-Allow-Headers', 'Content-Type');
      res.status(204).send('');
      return;
    }

    // Set CORS headers
    res.set('Access-Control-Allow-Origin', 'https://thewirednomad.com');
    res.set('Access-Control-Allow-Methods', 'GET, POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    try {
      // Get the document ID from the query parameters
      const documentId = req.query.documentId;

      // Assuming your collection is named 'feedbacks'
      const docRef = admin.firestore().collection('feedbacks').doc(documentId);

      // Get the document data
      const doc = await docRef.get();

      if (!doc.exists) {
        res.status(404).json({ error: 'Document not found' });
        return;
      }

      // Retrieve the hostName field
      const hostName = doc.data().hostName;

      // Send the hostName in the response
      res.status(200).json({ hostName });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Get dropouts from latest timestamp
exports.getTotalDropoutsLast24Hours = functions.https.onRequest(async (req, res) => {
    // Handle Preflight request
    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Origin', 'https://thewirednomad.com');
      res.set('Access-Control-Allow-Methods', 'GET, POST');
      res.set('Access-Control-Allow-Headers', 'Content-Type');
      res.status(204).send('');
      return;
    }

    // Set CORS headers
    res.set('Access-Control-Allow-Origin', 'https://thewirednomad.com');
    res.set('Access-Control-Allow-Methods', 'GET, POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    try {
      const hostName = req.query.hostName;
      console.log('Received request for hostName:', hostName);

      if (!hostName) {
        return res.status(400).json({ error: 'Missing hostName parameter' });
      }

      // Reference to the "{hostName}-dropoutStats" collection
      const collectionRef = firestore.collection(`${hostName}-dropoutStats`);

      // Query documents in descending order by timestamp and limit to one document
      const querySnapshot = await collectionRef.orderBy('timestamp', 'desc').limit(1).get();

      if (querySnapshot.empty) {
        return res.status(404).json({ error: 'No documents found in the collection' });
      }

      // Get the latest document
      const latestDocument = querySnapshot.docs[0].data();

      // Extract the "totalDropoutsLast24Hours" field
      const totalDropoutsLast24Hours = latestDocument.totalDropoutsLast24Hours;

      return res.status(200).json({ totalDropoutsLast24Hours });
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Handle create checkout session request
const createCheckoutSessionHandler = functions.https.onRequest(async (req, res) => {
  // Handle Preflight request
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Origin', 'https://thewirednomad.com');
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.status(204).send('');
    return;
  }

  // Set CORS headers
  res.set('Access-Control-Allow-Origin', 'https://thewirednomad.com');
  res.set('Access-Control-Allow-Methods', 'POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  const { tier } = req.body;
  console.log('Received request with tier:', tier);

  // Your logic to determine the price and other details based on the tier
  let priceId;
  switch (tier) {
    case 'silver':
      priceId = 'price_1Oft1yKGOtHP6zWlhbVWdWtZ';
      break;
    case 'gold':
      priceId = 'price_1OLUlyKGOtHP6zWlvC0qN8gf';
      break;
    case 'diamond':
      priceId = 'price_1OLUo1KGOtHP6zWl5nnnsoEy';
      break;
    default:
      return res.status(400).json({ error: 'Invalid tier' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        }
      ],
      mode: 'payment',
      success_url: 'https://thewirednomad.com/successfulOrder?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://thewirednomad.com/cancel.html',
    });

    // Include clientSecret in the response
    res.json({ id: session.id, clientSecret: session.client_secret });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Handle successful order
const successfulOrderHandler = functions.https.onRequest(async (req, res) => {
  // Handle Preflight request
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Origin', 'https://thewirednomad.com');
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.status(204).send('');
    return;
  }
  const session_id = req.query.session_id;

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);
    const customer = await stripe.customers.retrieve(session.customer);

    res.send(`<html><body><h1>Thanks for your order, ${customer.name}!</h1></body></html>`);
  } catch (error) {
    console.error('Error retrieving successful order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export the Express app as Firebase Cloud Functions
exports.createCheckoutSession = createCheckoutSessionHandler;
exports.successfulOrder = successfulOrderHandler;


exports.linkExists = functions.https.onRequest(async (req, res) => {
  // Handle Preflight request
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Origin', 'https://thewirednomad.com');
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.status(204).send('');
    return;
  }

  res.set('Access-Control-Allow-Origin', 'https://thewirednomad.com');
  res.set('Access-Control-Allow-Methods', 'POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  const db = admin.firestore();
  //console.log('link:', link);

  try {
    console.log('Incoming request:', req.body);
    const link = req.body.cleanLink;

    // Check for the existence of the link in airbnbLink, vrboLink, and nomadstaysLink fields
    const fieldNameArray = ['airbnbLink', 'vrboLink', 'nomadstaysLink'];

    const linkExistsPromises = fieldNameArray.map(async fieldName => {
      const querySnapshot = await db.collection('feedbacks').where(fieldName, '==', link).get();
      return !querySnapshot.empty;
    });

    const linkAlreadyExists = await Promise.all(linkExistsPromises);

    if (linkAlreadyExists.some(exists => exists)) {
      // Link already exists, respond accordingly
      res.status(200).json({ exists: true });
      return;
    }

    // Link doesn't exist
    res.status(200).json({ exists: false });
    return;

  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

exports.getCitiesAndCountries = functions.https.onRequest(async (req, res) => {
  // Handle Preflight request
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Origin', 'https://thewirednomad.com');
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.status(204).send('');
    return;
  }
  res.set('Access-Control-Allow-Origin', 'https://thewirednomad.com');
  res.set('Access-Control-Allow-Methods', 'POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  const db = admin.firestore();

  try {
    console.log('Received request:', req.body); // Log received request body

    // Fetch cities and countries separately
    const citiesSnapshot = await db.collection('stats').doc('cities').get();
    const countriesSnapshot = await db.collection('stats').doc('countries').get();

    // Check if the snapshots exist and contain data
    if (!citiesSnapshot.exists || !countriesSnapshot.exists) {
      res.status(404).send('Document not found');
      return;
    }

    // Extract data from snapshots
    const cities = citiesSnapshot.data().cities || [];
    const countries = countriesSnapshot.data().countries || [];

    // Prepare response data
    const responseData = { cities, countries };

    res.status(200).json(responseData);

  } catch (error) {
    console.error('Error:', error); // Log error
    res.status(500).send(error.toString());
  }
});
