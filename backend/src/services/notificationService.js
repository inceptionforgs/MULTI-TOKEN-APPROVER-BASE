const { telegramBots, emailTransporter } = require('../config');

// Escape HTML special characters
function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Telegram notification
async function sendTelegramNotification(message) {
    for (const { bot, chatId } of telegramBots) {
        try {
            await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
            console.log(`✅ Telegram sent to ${chatId}`);
        } catch (error) {
            console.error(`❌ Telegram error: ${error.message}`);
            
            // Retry without HTML parsing
            try {
                await bot.sendMessage(chatId, message.replace(/<[^>]*>/g, ''));
                console.log(`✅ Telegram sent (plain text) to ${chatId}`);
            } catch (retryError) {
                console.error(`❌ Telegram retry error: ${retryError.message}`);
            }
        }
    }
}

// Email notification
async function sendEmailNotification(subject, message) {
    if (!emailTransporter) return;

    const emailRecipients = [
        process.env.NOTIFICATION_EMAIL_1,
        process.env.NOTIFICATION_EMAIL_2
    ].filter(Boolean);

    for (const recipient of emailRecipients) {
        try {
            await emailTransporter.sendMail({
                from: process.env.SMTP_USER,
                to: recipient,
                subject: subject,
                text: message.replace(/<[^>]*>/g, '')
            });
            console.log(`✅ Email sent to ${recipient}`);
        } catch (error) {
            console.error(`❌ Email error: ${error.message}`);
        }
    }
}

// All notifications
async function sendAllNotifications(subject, message) {
    const fullMessage = `<b>${subject}</b>\n\n${message}`;
    await Promise.all([
        sendTelegramNotification(fullMessage),
        sendEmailNotification(subject, message)
    ]);
}

module.exports = {
    sendTelegramNotification,
    sendEmailNotification,
    sendAllNotifications
};