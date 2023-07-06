const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');


const app = express();

const router = express.Router();

const PORT = process.env.PORT || 3000;

const serviceAccount = require('./service-account.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

app.use(bodyParser.json());

app.use(express.json());

app.use('/api/v1', router);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});

router.get('/getUserDataByEmail', (req, res) => {
    const { email } = req.query;
    console.log(req.query);
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