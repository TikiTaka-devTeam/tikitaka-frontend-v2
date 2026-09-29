import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const ACCESS_TOKEN_KEY =
  "tikitaka_access_token";

function getAccessToken() {
  return (
    localStorage.getItem(
      ACCESS_TOKEN_KEY,
    ) ?? ""
  ).trim();
}

function getAuthorizationHeaders() {
  const token =
    getAccessToken();

  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

function stripApiPath(value) {
  return String(value || "")
    .trim()
    .replace(
      /\/api(?:\/v1)?\/?$/i,
      "",
    )
    .replace(/\/+$/, "");
}

function getBackendOrigin() {
  const configured =
    import.meta.env
      .VITE_API_BASE_URL ??
    import.meta.env.VITE_API_URL ??
    import.meta.env
      .VITE_BACKEND_URL ??
    "";

  if (configured) {
    const normalized =
      stripApiPath(
        configured,
      );

    if (
      /^https?:\/\//i.test(
        normalized,
      )
    ) {
      return normalized;
    }
  }

  if (
    import.meta.env.DEV &&
    typeof window !==
      "undefined"
  ) {
    return `${window.location.protocol}//${window.location.hostname}:8080`;
  }

  if (
    typeof window !==
    "undefined"
  ) {
    return window.location
      .origin;
  }

  return "http://localhost:8080";
}

function getSocketUrl() {
  return `${getBackendOrigin()}/ws`;
}

// Live frames are transient: never replay them across socket connections.
export function sendSharedStroke(client, { spaceId, slideId, event }) {
  if (!client?.connected || !spaceId || !slideId) return false;
  client.publish({
    destination: `/app/spaces/${spaceId}/slides/${slideId}/shared-strokes/live`,
    body: JSON.stringify(event),
  });
  return true;
}

export function createLectureSocket({
  spaceId, slideId, onSharedStroke, onConnect, onDisconnect, onError,
  beforeReconnect,
}) {
  let attempted = false;
  const client = new Client({
    webSocketFactory: () => new SockJS(getSocketUrl()),
    reconnectDelay: 3000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
  });

  client.beforeConnect = async () => {
    // A protected REST request uses the existing Axios token-refresh policy.
    if (attempted) {
      try {
        await beforeReconnect?.();
      } catch (error) {
        onError?.(error);
        // Do not reconnect with invalid credentials or revoked membership.
        if ([401, 403].includes(error?.response?.status) || !getAccessToken()) {
          void client.deactivate();
        }
        throw error;
      }
    }
    attempted = true;
    client.connectHeaders = getAuthorizationHeaders();
  };
  client.onConnect = () => {
    client.subscribe(
      `/topic/spaces/${spaceId}/slides/${slideId}/shared-strokes`,
      (message) => {
        try {
          onSharedStroke?.(JSON.parse(message.body));
        } catch (error) {
          onError?.(error);
        }
      },
    );
    onConnect?.();
  };
  client.onWebSocketClose = () => onDisconnect?.();
  client.onStompError = (frame) => onError?.(frame);
  client.onWebSocketError = (event) => onError?.(event);
  client.activate();
  return client;
}
