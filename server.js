require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Middleware do obsługi błędów
const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Wystąpił błąd serwera.' });
};

// Połączenie z MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Połączono z MongoDB!'))
    .catch(err => console.error('Błąd połączenia z MongoDB:', err));

// Schemat zgłoszenia
const contactSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Imię i nazwisko jest wymagane'],
        trim: true,
        minlength: [2, 'Imię i nazwisko musi mieć minimum 2 znaki']
    },
    email: {
        type: String,
        required: [true, 'Email jest wymagany'],
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Podaj prawidłowy adres email']
    },
    subject: {
        type: String,
        required: [true, 'Temat jest wymagany'],
        trim: true,
        minlength: [3, 'Temat musi mieć minimum 3 znaki']
    },
    message: {
        type: String,
        required: [true, 'Wiadomość jest wymagana'],
        trim: true,
        minlength: [10, 'Wiadomość musi mieć minimum 10 znaków']
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

const Contact = mongoose.model('Contact', contactSchema);

// Endpoint do przyjmowania zgłoszeń
app.post('/api/contact', async (req, res, next) => {
    try {
        const { name, email, subject, message } = req.body;
        
        // Walidacja danych
        if (!name || !email || !subject || !message) {
            return res.status(400).json({ 
                error: 'Wszystkie pola są wymagane.',
                details: {
                    name: !name ? 'Imię i nazwisko jest wymagane' : null,
                    email: !email ? 'Email jest wymagany' : null,
                    subject: !subject ? 'Temat jest wymagany' : null,
                    message: !message ? 'Wiadomość jest wymagana' : null
                }
            });
        }

        const contact = new Contact({ name, email, subject, message });
        await contact.save();
        
        res.status(201).json({ 
            success: true,
            message: 'Wiadomość została wysłana pomyślnie.'
        });
    } catch (err) {
        if (err.name === 'ValidationError') {
            return res.status(400).json({ 
                error: 'Błąd walidacji',
                details: Object.values(err.errors).map(e => e.message)
            });
        }
        next(err);
    }
});

// Endpoint do pobierania zgłoszeń (tylko dla admina - później dodamy autentykację)
app.get('/api/contacts', async (req, res, next) => {
    try {
        const contacts = await Contact.find()
            .sort({ createdAt: -1 })
            .limit(50);
        res.json(contacts);
    } catch (err) {
        next(err);
    }
});

// Użycie middleware do obsługi błędów
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serwer działa na porcie ${PORT}`);
});
