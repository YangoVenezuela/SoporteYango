const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const fetch = require('node-fetch'); // 🔄 Nueva dependencia para responderle a Google Sheets

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

// --- RECEPTOR DE ALERTAS DESDE GOOGLE SHEETS (REDISEÑADO CON NUEVOS ESTADOS Y FEEDBACK) ---
app.post('/webhook-google-forms', (req, res) => {
    const { telegramId, tipoFormulario, cedula, nombreHoja, fila, estadoManual } = req.body;

    console.log(`📥 [NUEVA ENTRADA] ID: ${telegramId} | Form/Origen: ${tipoFormulario} | Estado Manual: ${estadoManual}`);

    if (!telegramId) {
        console.log("⚠️ Registro rechazado: No incluye un Telegram ID válido.");
        return res.status(200).send({ success: false, error: "Missing Telegram ID" });
    }

    const identificador = cedula || "Registrado";
    let mensaje = "";
    
    const origen = String(tipoFormulario).toUpperCase().trim();
    const esActualizacionManual = (origen === "ACTUALIZACION_STATUS");

    // 1. GENERACIÓN DE MENSAJES SEGÚN EL CASO
    if (esActualizacionManual) {
        console.log(`✨ Procesando notificación manual [${estadoManual}] para el ID: ${telegramId}`);
        
        if (estadoManual === "Devolución automática") {
            mensaje = `🔄 *ACTUALIZACIÓN DE TU REPORTE*\n` +
                      `----------------------------------\n` +
                      `🆔 *Cédula:* \`${identificador}\`\n` +
                      `⚙️ *Estado:* Devolución aprobada 💳\n` +
                      `----------------------------------\n` +
                      `📢 Estimado conductor, te informamos que tu requerimiento ha sido procesado con éxito.\n\n` +
                      `⏳ Por favor, ingresa a tu aplicación de conductor en las próximas horas para verificar la actualización del saldo.\n\n` +
                      `🏢 *Para cualquier duda adicional, consulta con tu socio tecnológico en su sede.*`;
        } 
        else if (estadoManual === "Faltan datos") {
            mensaje = `⚠️ *REPORTE RECHAZADO / FALTAN DATOS*\n` +
                      `----------------------------------\n` +
                      `🆔 *Cédula:* \`${identificador}\`\n` +
                      `⚙️ *Estado:* Información Incompleta 📝\n` +
                      `----------------------------------\n` +
                      `📢 Estimado conductor, hemos revisado tu requerimiento pero los datos suministrados en el formulario están *incompletos o son incorrectos*.\n\n` +
                      `📌 *¿Qué debes hacer?*\n` +
                      `Por favor, abre nuevamente el menú de este bot utilizando el comando /start, selecciona tu categoría e ingresa al enlace para rellenar el formulario asegurándote de escribir correctamente todos los datos solicitados.\n\n` +
                      `¡Gracias por tu colaboración!`;
        } 
        else if (estadoManual === "No aplica") {
            mensaje = `🚫 *NOTIFICACIÓN DE SOPORTE YANGO*\n` +
                      `----------------------------------\n` +
                      `🆔 *Cédula:* \`${identificador}\`\n` +
                      `⚙️ *Estado:* No Aplica Reembolso ❌\n` +
                      `----------------------------------\n` +
                      `📢 Estimado conductor, te informamos que tu solicitud fue recibida y evaluada minuciosamente por nuestro equipo técnico.\n\n` +
                      `⚠️ Tras la auditoría del sistema, se determinó que *no aplica la devolución de fondos*, debido a que el caso reportado no cumple con las políticas y condiciones requeridas para la restitución automática.\n\n` +
                      `🏢 *Para mayor información detallada sobre tu caso, ponte en contacto directo con tu socio asignado.*`;
        } 
        else {
            // Caso de respaldo por si mandan un estado no programado
            mensaje = `🔄 *ACTUALIZACIÓN DE SOPORTE YANGO*\n\nTu solicitud asociada a la identificación \`${identificador}\` ha cambiado de estado a: *${estadoManual}*.`;
        }
    } 
    // Si viene del envío automático normal de los formularios cuando el usuario responde
    else {
        console.log(`📝 Procesando confirmación de formulario de entrada para el ID: ${telegramId}`);
        mensaje = `🧾 *COMPROBANTE DE SOPORTE YANGO*\n` +
                  `----------------------------------\n` +
                  `🆔 *Identificación / Cédula:* \`${identificador}\`\n` +
                  `📁 *Categoría:* ${tipoFormulario}\n` +
                  `👤 *Agente:* Sistema Automático\n` +
                  `----------------------------------\n` +
                  `✅ Tu reporte ha sido recibido con éxito en nuestra base de datos.\n\n` +
                  `⏳ Tendremos una respuesta para ti en un lapso *menor a 24 horas*.`;
    }

    // ⚠️ COLOCA TU URL DE APPS SCRIPT AQUÍ (La obtienes al implementar en Google)
    const URL_APPS_SCRIPT = "https://script.google.com/macros/s/AKfycbyUGj6JUbPH-biRQa7mYWi0iD5xZbHS58Fs20Xu6_s6Dk1G6O2Z6RsN3pxztUDP3mdI/exec";

    // 2. EJECUTAR ENVÍO A TELEGRAM Y RESPONDER AL EXCEL
    bot.sendMessage(telegramId, mensaje, { parse_mode: 'Markdown' })
        .then(() => {
            console.log(`✅ Mensaje enviado con éxito a Telegram -> ID: ${telegramId}`);
            
            // Si fue manual, le avisamos a Google Sheets que se entregó bien
            if (esActualizacionManual && fila && URL_APPS_SCRIPT !== "TU_URL_DE_WEB_APP_DE_APPS_SCRIPT_AQUÍ") {
                fetch(URL_APPS_SCRIPT, {
                    method: 'POST',
                    body: JSON.stringify({ fila: fila, nombreHoja: nombreHoja, resultado: "Telegram (Enviado)" }),
                    headers: { 'Content-Type': 'application/json' }
                }).catch(err => console.error("Error al actualizar Excel (Éxito):", err.message));
            }
        })
        .catch((err) => {
            console.error(`❌ Error al enviar a Telegram ID ${telegramId}:`, err.message);
            
            // Si fue manual y falló, le mandamos el texto de fallo personalizado
            if (esActualizacionManual && fila && URL_APPS_SCRIPT !== "TU_URL_DE_WEB_APP_DE_APPS_SCRIPT_AQUÍ") {
                let razonFallo = "Telegram (Sin enviar)";
                
                // Agregamos contexto útil directo en la celda si Telegram nos da el motivo
                if (err.message.includes("bot was blocked by the user")) {
                    razonFallo = "Telegram (Sin enviar - Bloqueado)";
                } else if (err.message.includes("chat not found")) {
                    razonFallo = "Telegram (Sin enviar - ID Inválido)";
                }

                fetch(URL_APPS_SCRIPT, {
                    method: 'POST',
                    body: JSON.stringify({ fila: fila, nombreHoja: nombreHoja, resultado: razonFallo }),
                    headers: { 'Content-Type': 'application/json' }
                }).catch(err => console.error("Error al actualizar Excel (Fallo):", err.message));
            }
        });
    
    // Respondemos rápido al webhook inicial
    return res.status(200).send({ success: true });
});

// Iniciar el servidor express
app.listen(PORT, () => {
    console.log(`📡 Servidor Webhook escuchando en el puerto ${PORT}`);
});
