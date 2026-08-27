import "server-only";

// Send a notification to Telegram via the Bot API.
// No-ops if the bot token / chat id aren't configured, so local dev without
// them just silently skips. Best-effort: never throws.

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export async function sendTelegram(text: string): Promise<void> {
    if (!BOT_TOKEN || !CHAT_ID) return;

    try {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text,
                disable_web_page_preview: true,
            }),
            signal: AbortSignal.timeout(4000),
        });
    } catch (error) {
        console.error("[telegram] send failed:", error);
    }
}
