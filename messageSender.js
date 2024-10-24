// messageSender.js
async function sendMessage(sock, chatId, message) {
    try {
        await sock.sendMessage(chatId, { text: message });
        console.log(`Mensaje enviado a ${chatId}: ${message}`);
    } catch (error) {
        console.error('Error al enviar el mensaje:', error);
        throw error; // Lanza el error para que pueda ser manejado por el llamador
    }
}

module.exports = { sendMessage };
