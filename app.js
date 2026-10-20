const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const dotenv = require('dotenv');
const cors = require("cors");

dotenv.config();

const app = express();

const router = express.Router();


const PORT = process.env.PORT || 3000;

const serviceAccount = process.env.environ=='prod' ? require('./service-account-prod.json') : require('./service-account.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

app.use(cors());

app.use(bodyParser.json());

app.use(express.json());

app.use('/api/v1', router);

app.use

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});

// Looks up a collaborator by email. Callers should send their Firebase ID token.
// App versions up to 1.5.0+35 send none, so a missing token is only rejected
// once REQUIRE_AUTH=true is set.
router.get('/getUserDataByEmail', async (req, res) => {
    const { email } = req.query;
    const match = (req.headers.authorization || '').match(/^Bearer (.+)$/);
    if (match) {
        try {
            await admin.auth().verifyIdToken(match[1]);
        } catch (error) {
            return res.status(401).send('Invalid token');
        }
    } else if (process.env.REQUIRE_AUTH === 'true') {
        return res.status(401).send('Missing token');
    }
    admin.auth().getUserByEmail(email)
        .then((userRecord) => {
            // Only what the app needs; the full record has providers, metadata, phone number etc.
            res.status(200).json({
                uid: userRecord.uid,
                email: userRecord.email,
                displayName: userRecord.displayName,
                photoURL: userRecord.photoURL,
            });
        })
        .catch((error) => {
            // Error occurred while retrieving the user data
            console.error('Error retrieving user data:', error);
            res.status(500).send('Error retrieving user data');
        });
});