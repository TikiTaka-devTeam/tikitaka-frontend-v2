import {
  deletePushSubscriptionByEndpoint,
  deletePushSubscriptionById,
  getVapidPublicKey,
  registerPushSubscription,
} from "../api/push.api.js";

const PUSH_SERVICE_WORKER_URL = "/push-service-worker.js";
const PUSH_SERVICE_WORKER_SCOPE = "/push/";
const PUSH_SUBSCRIPTION_ID_KEY = "tikitaka_push_subscription_id";

function createWebPushError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function urlBase64ToUint8Array(value) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = `${value}${padding}`.replace(/-/g, "+").replace(/_/g, "/");
  const decoded = window.atob(base64);

  return Uint8Array.from(decoded, (character) => character.charCodeAt(0));
}

function arrayBufferToBase64Url(buffer) {
  if (!buffer) {
    throw createWebPushError(
      "INVALID_SUBSCRIPTION_KEYS",
      "브라우저 Push 구독 키를 확인하지 못했습니다.",
    );
  }

  const bytes = new Uint8Array(buffer);
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return window
    .btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function getSubscriptionKeys(subscription) {
  const serialized = subscription.toJSON();
  const p256dh =
    serialized.keys?.p256dh ||
    arrayBufferToBase64Url(subscription.getKey("p256dh"));
  const auth =
    serialized.keys?.auth || arrayBufferToBase64Url(subscription.getKey("auth"));

  return { p256dh, auth };
}

async function savePushSubscription(subscription) {
  const keys = getSubscriptionKeys(subscription);
  const response = await registerPushSubscription({
    endpoint: subscription.endpoint,
    ...keys,
  });
  const subscriptionId = response.data?.subscription_id;

  if (!subscriptionId) {
    throw createWebPushError(
      "INVALID_SUBSCRIPTION_RESPONSE",
      "Push 구독 등록 응답이 올바르지 않습니다.",
    );
  }

  localStorage.setItem(PUSH_SUBSCRIPTION_ID_KEY, subscriptionId);

  return {
    subscriptionId,
    endpoint: subscription.endpoint,
  };
}

export function isWebPushSupported() {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

async function getPushServiceWorkerRegistration() {
  if (!isWebPushSupported()) return null;

  const expectedScope = new URL(
    PUSH_SERVICE_WORKER_SCOPE,
    window.location.origin,
  ).href;
  const registrations = await navigator.serviceWorker.getRegistrations();

  return (
    registrations.find((registration) => registration.scope === expectedScope) ||
    null
  );
}

async function ensurePushServiceWorkerRegistration() {
  const existingRegistration = await getPushServiceWorkerRegistration();

  if (existingRegistration) return existingRegistration;

  return navigator.serviceWorker.register(PUSH_SERVICE_WORKER_URL, {
    scope: PUSH_SERVICE_WORKER_SCOPE,
  });
}

export async function getWebPushState() {
  if (!isWebPushSupported()) {
    return { supported: false, enabled: false, permission: "unsupported" };
  }

  const registration = await getPushServiceWorkerRegistration();
  const subscription = await registration?.pushManager.getSubscription();

  return {
    supported: true,
    enabled: Boolean(subscription),
    permission: Notification.permission,
  };
}

export async function enableWebPush() {
  if (!isWebPushSupported()) {
    throw createWebPushError(
      "UNSUPPORTED",
      "이 브라우저에서는 Web Push를 지원하지 않습니다.",
    );
  }

  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    throw createWebPushError(
      permission === "denied" ? "PERMISSION_DENIED" : "PERMISSION_DISMISSED",
      permission === "denied"
        ? "브라우저 설정에서 알림 권한을 허용해주세요."
        : "알림 권한이 허용되지 않았습니다.",
    );
  }

  const registration = await ensurePushServiceWorkerRegistration();
  const existingSubscription = await registration.pushManager.getSubscription();
  const { data } = await getVapidPublicKey();
  const publicKey = data?.public_key;

  if (!publicKey) {
    throw createWebPushError(
      "INVALID_VAPID_KEY",
      "Push 공개키 응답이 올바르지 않습니다.",
    );
  }

  let subscription = existingSubscription;
  let createdSubscription = false;

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
    createdSubscription = true;
  }

  try {
    return await savePushSubscription(subscription);
  } catch (error) {
    if (createdSubscription) {
      await subscription.unsubscribe().catch(() => false);
    }
    throw error;
  }
}

export async function syncExistingWebPushSubscription() {
  if (!isWebPushSupported() || Notification.permission !== "granted") {
    return null;
  }

  const registration = await getPushServiceWorkerRegistration();
  const subscription = await registration?.pushManager.getSubscription();

  if (!subscription) return null;

  return savePushSubscription(subscription);
}

function isAlreadyDeletedError(error) {
  return error?.response?.status === 404;
}

export async function disableWebPush() {
  if (!isWebPushSupported()) {
    localStorage.removeItem(PUSH_SUBSCRIPTION_ID_KEY);
    return;
  }

  const registration = await getPushServiceWorkerRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  const subscriptionId = localStorage.getItem(PUSH_SUBSCRIPTION_ID_KEY);
  let serverError = null;

  if (subscriptionId) {
    try {
      await deletePushSubscriptionById(subscriptionId);
    } catch (error) {
      if (isAlreadyDeletedError(error) && subscription?.endpoint) {
        try {
          await deletePushSubscriptionByEndpoint(subscription.endpoint);
        } catch (fallbackError) {
          if (!isAlreadyDeletedError(fallbackError)) serverError = fallbackError;
        }
      } else if (!isAlreadyDeletedError(error)) {
        serverError = error;
      }
    }
  } else if (subscription?.endpoint) {
    try {
      await deletePushSubscriptionByEndpoint(subscription.endpoint);
    } catch (error) {
      if (!isAlreadyDeletedError(error)) serverError = error;
    }
  }

  if (subscription) {
    try {
      await subscription.unsubscribe();
    } catch (error) {
      if (!serverError) serverError = error;
    }
  }

  localStorage.removeItem(PUSH_SUBSCRIPTION_ID_KEY);

  if (serverError) throw serverError;
}

export function clearStoredPushSubscriptionId() {
  localStorage.removeItem(PUSH_SUBSCRIPTION_ID_KEY);
}
