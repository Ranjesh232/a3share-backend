const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const File = require('../models/file');
const { v4: uuid4 } = require('uuid');

let storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const uniquename = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
        cb(null, uniquename);
    }
});

let upload = multer({
    storage: storage,
    limit: { fileSize: 100 * 1024 * 1024 },
}).single('myfile');

router.post('/', (req, res) => {
    //file storing
    upload(req, res, async (err) => {
        //request validation
        if (!req.file) {
            return res.json({ error: 'All fields are mandotary.' });
        }

        if (err) {
            return res.status(500).send({ error: err.message })
        }
        //store file in database
        const file = new File({
            filename: req.file.filename,
            path: req.file.path,
            size: req.file.size,
            uuid: uuid4(),
        });

        const response = await file.save();
        return res.json({ file: `${process.env.APP_BASE_URL}/files/${response.uuid}` });

    });
});

router.post('/send', async (req, res) => {
    const { uuid, emailTo, emailFrom } = req.body;
    if (!uuid || !emailTo || !emailFrom) {
        return res.status(422).send({ error: 'All fields are mandatory!' });
    }
    //Getting data from database
    const file = await File.findOne({ uuid: uuid });
    if (file.sender) {
        return res.status(422).send({ error: 'Email already sent!' });
    }

    file.sender = emailFrom;
    file.receiver = emailTo;
    const response = await file.save();

    //Sending Email
    const sendMail = require('../services/emailService');
    sendMail({
        from: emailFrom,
        to: emailTo,
        subject: 'A3Share file sharing',
        text: `${emailFrom} shared a file with you`,
        html: require('../services/emailTemplate')({
            emailFrom: emailFrom,
            download: `${process.env.APP_BASE_URL}/files/${file.uuid}`,
            size: parseInt(file.size / 1024) + 'KB',
            expires: '24 hours',
        }),
    });

    return res.send({ success: true });

});

module.exports = router;