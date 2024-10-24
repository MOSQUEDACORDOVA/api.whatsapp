const express = require('express');
const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const QRCode = require('qrcode');

const app = express();
const port = 3000;


// Variable para almacenar el QR
let qrCode;

// Ruta para la página de inicio
app.get('/', (req, res) => {
    res.send('<h1>Bienvenido al Generador de Código QR para WhatsApp</h1><a href="/qr">Ver Código QR</a>');
});

// Ruta para mostrar el QR
app.get('/qr', (req, res) => {
    res.send('<h1>Código QR para WhatsApp</h1><img id="qr" /><script src="https://code.jquery.com/jquery-3.6.0.min.js"></script><script>setInterval(() => {$.get("/qr-data", (data) => {$("#qr").attr("src", data);});}, 1000);</script>');
});

// Ruta para obtener los datos del QR
app.get('/qr-data', (req, res) => {
    if (qrCode) {
        console.log('Enviando código QR al navegador...'); // Mensaje de depuración
        res.send(qrCode);
    } else {
        console.log('Código QR no disponible, revisa la generación.'); // Mensaje de depuración
        res.status(404).send('Código QR no disponible.');
    }
});

// Función para iniciar el socket
async function start() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false, // No imprimir en terminal
    });

    sock.ev.on('creds.update', saveCreds);

    // Escuchar actualizaciones de conexión
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        console.log('Actualización de conexión:', connection);
        if (connection === 'close') {
            console.log('Conexión cerrada, intentando reconectar...', lastDisconnect.error);
            start(); // Intentar reconectar
        } else if (connection === 'open') {
            console.log('Conectado a WhatsApp!');
        }
    });

    // Escuchar la generación del código QR
    sock.ev.on('qr', (qr) => {
        console.log('Generando código QR...');
        QRCode.toDataURL(qr, (err, url) => {
            if (err) {
                console.error('Error generando el código QR:', err);
                return;
            }
            qrCode = url; // Almacenar el QR en la variable
            console.log('Código QR generado y almacenado:', qrCode); // Confirmación de generación
        });
    });
}

// Iniciar el socket y luego el servidor Express
start().then(() => {
    app.listen(port, () => {
        console.log(`Servidor escuchando en http://localhost:${port}`);
    });
});
