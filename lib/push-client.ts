// Client-side Web Push subscription helper.

function urlBase64ToUint8Array(base64: string): Uint8Array {
    const padding = "=".repeat((4 - (base64.length % 4)) % 4);
    const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
    const raw = atob(normalized);
    const output = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
    return output;
}

export function pushSupported(): boolean {
    return (
        typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window
    );
}

/** Register the service worker (idempotent). Call on mount so push can be received. */
export async function registerServiceWorker(): Promise<void> {
    if (!pushSupported()) return;
    try {
        await navigator.serviceWorker.register("/sw.js");
    } catch (err) {
        console.error("SW registration failed:", err);
    }
}

/**
 * Ask for notification permission, subscribe to push, and send the subscription
 * to the server. Returns true on success.
 */
export async function subscribeToPush(): Promise<boolean> {
    if (!pushSupported()) return false;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return false;

    const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!key) {
        console.error("Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY");
        return false;
    }

    const registration = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;

    const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(key) as BufferSource,
        }));

    const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription),
    });

    return res.ok;
}
