const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

// 1. CONFIGURACIÓN DEL BOT
const TOKEN = process.env.TELEGRAM_TOKEN; 
const bot = new TelegramBot(TOKEN, { polling: true });

// 2. CONFIGURACIÓN DEL SERVIDOR PARA RECIBIR DATOS DE GOOGLE
const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;

console.log("🚀 Bot de Yango con enlaces e integración de Google Forms activa...");

// --- LINKS DE TUS GOOGLE FORMS ---
// Reemplaza estos enlaces por los links reales para enviar a los usuarios
const LINKS_FORMS = {
    puntos: "https://forms.gle/TuFormDePuntos",
    recargas: "https://forms.gle/TuFormDeRecargas",
    usuarios: "https://forms.gle/TuFormDeUsuarios"
};

// --- MENÚ PRINCIPAL ---
function sendMainMenu(chatId) {
    bot.sendMessage(chatId, "¡Bienvenido al Bot de Soporte de Yango! ¿En qué te puedo ayudar hoy?", {
        reply_markup: {
            inline_keyboard: [
                [{ text: "🎟️ Restitución de puntos", callback_data: "menu_puntos" }],
                [{ text: "💳 Problemas con pagos", callback_data: "menu_pagos" }]
            ]
        }
    });
}

bot.onText(/\/start/, (msg) => {
    sendMainMenu(msg.chat.id);
});

// --- ENRUTADOR DE BOTONES EN TELEGRAM ---
bot.on('callback_query', (callbackQuery) => {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const data = callbackQuery.data;

    bot.answerCallbackQuery(callbackQuery.id);

    if (data === 'menu_inicio') {
        sendMainMenu(chatId);
        return;
    }

    if (data === 'menu_puntos') {
        bot.sendMessage(chatId, "🎯 *Restitución de puntos*\n\nTu ID de Telegram es: `" + chatId + "` (Cópialo, lo necesitarás en el formulario).\n\nIngresa al enlace para completar tu reporte:", { 
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: "📝 Abrir Formulario de Puntos", url: LINKS_FORMS.puntos }],
                    [{ text: "🔙 Volver al Inicio", callback_data: "menu_inicio" }]
                ]
            }
        });
    }

    else if (data === 'menu_pagos') {
        bot.sendMessage(chatId, "💵 *Problemas con pagos*\n\nPor favor, selecciona la opción que mejor describa tu caso:", {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: "❌ Problemas con las recargas", callback_data: "form_recargas" }],
                    [{ text: "👤 Problemas con pago de usuarios", callback_data: "form_usuarios" }],
                    [{ text: "🔙 Volver al Inicio", callback_data: "menu_inicio" }]
                ]
            }
        });
    }

    else if (data === 'form_recargas') {
        bot.sendMessage(chatId, "📥 *Formulario de Recargas*\n\nTu ID de Telegram es: `" + chatId + "`\n\nIngresa al siguiente enlace para reportar el inconveniente:", {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: "📝 Abrir Formulario de Recargas", url: LINKS_FORMS.recargas }],
                    [{ text: "🔙 Volver al Inicio", callback_data: "menu_inicio" }]
                ]
            }
        });
    }

    else if (data === 'form_usuarios') {
        bot.sendMessage(chatId, "👤 *Formulario de Pago de Usuarios*\n\nTu ID de Telegram es: `" + chatId + "`\n\nIngresa al siguiente enlace para reportar el caso:", {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: "📝 Abrir Formulario de Usuarios", url: LINKS_FORMS.usuarios }],
                    [{ text: "🔙 Volver al Inicio", callback_data: "menu_inicio" }]
                ]
            }
        });
    }
});

// --- RECEPTOR DE ALERTAS DESDE GOOGLE SHEETS ---
// Cuando la hoja de cálculo nos avise de una respuesta, esto se activa
app.post('/webhook-google-forms', (req, { res }) => {
    const { telegramId, tipoFormulario } = req.body;

    if (telegramId) {
        const mensajeConfirmacion = `🧾 *REGISTRO EXITOSO*\n` +
                                    `----------------------------------\n` +
                                    `✅ Tu formulario de *${tipoFormulario}* ha sido recibido con éxito.\n\n` +
                                    `⏳ Tendremos una respuesta para ti en un lapso *menor a 24 horas*.\n` +
                                    `----------------------------------`;

        bot.sendMessage(telegramId, mensajeConfirmacion, { parse_mode: 'Markdown' });
    }
    
    return req.res.status(200).send({ success: true });
});

// Encendemos el servidor web
app.listen(PORT, () => {
    console.log(`📡 Servidor Webhook escuchando en el puerto ${PORT}`);
});
