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

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});

router.get('/getUserDataByEmail', (req, res) => {
    const { email } = req.query;
    admin.auth().getUserByEmail(email)
        .then((userRecord) => {
            // Successfully retrieved the user data
            res.status(200).json(userRecord);
        })
        .catch((error) => {
            // Error occurred while retrieving the user data
            console.error('Error retrieving user data:', error);
            res.status(500).send('Error retrieving user data');
        });
});

// Encryption keys for notes, only for signed-in users with a verified email.
// ENCRYPTION_KEY is the original key (old notes), ENCRYPTION_KEY_V2 the key for new notes.
router.get('/encryptionKeys', async (req, res) => {
    const match = (req.headers.authorization || '').match(/^Bearer (.+)$/);
    if (!match) {
        return res.status(401).send('Missing token');
    }
    let decodedToken;
    try {
        decodedToken = await admin.auth().verifyIdToken(match[1]);
    } catch (error) {
        return res.status(401).send('Invalid token');
    }
    if (!decodedToken.email_verified) {
        return res.status(403).send('Email not verified');
    }
    if (!process.env.ENCRYPTION_KEY) {
        console.error('ENCRYPTION_KEY is not set');
        return res.status(500).send('Encryption keys not configured');
    }
    res.set('Cache-Control', 'no-store');
    res.status(200).json({
        key: process.env.ENCRYPTION_KEY_V2 || process.env.ENCRYPTION_KEY,
        legacyKey: process.env.ENCRYPTION_KEY,
    });
});