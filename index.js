const TelegramBot = require('node-telegram-bot-api');

// Railway tomará el token automáticamente de tus variables de entorno
const TOKEN = process.env.TELEGRAM_TOKEN; 
const bot = new TelegramBot(TOKEN, { polling: true });

console.log("🚀 Bot de Yango operativo en Railway...");

const userSessions = {};

function sendMainMenu(chatId) {
    delete userSessions[chatId]; 
    bot.sendMessage(chatId, "¡Bienvenido al Bot de Soporte de Yango! ¿En qué te puedo ayudar hoy?", {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "🎟️ Restitución de puntos", callback_data: "puntos" },
                    { text: "💳 Problemas con pagos", callback_data: "pagos" }
                ]
            ]
        }
    });
}

bot.onText(/\/start/, (msg) => {
    sendMainMenu(msg.chat.id);
});

bot.on('callback_query', (callbackQuery) => {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const data = callbackQuery.data;

    bot.answerCallbackQuery(callbackQuery.id);

    if (data === 'menu_inicio') {
        sendMainMenu(chatId);
        return;
    }

    // LÍNEA DE PUNTOS
    if (data === 'puntos') {
        userSessions[chatId] = { tipoFormulario: 'Puntos', paso: 1 };
        bot.sendMessage(chatId, "🎯 *Restitución de puntos por cancelación*\n\nPor favor, escribe el *ID del viaje* afectado:", { 
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: [[{ text: "🔙 Volver al Inicio", callback_data: "menu_inicio" }]] }
        });
    }

    // LÍNEA DE PAGOS
    else if (data === 'pagos') {
        bot.sendMessage(chatId, "💵 *Problemas con pagos*\n\nPor favor, selecciona una opción específica:", {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "❌ Problemas con las recargas", callback_data: "recargas" },
                        { text: "👤 Problemas con pago de usuarios", callback_data: "usuarios" }
                    ],
                    [{ text: "🔙 Volver al Inicio", callback_data: "menu_inicio" }]
                ]
            }
        });
    }

    // SUB-LÍNEA: RECARGAS
    else if (data === 'recargas') {
        userSessions[chatId] = { tipoFormulario: 'Problemas con las Recargas', paso: 1 };
        bot.sendMessage(chatId, "📥 *Formulario de Recargas*\n\nPor favor, ingresa el *Monto de la recarga*:", {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: [[{ text: "🔙 Volver al Inicio", callback_data: "menu_inicio" }]] }
        });
    }

    // SUB-LÍNEA: USUARIOS
    else if (data === 'usuarios') {
        userSessions[chatId] = { tipoFormulario: 'Pago de Usuarios', paso: 1 };
        bot.sendMessage(chatId, "👤 *Formulario de Pago de Usuarios*\n\nPor favor, escribe el *Nombre completo del usuario*:", {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: [[{ text: "🔙 Volver al Inicio", callback_data: "menu_inicio" }]] }
        });
    }
});

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text && text.startsWith('/')) return;

    const session = userSessions[chatId];
    if (!session) return;

    if (session.paso === 1) {
        session.datoIngresado = text;
        const numTicket = Math.floor(100000 + Math.random() * 900000);

        bot.sendMessage(chatId, "🔄 Procesando tu solicitud en el sistema de Yango...");

        setTimeout(() => {
            const comprobante = `🧾 *COMPROBANTE DE SOPORTE YANGON*\n` +
                                `----------------------------------\n` +
                                `🎫 *Ticket N°:* \`${numTicket}\`\n` +
                                `📁 *Categoría:* ${session.tipoFormulario}\n` +
                                `📝 *Dato registrado:* _${session.datoIngresado}_\n` +
                                `👤 *Agente:* Sistema Automático\n` +
                                `----------------------------------\n` +
                                `✅ Tu reporte ha sido recibido con éxito.`;

            bot.sendMessage(chatId, comprobante, { 
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: [[{ text: "🤖 Menú Principal", callback_data: "menu_inicio" }]] }
            });

            delete userSessions[chatId];
        }, 1200);
    }
});
