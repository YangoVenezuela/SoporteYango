const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const fetch = require('node-fetch');

// 1. CONFIGURACIÓN DEL BOT
const TOKEN = process.env.TELEGRAM_TOKEN; 
const bot = new TelegramBot(TOKEN, { polling: true });

// 2. CONFIGURACIÓN DEL SERVIDOR WEB
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

// --- CONSTRUCTOR DE ENLACES INVISIBLES ---
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

bot.onText(/\/start/, (msg) => {
    sendMainMenu(msg.chat.id);
});

// --- ENRUTADOR DE BOTONES ---
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

// --- DICCIONARIO EXCLUSIVO: TEXTOS LITERALES DE LAS IMÁGENES ---
const MENSAJES_ESTADO = {
    "Falta comprobante bancario": 
        `📢 Estimado conductor, hemos revisado tu requerimiento pero *olvidaste adjuntar el comprobante bancario* del pago realizado en el formulario\n` +
        `📌 *¿Qué debes hacer?*\n` +
        `Por favor, abre nuevamente el menú de este bot utilizando el comando /start, selecciona tu categoría e ingresa al enlace para rellenar el formulario asegurándote de escribir correctamente todos los datos solicitados.\n` +
        `¡Gracias por tu colaboración!`,

    "Faltan datos": 
        `📢 Estimado conductor, hemos revisado tu requerimiento pero los datos suministrados en el formulario están *incompletos o son incorrectos*\n` +
        `📌 *¿Qué debes hacer?*\n` +
        `Por favor, abre nuevamente el menú de este bot utilizando el comando /start, selecciona tu categoría e ingresa al enlace para rellenar el formulario asegurándote de escribir correctamente todos los datos solicitados.\n` +
        `¡Gracias por tu colaboración!`,

    "No aplica": 
        `📢 Estimado conductor, te informamos que tu solicitud fue recibida y evaluada minuciosamente por nuestro equipo técnico.\n` +
        `⚠️ Tras la auditoría del sistema, se determinó que *no aplica la devolución de fondos*, debido a que el caso reportado no cumple con las políticas y condiciones requeridas para la restitución automática.\n` +
        `🏢 *Para mayor información detallada sobre tu caso, ponte en contacto directo con tu socio asignado.*`,

    "Listo": 
        `📢 Estimado conductor, te informamos que tu requerimiento ha sido procesado con éxito.\n` +
        `⏳ Por favor, ingresa a tu aplicación de conductor en las próximas horas para verificar la actualización del saldo.\n` +
        `🏢 Para cualquier duda adicional, consulta con tu socio en su sede.`,

    "Recarga previamente efectiva": 
        `📢 Estimado conductor, te informamos que tu solicitud fue recibida y evaluada minuciosamente por nuestro equipo técnico.\n` +
        `⚠️ Tras la auditoría del sistema, se determinó que *tu saldo ya había sido sumado en tu billetera*.\n` +
        `🏢 *Para mayor información detallada sobre tu caso, ponte en contacto directo con tu socio asignado.*`,

    "No aplica devolución": 
        `📢 Estimado conductor, te informamos que tu solicitud fue recibida y evaluada minuciosamente por nuestro equipo técnico.\n` +
        `⚠️ Tras la auditoría del sistema, se determinó que *no aplica la devolución de puntos*, debido a que el caso reportado no cumple con las políticas y condiciones requeridas para la restitución automática.\n` +
        `🏢 *Para mayor información detallada sobre tu caso, ponte en contacto directo con tu socio asignado.*`,

    "Puntos devueltos": 
        `📢 Estimado conductor, te informamos que tu requerimiento ha sido procesado con éxito.\n` +
        `⏳ Por favor, ingresa a tu aplicación de conductor en las próximas horas para verificar la actualización de tus puntos.\n` +
        `🏢 Para cualquier duda adicional, consulta con tu socio en su sede.`,

    "Falta comprobante usuario": 
        `📢 Estimado conductor, hemos revisado tu requerimiento pero *olvidaste adjuntar el comprobante bancario del pago que te hizo el usuario* en el formulario.\n` +
        `📌 *¿Qué debes hacer?*\n` +
        `Por favor, abre nuevamente el menú de este bot utilizando el comando /start, selecciona tu categoría e ingresa al enlace para rellenar el formulario asegurándote de escribir correctamente todos los datos solicitados.\n` +
        `¡Gracias por tu colaboración!`,

    "Sin archivos": 
        `📢 Estimado conductor, hemos revisado tu requerimiento pero *olvidaste adjuntar la captura del viaje y el comprobante bancario del usuario* en el formulario.\n` +
        `📌 *¿Qué debes hacer?*\n` +
        `Por favor, abre nuevamente el menú de este bot utilizando el comando /start, selecciona tu categoría e ingresa al enlace para rellenar el formulario asegurándote de escribir correctamente todos los datos solicitados.\n` +
        `¡Gracias por tu colaboración!`,

    "Problemas con branding":
        `📢 Estimado conductor, te informamos que tu solicitud fue recibida y evaluada minuciosamente por nuestro equipo técnico.\n` +
        `📌 *¿Qué debes hacer?*\n` +
        `Si presentas problemas con la *verificación de marca (branding)*, por favor intenta nuevamente la *verificación fotográfica*. Si el problema persiste, ponte en contacto directo con tu *socio asignado*.`
};

