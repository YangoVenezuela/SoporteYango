const TelegramBot = require('node-telegram-bot-api');

// Railway tomará el token automáticamente de tus variables de entorno (TELEGRAM_TOKEN)
const TOKEN = process.env.TELEGRAM_TOKEN; 
const bot = new TelegramBot(TOKEN, { polling: true });

console.log("🚀 Bot de Yango operativo y escuchando en Railway...");

// Guardamos temporalmente el estado del formulario de cada usuario
const userSessions = {};

// --- FUNCIÓN: MENÚ PRINCIPAL ---
function sendMainMenu(chatId) {
    // Si el usuario vuelve al inicio, borramos cualquier formulario a medias
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

// 1. ESCUCHAR COMANDO /START (Tu Telegram Trigger inicial)
bot.onText(/\/start/, (msg) => {
    sendMainMenu(msg.chat.id);
});

// 2. ENRUTADOR DE BOTONES (Tus bloques Switch, Switch1 y Switch2 de n8n)
bot.on('callback_query', (callbackQuery) => {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const data = callbackQuery.data;

    // Avisamos a Telegram que ya recibimos el clic para que el botón no se quede cargando
    bot.answerCallbackQuery(callbackQuery.id);

    // ACCIÓN: Volver al menú de inicio
    if (data === 'menu_inicio') {
        sendMainMenu(chatId);
        return;
    }

    // LÍNEA DE PUNTOS (Switch1 -> Salida 0)
    if (data === 'puntos') {
        userSessions[chatId] = { tipoFormulario: 'Restitución de Puntos', paso: 1 };
        bot.sendMessage(chatId, "🎯 *Restitución de puntos*\n\nPor favor, escribe a continuación el *ID del viaje* afectado:", { 
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [[{ text: "🔙 Volver al Inicio", callback_data: "menu_inicio" }]]
            }
        });
    }

    // LÍNEA DE PAGOS (Switch1 -> Salida 1)
    else if (data === 'pagos') {
        bot.sendMessage(chatId, "💵 *Problemas con pagos*\n\nPor favor, selecciona una opción específica para revisar tu caso:", {
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

    // SUB-LÍNEA: RECARGAS (Switch2 -> Salida 0)
    else if (data === 'recargas') {
        userSessions[chatId] = { tipoFormulario: 'Problemas con las Recargas', paso: 1 };
        bot.sendMessage(chatId, "📥 *Formulario de Recargas*\n\nPor favor, escribe el *Monto de la recarga* que no se acreditó:", {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [[{ text: "🔙 Volver al Inicio", callback_data: "menu_inicio" }]]
            }
        });
    }

    // SUB-LÍNEA: PAGO DE USUARIOS (Switch2 -> Salida 1)
    else if (data === 'usuarios') {
        userSessions[chatId] = { tipoFormulario: 'Pago de Usuarios', paso: 1 };
        bot.sendMessage(chatId, "👤 *Formulario de Pago de Usuarios*\n\nPor favor, escribe el *Nombre completo del usuario* reportado:", {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [[{ text: "🔙 Volver al Inicio", callback_data: "menu_inicio" }]]
            }
        });
    }
});

// 3. CAPTURA DEL TEXTO FINAL Y GENERADOR DE COMPROBANTES
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    // Si el usuario escribe un comando de Telegram (como /start), lo ignoramos aquí
    if (text && text.startsWith('/')) return;

    // Revisamos si este usuario está llenando activamente un formulario
    const session = userSessions[chatId];
    if (!session) return;

    // Si está en el paso 1 (esperando el dato del formulario)
    if (session.paso === 1) {
        session.datoIngresado = text;
        
        // Generamos un número de Ticket aleatorio de 6 dígitos
        const numTicket = Math.floor(100000 + Math.random() * 900000);

        bot.sendMessage(chatId, "🔄 Guardando tus datos en el sistema de Yango...");

        // Espera 1.2 segundos para simular carga y envía el Comprobante Final
        setTimeout(() => {
            const comprobante = `🧾 *COMPROBANTE DE SOPORTE YANGON*\n` +
                                `----------------------------------\n` +
                                `🎫 *Ticket N°:* \`${numTicket}\`\n` +
                                `📁 *Categoría:* ${session.tipoFormulario}\n` +
                                `📝 *Dato registrado:* _${session.datoIngresado}_\n` +
                                `👤 *Agente:* Sistema Automático\n` +
                                `----------------------------------\n` +
                                `✅ Tu reporte ha sido recibido con éxito. Nuestro equipo lo revisará a la brevedad.`;

            bot.sendMessage(chatId, comprobante, { 
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [[{ text: "🤖 Volver al Menú Principal", callback_data: "menu_inicio" }]]
                }
            });

            // Limpiamos la sesión para que el bot quede libre para otra consulta
            delete userSessions[chatId];
        }, 1200);
    }
});
