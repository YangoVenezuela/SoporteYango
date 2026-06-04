const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

// 1. CONFIGURACIÓN DEL BOT
const TOKEN = process.env.TELEGRAM_TOKEN; 
const bot = new TelegramBot(TOKEN, { polling: true });

// 2. CONFIGURACIÓN DEL SERVIDOR WEB (WEBHOOK)
const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;

console.log("🚀 Servidor del Bot de Yango arrancando en modo Ultra-Resistente...");

// --- CONFIGURACIÓN AUTOMÁTICA DEL MENÚ DE COMANDOS ---
bot.setMyCommands([
    { command: 'start', description: '📱 Iniciar el Bot de Soporte / Menú Principal' }
]).then(() => {
    console.log("✅ Menú de comandos configurado correctamente en Telegram.");
}).catch((err) => {
    console.error("❌ Error al configurar comandos:", err);
});

// --- CONSTRUCTOR DE ENLACES INVISIBLES CON TUS ENTRADAS REALES ---
function getFormUrl(tipo, chatId) {
    if (tipo === 'pagos') {
        return `https://docs.google.com/forms/d/e/1FAIpQLSe_bLP8Upgn3nmJTCUJ3z7hsQ1e7nhk5Bv7J4fGB9CMw4EfPA/viewform?usp=pp_url&entry.1544457333=${chatId}`;
    }
    if (tipo === 'puntos') {
        return `https://docs.google.com/forms/d/e/1FAIpQLSegmduBwLH33grUqRlj402wI06xAgsMjqrAl1Y2HikCzVJlIg/viewform?usp=pp_url&entry.556681313=${chatId}`;
    }
    if (tipo === 'recargas') {
        return `https://docs.google.com/forms/d/e/1FAIpQLSds-p_CE8Tdu86kSytCt5h9zrZTXigJkApoc5axPFGKyOGG3g/viewform?usp=pp_url&entry.489691155=${chatId}`;
    }
}

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

    if (data === 'menu_inicio') {
        sendMainMenu(chatId);
        return;
    }

    if (data === 'menu_puntos') {
        bot.sendMessage(chatId, "🎯 *Restitución de puntos*\n\nPor favor, ingresa al siguiente enlace para completar tu reporte de puntos:", { 
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: "📝 Abrir Formulario de Puntos", url: getFormUrl('puntos', chatId) }],
                    [{ text: "🔙 Volver al Inicio", callback_data: "menu_inicio" }]
                ]
            }
        });
    }
    else if (data === 'menu_pagos') {
        bot.sendMessage(chatId, "💵 *Problemas con pagos*\n\nPor favor, selecciona la opción que mejor describa tu caso técnico para dirigirte al formulario correspondiente:", {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: "❌ Problemas con las recargas", callback_data: "form_recargas" }],
                    [{ text: "👤 Problemas con pagos de usuarios", callback_data: "form_pagos_general" }],
                    [{ text: "🔙 Volver al Inicio", callback_data: "menu_inicio" }]
                ]
            }
        });
    }
    else if (data === 'form_recargas') {
        bot.sendMessage(chatId, "📥 *Recargas no procesadas*\n\nPor favor, ingresa al enlace para reportar el inconveniente con tu recarga:", {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: "📝 Formulario de Recargas No Procesadas", url: getFormUrl('recargas', chatId) }],
                    [{ text: "🔙 Volver al Inicio", callback_data: "menu_inicio" }]
                ]
            }
        });
    }
    else if (data === 'form_pagos_general') {
        bot.sendMessage(chatId, "👤 *Problemas con pagos*\n\nPor favor, ingresa al siguiente enlace para reportar tu inconveniente con los pagos de usuarios:", {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: "📝 Formulario de Problemas con Pagos", url: getFormUrl('pagos', chatId) }],
                    [{ text: "🔙 Volver al Inicio", callback_data: "menu_inicio" }]
                ]
            }
        });
    }
});

// --- RECEPTOR DE ALERTAS DESDE GOOGLE SHEETS (REDISEÑADO POR COMPLETO) ---
app.post('/webhook-google-forms', (req, res) => {
    const { telegramId, tipoFormulario, cedula } = req.body;

    // Imprimir en consola de Railway para auditoría visual
    console.log(`📥 [NUEVA ENTRADA] ID: ${telegramId} | Form: ${tipoFormulario} | Cédula: ${cedula}`);

    if (!telegramId) {
        console.log("⚠️ Registro rechazado: No incluye un Telegram ID válido.");
        return res.status(200).send({ success: false, error: "Missing Telegram ID" });
    }

    const identificador = cedula || "Registrado";
    let mensaje = "";

    // 🎯 NUEVO DETECTOR DETALLADO: Si es una actualización manual desde el Excel
    // Compara en minúsculas y busca aproximaciones para evitar que falle por un espacio
    const origen = String(tipoFormulario).toUpperCase().trim();
    
    if (origen.includes("STATUS") || origen.includes("ACTUALIZACION") || origen === "SOPORTE") {
        console.log(`✨ Procesando notificación manual de estado para el ID: ${telegramId}`);
        mensaje =   `🔄 *ACTUALIZACIÓN DE TU REPORTE*\n` +
                    `----------------------------------\n` +
                    `🆔 *Cédula:* \`${identificador}\`\n` +
                    `⚙️ *Nuevo Estado:* Devolución automática 💳\n` +
                    `----------------------------------\n` +
                    `📢 Estimado conductor, te informamos que tu requerimiento ha sido procesado.\n\n` +
                    `⏳ Por favor, ingresa a tu aplicación para verificar la actualización.\n\n` +
                    `🏢 *Para cualquier duda, consulta a tu socio en su sede.*`;
    } 
    // Si viene del envío automático normal de los formularios
    else {
        console.log(`📝 Procesando confirmación de formulario para el ID: ${telegramId}`);
        mensaje = `🧾 *COMPROBANTE DE SOPORTE YANGO*\n` +
                  `----------------------------------\n` +
                  `🆔 *Identificación / Cédula:* \`${identificador}\`\n` +
                  `📁 *Categoría:* ${tipoFormulario}\n` +
                  `👤 *Agente:* Sistema Automático\n` +
                  `----------------------------------\n` +
                  `✅ Tu reporte ha sido recibido con éxito.\n\n` +
                  `⏳ Tendremos una respuesta para ti en un lapso *menor a 24 horas*.`;
    }

    // Ejecutar el envío hacia la API de Telegram de forma segura
    bot.sendMessage(telegramId, mensaje, { parse_mode: 'Markdown' })
        .then(() => {
            console.log(`✅ Mensaje enviado de forma exitosa a Telegram -> ID: ${telegramId}`);
        })
        .catch((err) => {
            console.error(`❌ Error crítico de la API de Telegram al enviar a ${telegramId}:`, err.message);
        });
    
    // Respondemos con éxito total a Google Sheets
    return res.status(200).send({ success: true });
});

// Iniciar el servidor express
app.listen(PORT, () => {
    console.log(`📡 Servidor Webhook escuchando en el puerto ${PORT}`);
});