// --- RECEPTOR DE WEBHOOK ---
app.post('/webhook-google-forms', (req, res) => {
    const { telegramId, tipoFormulario, cedula, nombreHoja, fila, estadoManual } = req.body;

    if (!telegramId) {
        return res.status(200).send({ success: false, error: "Missing Telegram ID" });
    }

    const origen = String(tipoFormulario).toUpperCase().trim();
    const esActualizacionManual = (origen === "ACTUALIZACION_STATUS");

    // URL Real de tu App Web de Google
    const URL_APPS_SCRIPT = "https://script.google.com/macros/s/AKfycbzzkr6y8nyvAOolLxAMytVE_kxf1g-jfUqj77hcyOPP--5gwQnsH4VhFN3CgWZ4tzvXYw/exec";

    // 🔥 CONTROL INTERNO SÚPER LIMPIO: Si es En revisión o En revision, frena el flujo y actualiza la celda a "Interno"
    if (esActualizacionManual && (estadoManual === "En revision" || estadoManual === "En revisión")) {
        console.log(`🔒 Control interno activado: Omitiendo Telegram para ID ${telegramId}`);
        if (fila) {
            fetch(URL_APPS_SCRIPT, {
                method: 'POST',
                body: JSON.stringify({ fila: fila, nombreHoja: nombreHoja, resultado: "Interno" }),
                headers: { 'Content-Type': 'application/json' }
            })
            .then(() => console.log("✅ Excel actualizado a 'Interno' correctamente."))
            .catch(err => console.error("❌ Error enviando 'Interno' al Excel:", err.message));
        }
        return res.status(200).send({ success: true, status: "interno" });
    }

    let mensaje = "";

    if (esActualizacionManual) {
        const textoBase = MENSAJES_ESTADO[estadoManual];
        if (textoBase) {
            mensaje = textoBase;
        } else {
            mensaje = `📢 *Actualización de tu reporte Yango*\n\nTu requerimiento ha cambiado al estado: *${estadoManual}*.`;
        }
    } else {
        const identificador = cedula || "Registrada";
        mensaje = `🧾 *COMPROBANTE DE SOPORTE YANGO*\n` +
                  `----------------------------------\n` +
                  `🆔 *Identificación / Cédula:* \`${identificador}\`\n` +
                  `📁 *Categoría:* ${tipoFormulario}\n` +
                  `----------------------------------\n` +
                  `✅ Tu reporte ha sido recibido con éxito.\n\n` +
                  `⏳ Tendremos una respuesta para ti en un lapso *menor a 24 horas*.`;
    }

    // Envío Regular a Telegram
    bot.sendMessage(telegramId, mensaje, { parse_mode: 'Markdown' })
        .then(() => {
            console.log(`✅ Mensaje enviado con éxito a ID: ${telegramId}`);
            if (esActualizacionManual && fila) {
                fetch(URL_APPS_SCRIPT, {
                    method: 'POST',
                    body: JSON.stringify({ fila: fila, nombreHoja: nombreHoja, resultado: "Telegram (Enviado)" }),
                    headers: { 'Content-Type': 'application/json' }
                })
                .then(() => console.log("✅ Excel actualizado a 'Telegram (Enviado)' correctamente."))
                .catch(err => console.error("❌ Error enviando éxito al Excel:", err.message));
            }
        })
        .catch((err) => {
            console.error(`❌ Error enviando a Telegram ID ${telegramId}:`, err.message);
            if (esActualizacionManual && fila) {
                let respuestaFallo = "Telegram (Sin enviar)";
                
                if (err.message.includes("bot was blocked by the user")) {
                    respuestaFallo = "Telegram (Sin enviar - Bloqueado)";
                } else if (err.message.includes("chat not found")) {
                    respuestaFallo = "Telegram (Sin enviar - ID Inválido)";
                }

                fetch(URL_APPS_SCRIPT, {
                    method: 'POST',
                    body: JSON.stringify({ fila: fila, nombreHoja: nombreHoja, resultado: respuestaFallo }),
                    headers: { 'Content-Type': 'application/json' }
                })
                .then(() => console.log(`❌ Excel actualizado a fallo: ${respuestaFallo}`))
                .catch(err => console.error("❌ Error enviando fallo al Excel:", err.message));
            }
        });

    return res.status(200).send({ success: true });
});

app.listen(PORT, () => {
    console.log(`📡 Servidor Webhook escuchando en el puerto ${PORT}`);
});
