const express = require('express');
const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const QRCode = require('qrcode-terminal');

const app = express();
app.use(express.json()); // Middleware para parsear JSON

async function start() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
    });

    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            console.log('Conexión cerrada, intentando reconectar...', lastDisconnect.error);
            start(); // Intentar reconectar
        } else if (connection === 'open') {
            console.log('Conectado a WhatsApp!');
        }
    });

    // Escuchar mensajes entrantes
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.key.fromMe && m.type === 'notify') {
            console.log(`Nuevo mensaje: ${msg.message.conversation}`);
        }
    });

    // Escuchar la generación del código QR
    sock.ev.on('qr', (qr) => {
        console.log('Generando código QR...');
        QRCode.generate(qr, { small: true });
    });

    // Endpoint para enviar mensajes
    app.post('/send', async (req, res) => {
        const { chatId, message } = req.body;
        try {
            await sock.sendMessage(chatId, { text: message });
            console.log(`Mensaje enviado a ${chatId}: ${message}`);
            res.status(200).json({ status: 'success', message: 'Mensaje enviado' });
        } catch (error) {
            console.error('Error al enviar el mensaje:', error);
            res.status(500).json({ status: 'error', message: 'Error al enviar el mensaje' });
        }
    });

    // Iniciar el servidor
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Servidor escuchando en el puerto ${PORT}`);
    });
}

start();
