const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// ✅ CORS configuré pour limiter aux domaines autorisés (comme ton site)
app.use(cors({
    origin: ['https://www.ongajdl.org'],
    methods: ['POST'],
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 📂 Configuration stockage des fichiers
const storage = multer.memoryStorage();
const upload = multer({ storage });

// 📧 Configuration Nodemailer
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// 📩 Route pour recevoir le formulaire individuel
app.post('/submit', upload.fields([{ name: 'cv' }, { name: 'code_conduite' }]), async (req, res) => {
    try {
        const formData = req.body;
        const files = req.files;

        // 🔵 Format du message en tableau HTML
        let messageHtml = `<h2>Nouvelle Candidature</h2><table border="1" cellpadding="6" cellspacing="0">`;
        for (const key in formData) {
            messageHtml += `<tr><td><strong>${key}</strong></td><td>${formData[key]}</td></tr>`;
        }
        messageHtml += `</table>`;

        // 🔵 Envoi du mail
        await transporter.sendMail({
            from: `"Formulaire Candidature" <${process.env.SMTP_USER}>`,
            to: process.env.RECEIVER_EMAIL,
            subject: "Nouvelle Candidature Reçue",
            html: messageHtml,
            attachments: [
                {
                    filename: files.cv[0].originalname,
                    content: files.cv[0].buffer
                },
                {
                    filename: files.code_conduite[0].originalname,
                    content: files.code_conduite[0].buffer
                }
            ]
        });

        res.redirect('https://www.ongajdl.org/index.html');
    } catch (error) {
        console.error(error);
        res.status(500).send('Erreur lors de l’envoi du mail.');
    }
});

// 📩 Route pour le formulaire organisation
app.post('/submit-org', upload.single('documents_zip'), async (req, res) => {
    try {
        const formData = req.body;
        const file = req.file;

        // 🔵 Format du message en tableau HTML
        let messageHtml = `<h2>Nouvelle candidature d'organisation</h2><table border="1" cellpadding="6" cellspacing="0">`;
        for (const key in formData) {
            messageHtml += `<tr><td><strong>${key}</strong></td><td>${formData[key]}</td></tr>`;
        }
        messageHtml += `</table>`;

        const attachments = file ? [{
            filename: file.originalname,
            content: file.buffer
        }] : [];

        await transporter.sendMail({
            from: `"Formulaire Organisation" <${process.env.SMTP_USER}>`,
            to: process.env.RECEIVER_EMAIL,
            subject: "Nouvelle candidature d'organisation",
            html: messageHtml,
            attachments
        });

        res.redirect('https://www.ongajdl.org/index.html');
    } catch (error) {
        console.error(error);
        res.status(500).send('Erreur lors de l’envoi du mail.');
    }
});

// ✅ Port dynamique pour Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur démarré sur http://localhost:${PORT}`));
