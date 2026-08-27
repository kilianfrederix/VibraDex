import "server-only";
import webpush from "web-push";
import { prisma } from "@/lib/prisma";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@vibradex.app";

let configured = false;
function ensureConfigured(): boolean {
    if (configured) return true;
    if (!PUBLIC_KEY || !PRIVATE_KEY) return false;
    webpush.setVapidDetails(SUBJECT, PUBLIC_KEY, PRIVATE_KEY);
    configured = true;
    return true;
}

export interface PushPayload {
    title: string;
    body: string;
    url?: string;
    tag?: string;
}

/**
 * Send a Web Push notification to every stored subscription.
 * Best-effort: expired subscriptions (404/410) are pruned; other errors logged.
 * No-op if VAPID keys aren't configured.
 */
export async function sendPush(payload: PushPayload): Promise<void> {
    if (!ensureConfigured()) return;

    const subscriptions = await prisma.pushSubscription.findMany();
    const body = JSON.stringify(payload);

    await Promise.all(
        subscriptions.map(async (sub) => {
            try {
                await webpush.sendNotification(
                    { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                    body,
                );
            } catch (err) {
                const statusCode = (err as { statusCode?: number })?.statusCode;
                if (statusCode === 404 || statusCode === 410) {
                    // Subscription is gone — remove it.
                    await prisma.pushSubscription.delete({ where: { endpoint: sub.endpoint } }).catch(() => {});
                } else {
                    console.error("[push] send failed:", statusCode ?? err);
                }
            }
        }),
    );
}
