const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

const TOKEN = process.env.TELEGRAM_TOKEN; 
const bot = new TelegramBot(TOKEN, { polling: true });

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;

console.log("🚀 Bot de Yango optimizado con comprobante por Cédula...");

// --- CONFIGURACIÓN DE LINKS PRE-RELLENADOS ---
// TODO: Debes obtener el "entry ID" de la pregunta ID de Telegram de cada form.
// Reemplaza "entry.XXXXX" por el número real que te dé Google Forms.
function getFormUrl(tipo, chatId) {
    const baseUrls = {
        puntos: "https://forms.gle/B9ST2RQ8jKyZvY4M7",
        recargas: "https://forms.gle/g9yL397cgixBudp66",
        pagos: "https://forms.gle/pnXFUyYMrVustFW17"
    };

    // Al agregar ?entry.XXXXX= el ID viaja de forma automática en el link
    if (tipo === 'puntos') return `${baseUrls.puntos}?entry.123456789=${chatId}`;
    if (tipo === 'recargas') return `${baseUrls.recargas}?entry.123456789=${chatId}`;
    if (tipo === 'pagos') return `${baseUrls.pagos}?entry.123456789=${chatId}`;
}

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

bot.onText(/\/start/, (msg) => { sendMainMenu(msg.chat.id); });

bot.on('callback_query', (callbackQuery) => {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const data = callbackQuery.data;
    bot.answerCallbackQuery(callbackQuery.id);

    if (data === 'menu_inicio') { sendMainMenu(chatId); return; }

    if (data === 'menu_puntos') {
        bot.sendMessage(chatId, "🎯 *Restitución de puntos*\n\nPor favor, ingresa al siguiente enlace para completar tu reporte. Tus datos de validación se cargarán automáticamente:", { 
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: "📝 Abrir Formulario", url: getFormUrl('puntos', chatId) }],
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
                    [{ text: "👤 Problemas con pagos en general", callback_data: "form_pagos" }],
                    [{ text: "🔙 Volver al Inicio", callback_data: "menu_inicio" }]
                ]
            }
        });
    }
    else if (data === 'form_recargas') {
        bot.sendMessage(chatId, "📥 *Recargas no procesadas*\n\nIngresa al enlace para reportar el inconveniente con tu recarga:", {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: "📝 Abrir Formulario", url: getFormUrl('recargas', chatId) }],
                    [{ text: "🔙 Volver al Inicio", callback_data: "menu_inicio" }]
                ]
            }
        });
    }
    else if (data === 'form_pagos') {
        bot.sendMessage(chatId, "👤 *Problemas con pagos*\n\nIngresa al enlace para reportar tu caso:", {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: "📝 Abrir Formulario", url: getFormUrl('pagos', chatId) }],
                    [{ text: "🔙 Volver al Inicio", callback_data: "menu_inicio" }]
                ]
            }
        });
    }
});

// --- RECEPTOR DESDE GOOGLE SHEETS (Modificado para usar Cédula) ---
app.post('/webhook-google-forms', (req, res) => {
    const { telegramId, tipoFormulario, cedula } = req.body;

    if (telegramId) {
        // Si no viene la cédula por algún motivo, usamos un número genérico
        const identificador = cedula || "Registrado";

        const mensajeConfirmacion = `🧾 *COMPROBANTE DE SOPORTE YANGON*\n` +
                                    `----------------------------------\n` +
                                    `🆔 *Identificación / Cédula:* \`${identificador}\`\n` +
                                    `📁 *Categoría:* ${tipoFormulario}\n` +
                                    `👤 *Agente:* Sistema Automático\n` +
                                    `----------------------------------\n` +
                                    `✅ Tu reporte ha sido recibido con éxito.\n\n` +
                                    `⏳ Tendremos una respuesta para ti en un lapso *menor a 24 horas*.`;

        bot.sendMessage(telegramId, mensajeConfirmacion, { parse_mode: 'Markdown' });
    }
    return res.status(200).send({ success: true });
});

app.listen(PORT, () => { console.log(`📡 Servidor Webhook activo en puerto ${PORT}`); });
