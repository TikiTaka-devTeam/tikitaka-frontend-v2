self.addEventListener("push", (event) => {
  let payload;

  try {
    payload = event.data?.json() || {};
  } catch {
    payload = { message: event.data?.text() || "새로운 알림이 도착했습니다." };
  }

  const title = payload.title || "Tikitaka";
  const options = {
    body: payload.message || "새로운 알림이 도착했습니다.",
    tag: payload.notification_id
      ? `tikitaka-${payload.notification_id}`
      : undefined,
    data: {
      notificationId: payload.notification_id || "",
      type: payload.type || "",
      spaceId: payload.space_id || "",
      targetId: payload.target_id || "",
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const params = new URLSearchParams();

  if (data.notificationId) params.set("notificationId", data.notificationId);
  if (data.type) params.set("type", data.type);
  if (data.spaceId) params.set("spaceId", data.spaceId);
  if (data.targetId) params.set("targetId", data.targetId);

  const redirectUrl = `${self.location.origin}/notification-redirect?${params.toString()}`;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(async (windowClients) => {
        const existingClient = windowClients[0];

        if (existingClient) {
          await existingClient.navigate(redirectUrl);
          return existingClient.focus();
        }

        return self.clients.openWindow(redirectUrl);
      }),
  );
});
