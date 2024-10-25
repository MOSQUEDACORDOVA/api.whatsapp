const axios = require('axios');
const fs = require('fs');

async function sendMessage(sock, chatId, message, type = 'text', caption = '') {
    try {
        let messageOptions;

        switch (type) {
            case 'text':
                messageOptions = { text: message };
                break;

            case 'image':
                // Descargar imagen desde la URL
                const imageBuffer = await downloadMedia(message);
                messageOptions = {
                    image: imageBuffer,
                    caption: caption || ''
                };
                break;

            case 'video':
                // Descargar video desde la URL
                const videoBuffer = await downloadMedia(message);
                messageOptions = {
                    video: videoBuffer,
                    caption: caption || ''
                };
                break;

            case 'audio':
                // Descargar audio desde la URL
                const audioBuffer = await downloadMedia(message);
                messageOptions = {
                    audio: audioBuffer,
                    mimetype: 'audio/mpeg', // Especifica el tipo MIME
                    ptt: true // Esto hace que se envíe como una nota de voz
                };
                break;

            default:
                throw new Error('Tipo de mensaje no soportado');
        }

        await sock.sendMessage(chatId, messageOptions);
        console.log(`Mensaje enviado a ${chatId}: ${message}`);
    } catch (error) {
        console.error('Error al enviar el mensaje:', error);
        throw error; // Lanza el error para que pueda ser manejado por el llamador
    }
}

// Función para descargar multimedia desde una URL
async function downloadMedia(url) {
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'arraybuffer' // Necesitamos el archivo como un buffer binario
    });

    return Buffer.from(response.data, 'binary');
}

module.exports = { sendMessage };
