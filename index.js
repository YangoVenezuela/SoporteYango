const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

// 1. CONFIGURACIÓN DEL BOT
const TOKEN = process.env.TELEGRAM_TOKEN; 
const bot = new TelegramBot(TOKEN, { polling: true });

// 2. CONFIGURACIÓN DEL SERVIDOR WEB (WEBHOOK)
const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;

console.log("🚀 Bot de Yango con enlaces reales e integración de Google Forms activa...");

// --- LINKS REALES DE TUS GOOGLE FORMS ---
const LINKS_FORMS = {
    puntos: "https://forms.gle/B9ST2RQ8jKyZvY4M7",
    recargas: "https://forms.gle/g9yL397cgixBudp66",
    pagos: "https://forms.gle/pnXFUyYMrVustFW17"
};

// --- FUNCIÓN: MENÚ PRINCIPAL ---
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

// Escuchar comando /start
bot.onText(/\/start/, (msg) => {
    sendMainMenu(msg.chat.id);
});

// --- ENRUTADOR DE BOTONES (TELEGRAM) ---
bot.on('callback_query', (callbackQuery) => {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const data = callbackQuery.data;

    bot.answerCallbackQuery(callbackQuery.id);

    // Acción para volver al inicio
    if (data === 'menu_inicio') {
        sendMainMenu(chatId);
        return;
    }

    // LÍNEA DE PUNTOS -> Envía directo al Form de Puntos
    if (data === 'menu_puntos') {
        bot.sendMessage(chatId, "🎯 *Restitución de puntos*\n\nTu ID de Telegram es: `" + chatId + "`\n\n⚠️ *IMPORTANTE:* Copia ese número de arriba, ya que es obligatorio que lo pegues dentro del formulario.\n\nIngresa al enlace para completar tu reporte:", { 
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: "📝 Abrir Formulario de Puntos", url: LINKS_FORMS.puntos }],
                    [{ text: "🔙 Volver al Inicio", callback_data: "menu_inicio" }]
                ]
            }
        });
    }

    // LÍNEA DE PAGOS -> Menú intermedio
    else if (data === 'menu_pagos') {
        bot.sendMessage(chatId, "💵 *Problemas con pagos*\n\nPor favor, selecciona la opción que mejor describa tu caso para darte el formulario correcto:", {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: "❌ Problemas con las recargas", callback_data: "form_recargas" }],
                    [{ text: "👤 Problemas con pagos en general", callback_data: "form_pagos_general" }],
                    [{ text: "🔙 Volver al Inicio", callback_data: "menu_inicio" }]
                ]
            }
        });
    }

    // SUB-LÍNEA: RECARGAS NO PROCESADAS
    else if (data === 'form_recargas') {
        bot.sendMessage(chatId, "📥 *Recargas no procesadas*\n\nTu ID de Telegram es: `" + chatId + "`\n\n⚠️ *IMPORTANTE:* Copia ese número de arriba, ya que es obligatorio que lo pegues dentro del formulario.\n\nIngresa al siguiente enlace para reportar el inconveniente:", {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: "📝 Abrir Formulario de Recargas", url: LINKS_FORMS.recargas }],
                    [{ text: "🔙 Volver al Inicio", callback_data: "menu_inicio" }]
                ]
            }
        });
    }

    // SUB-LÍNEA: PROBLEMAS CON PAGOS (GENERAL)
    else if (data === 'form_pagos_general') {
        bot.sendMessage(chatId, "👤 *Problemas con pagos*\n\nTu ID de Telegram es: `" + chatId + "`\n\n⚠️ *IMPORTANTE:* Copia ese número de arriba, ya que es obligatorio que lo pegues dentro del formulario.\n\nIngresa al siguiente enlace para reportar tu caso:", {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: "📝 Abrir Formulario de Pagos", url: LINKS_FORMS.pagos }],
                    [{ text: "🔙 Volver al Inicio", callback_data: "menu_inicio" }]
                ]
            }
        });
    }
});

// --- RECEPTOR DE ALERTAS DESDE GOOGLE SHEETS ---
app.post('/webhook-google-forms', (req, res) => {
    const { telegramId, tipoFormulario } = req.body;

    if (telegramId) {
        const mensajeConfirmacion = `🧾 *REGISTRO EXITOSO*\n` +
                                    `----------------------------------\n` +
                                    `✅ Tu formulario de *${tipoFormulario}* ha sido recibido con éxito.\n\n` +
                                    `⏳ Tendremos una respuesta para ti en un lapso *menor a 24 horas*.\n` +
                                    `----------------------------------`;

        bot.sendMessage(telegramId, mensajeConfirmacion, { parse_mode: 'Markdown' });
    }
    
    return res.status(200).send({ success: true });
});

// Iniciar el servidor express
app.listen(PORT, () => {
    console.log(`📡 Servidor Webhook escuchando en el puerto ${PORT}`);
});
