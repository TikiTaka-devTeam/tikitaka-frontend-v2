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

function toFiniteNumber(
  value,
  fallback = 0,
) {
  const numeric =
    Number(value);

  return Number.isFinite(
    numeric,
  )
    ? numeric
    : fallback;
}

function toSocketPoint(point) {
  return {
    xRatio:
      toFiniteNumber(
        point?.x_ratio ??
          point?.xRatio ??
          point?.x,
      ),

    yRatio:
      toFiniteNumber(
        point?.y_ratio ??
          point?.yRatio ??
          point?.y,
      ),
  };
}

function toSocketStroke(stroke) {
  return {
    tool:
      stroke?.tool ?? "PEN",

    points: Array.isArray(
      stroke?.points,
    )
      ? stroke.points.map(
          toSocketPoint,
        )
      : [],

    color:
      stroke?.color ??
      "#212326",

    thickness:
      toFiniteNumber(
        stroke?.thickness,
        0.0045,
      ),

    content:
      stroke?.content ?? null,

    strokeOrder:
      toFiniteNumber(
        stroke?.stroke_order ??
          stroke?.strokeOrder,
        0,
      ),
  };
}

function normalizeIncomingPoint(
  point,
) {
  return {
    x_ratio:
      toFiniteNumber(
        point?.x_ratio ??
          point?.xRatio ??
          point?.x,
      ),

    y_ratio:
      toFiniteNumber(
        point?.y_ratio ??
          point?.yRatio ??
          point?.y,
      ),
  };
}

function normalizeIncomingStroke(
  payload,
) {
  const source =
    payload?.stroke ?? {};

  const strokeId =
    payload?.stroke_id ??
    payload?.strokeId ??
    source?.stroke_id ??
    source?.strokeId ??
    source?.id ??
    "";

  return {
    stroke_id: strokeId,

    tool:
      source?.tool ?? "PEN",

    points: Array.isArray(
      source?.points,
    )
      ? source.points.map(
          normalizeIncomingPoint,
        )
      : [],

    color:
      source?.color ??
      "#212326",

    thickness:
      toFiniteNumber(
        source?.thickness,
        0.0045,
      ),

    opacity:
      source?.opacity,

    content:
      source?.content ?? null,

    stroke_order:
      toFiniteNumber(
        source?.stroke_order ??
          source?.strokeOrder,
        0,
      ),

    is_deleted: false,
  };
}

function parseMessageBody(message) {
  try {
    return JSON.parse(
      message?.body ?? "{}",
    );
  } catch (error) {
    console.error(
      "WebSocket 메시지를 해석하지 못했습니다.",
      error,
    );

    return null;
  }
}

function publishOrQueue(
  client,
  frame,
) {
  if (!client) {
    return false;
  }

  if (client.connected) {
    client.publish(frame);
    return true;
  }

  if (
    Array.isArray(
      client.__tikitakaPendingFrames,
    )
  ) {
    client.__tikitakaPendingFrames.push(
      frame,
    );
  }

  return false;
}

function flushPendingFrames(
  client,
) {
  if (
    !client?.connected ||
    !Array.isArray(
      client.__tikitakaPendingFrames,
    )
  ) {
    return;
  }

  const frames =
    client.__tikitakaPendingFrames.splice(
      0,
    );

  frames.forEach(
    (frame) => {
      client.publish(frame);
    },
  );
}

export function createLectureSocket({
  spaceId,
  slideId,
  onSharedStroke,
  onConnect,
  onError,
}) {
  const client =
    new Client({
      webSocketFactory: () =>
        new SockJS(
          getSocketUrl(),
        ),

      reconnectDelay: 3000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,

      debug:
        import.meta.env.DEV
          ? (message) => {
              console.debug(
                "[STOMP]",
                message,
              );
            }
          : () => undefined,
    });

  client.__tikitakaPendingFrames =
    [];

  client.beforeConnect = () => {
    client.connectHeaders =
      getAuthorizationHeaders();
  };

  client.onConnect = () => {
    client.subscribe(
      `/topic/spaces/${spaceId}/slides/${slideId}/shared-strokes`,
      (message) => {
        const payload =
          parseMessageBody(
            message,
          );

        if (!payload) {
          return;
        }

        const type =
          payload?.type ?? "";

        if (
          type !==
            "SHARED_STROKE_CREATED" &&
          type !==
            "SHARED_STROKE_RESYNC"
        ) {
          return;
        }

        onSharedStroke?.(
          normalizeIncomingStroke(
            payload,
          ),
          payload,
        );
      },
    );

    flushPendingFrames(
      client,
    );

    onConnect?.();
  };

  client.onStompError =
    (frame) => {
      onError?.(frame);
    };

  client.onWebSocketError =
    (event) => {
      onError?.(event);
    };

  client.activate();

  return client;
}

export function sendSharedStroke(
  client,
  {
    spaceId,
    slideId,
    stroke,
  },
) {
  if (
    !spaceId ||
    !slideId ||
    !stroke
  ) {
    return false;
  }

  const strokeId =
    stroke?.id ??
    stroke?.strokeId ??
    stroke?.stroke_id ??
    null;

  return publishOrQueue(
    client,
    {
      destination:
        `/app/spaces/${spaceId}/slides/${slideId}/shared-strokes`,

      headers:
        getAuthorizationHeaders(),

      body: JSON.stringify({
        type:
          "SHARED_STROKE_CREATED",
        strokeId,
        slideId,
        stroke:
          toSocketStroke(
            stroke,
          ),
      }),
    },
  );
}

export function sendStrokeAck(
  client,
  {
    spaceId,
    slideId,
    lastReceivedStrokeSeq,
  },
) {
  const strokeSeq =
    Number(
      lastReceivedStrokeSeq,
    );

  if (
    !spaceId ||
    !slideId ||
    !Number.isFinite(
      strokeSeq,
    )
  ) {
    return false;
  }

  return publishOrQueue(
    client,
    {
      destination:
        `/app/spaces/${spaceId}/slides/${slideId}/ack`,

      headers:
        getAuthorizationHeaders(),

      body: JSON.stringify({
        lastReceivedStrokeSeq:
          strokeSeq,
      }),
    },
  );
}

export function requestStrokeResync(
  client,
  {
    spaceId,
    slideId,
    lastReceivedStrokeSeq = 0,
  },
) {
  if (
    !spaceId ||
    !slideId
  ) {
    return false;
  }

  return publishOrQueue(
    client,
    {
      destination:
        `/app/spaces/${spaceId}/slides/${slideId}/resync`,

      headers:
        getAuthorizationHeaders(),

      body: JSON.stringify({
        lastReceivedStrokeSeq:
          Number(
            lastReceivedStrokeSeq,
          ) || 0,
      }),
    },
  );
}