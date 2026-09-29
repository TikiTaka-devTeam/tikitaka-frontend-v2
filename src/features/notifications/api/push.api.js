import { apiClient } from "../../../lib/api/client.js";

export const getVapidPublicKey = () =>
  apiClient.get("/push/vapid-public-key");

export const registerPushSubscription = (payload) =>
  apiClient.post("/push/subscriptions", payload);

export const deletePushSubscriptionById = (subscriptionId) =>
  apiClient.delete(
    `/push/subscriptions/${encodeURIComponent(subscriptionId)}`,
  );

export const deletePushSubscriptionByEndpoint = (endpoint) =>
  apiClient.delete("/push/subscriptions", {
    data: { endpoint },
  });
