import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  getPrivateStrokes,
  getSharedStrokes,
  syncPrivateStrokes,
  syncSharedStrokes,
} from "../api/strokeApi";

import {
  createLectureSocket,
  sendSharedStroke,
} from "../api/lectureSocket";

import {
  createUuid,
  normalizeStroke,
  toStrokeRequest,
} from "../utils/lectureData";

import { createSharedStrokeSync, createLiveStrokeSender, sortStrokes } from "../utils/sharedStrokeSync.js";

export default function useLectureStrokes({
  spaceId,
  currentSlideId,
  editableLayer,

  privateStrokes,
  setPrivateStrokes,

  sharedStrokes,
  setSharedStrokes,

  privateVersionsRef,
  sharedVersionsRef,

  privateQueueRef,
  sharedQueueRef,

  setToast,
}) {
  const [
    undoStack,
    setUndoStack,
  ] = useState([]);

  const [
    redoStack,
    setRedoStack,
  ] = useState([]);

  const sessionRef = useRef(null);
  const [liveStrokes, setLiveStrokes] = useState([]);
  const [historySlideId, setHistorySlideId] = useState(currentSlideId);
  if (historySlideId !== currentSlideId) {
    setHistorySlideId(currentSlideId);
    setLiveStrokes([]);
    setUndoStack([]);
    setRedoStack([]);
  }
  const strokeMappingsRef = useRef(new Map());

  useEffect(() => {
    const session = { slideId: currentSlideId, client: null, sync: null, sender: null };
    sessionRef.current = session;
    if (!currentSlideId) return () => { sessionRef.current = null; };
    const reportError = (error) => {
      if (sessionRef.current === session) {
        setToast(error?.response?.data?.message ?? "공유 필기 연결을 복구하는 중입니다.");
      }
    };
    session.sync = createSharedStrokeSync({
      slideId: currentSlideId, spaceId,
      fetchSnapshot: () => getSharedStrokes(currentSlideId),
      onError: reportError,
      onChange: ({ version, strokes, liveStrokes: live, completed }) => {
        if (sessionRef.current !== session) return;
        sharedVersionsRef.current.set(currentSlideId, version);
        setSharedStrokes((previous) => sortStrokes([
          ...strokes,
          ...previous.filter((stroke) => String(stroke.id).startsWith("local-") &&
            stroke.slideId === currentSlideId && !completed.has(stroke.clientStrokeId)),
        ]));
        setLiveStrokes(live.filter((stroke) => !session.ownDraftIds.has(stroke.id.slice(5))));
      },
    });
    session.ownDraftIds = new Set();
    session.sender = createLiveStrokeSender((event) => sendSharedStroke(session.client, {
      spaceId, slideId: currentSlideId, event,
    }));
    // Keep saved notes readable if the WebSocket service is unavailable.
    const fallbackTimer = setTimeout(() => {
      if (!session.client?.connected) void session.sync.refresh();
    }, 3000);
    if (spaceId) {
      session.client = createLectureSocket({
        spaceId, slideId: currentSlideId,
        onSharedStroke: session.sync.receive,
        beforeReconnect: () => getSharedStrokes(currentSlideId),
        onConnect: () => {
          clearTimeout(fallbackTimer);
          session.sender.reset();
          void session.sync.reconnect();
        },
        onDisconnect: () => session.sender.reset(),
        onError: reportError,
      });
    } else {
      void session.sync.refresh();
    }
    return () => {
      clearTimeout(fallbackTimer);
      session.sender.dispose();
      session.sync.dispose();
      void session.client?.deactivate();
      if (sessionRef.current === session) sessionRef.current = null;
    };
  }, [currentSlideId, spaceId, sharedVersionsRef, setSharedStrokes, setToast]);

  const handleLiveStroke = useCallback((stroke, phase = "UPDATE") => {
    const session = sessionRef.current;
    if (editableLayer !== "SHARED" || session?.slideId !== currentSlideId) return;
    if (phase === "CANCEL") {
      session.sender.cancel(stroke.clientStrokeId);
      return;
    }
    session.ownDraftIds.add(stroke.clientStrokeId);
    session.sender.update(stroke);
    if (phase === "END") session.sender.end(stroke.clientStrokeId);
  }, [editableLayer, currentSlideId]);

  function getLayerState(
    layer,
  ) {
    if (
      layer ===
      "SHARED"
    ) {
      return {
        strokes:
          sharedStrokes,

        setStrokes:
          setSharedStrokes,

        sync:
          syncSharedStrokes,

        versions:
          sharedVersionsRef,

        queue:
          sharedQueueRef,
      };
    }

    return {
      strokes:
        privateStrokes,

      setStrokes:
        setPrivateStrokes,

      sync:
        syncPrivateStrokes,

      versions:
        privateVersionsRef,

      queue:
        privateQueueRef,
    };
  }

  function enqueueLayerTask(
    layer,
    task,
  ) {
    const {
      queue,
    } =
      getLayerState(
        layer,
      );

    const nextTask =
      queue.current
        .catch(
          () => undefined,
        )
        .then(task);

    queue.current =
      nextTask;

    return nextTask;
  }

  async function refreshLayer(layer, slideId, session = sessionRef.current) {
    if (layer === "SHARED" && session?.slideId === slideId && sessionRef.current === session) {
      await session.sync.refresh();
      if (!session.sync.isReady()) throw new Error("공유 필기를 불러온 후 다시 시도해주세요.");
      return;
    }
    const response = await (layer === "SHARED" ? getSharedStrokes : getPrivateStrokes)(slideId);
    const { versions, setStrokes } = getLayerState(layer);
    versions.current.set(slideId, Number(response.version));
    if (sessionRef.current === session && session?.slideId === slideId) {
      setStrokes(sortStrokes((response.strokes ?? []).map(normalizeStroke).filter((stroke) => !stroke.isDeleted)));
    }
  }

  async function syncOperations(layer, slideId, operations, session) {
    const { sync, versions } = getLayerState(layer);
    if (layer === "SHARED" && sessionRef.current === session && !session.sync.isReady()) {
      await session.sync.refresh();
      if (!session.sync.isReady()) throw new Error("공유 필기를 불러온 후 다시 시도해주세요.");
    }
    if (!versions.current.has(slideId)) await refreshLayer(layer, slideId, session);
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        return await sync(slideId, { base_version: versions.current.get(slideId) ?? 0, operations });
      } catch (error) {
        const code = error?.response?.data?.code ?? error?.response?.data?.error_code ?? error?.response?.data?.error?.code;
        if (attempt !== 0 || code !== "NOTE_VERSION_CONFLICT") throw error;
        await refreshLayer(layer, slideId, session);
      }
    }
  }

  async function createStrokeOnServer(
    stroke,
    recordHistory = true,
  ) {
    if (!currentSlideId) {
      return null;
    }

    const slideId =
      currentSlideId;

    const layer =
      editableLayer;

    const {
      setStrokes,
      versions,
    } =
      getLayerState(
        layer,
      );

    const session = sessionRef.current;
    const clientStrokeId = stroke.clientStrokeId ?? createUuid();

    const localStrokeId =
      `local-${clientStrokeId}`;

    const optimisticStroke = {
      ...stroke,
      id: localStrokeId,
      clientStrokeId,
      slideId,
    };

    setStrokes(
      (previous) => [
        ...previous,
        optimisticStroke,
      ],
    );

    return enqueueLayerTask(
      layer,
      async () => {
        try {
          const response = await syncOperations(layer, slideId, [{
            client_operation_id: createUuid(), type: "CREATE",
            stroke: toStrokeRequest(stroke, clientStrokeId),
          }], session);
          const responseVersion = Number(response.version);
          if (layer === "PRIVATE") versions.current.set(slideId, responseVersion);

          const mapping =
            (
              response?.created_strokes ??
              []
            ).find(
              (item) =>
                item.client_stroke_id ===
                clientStrokeId,
            );

          if (!mapping?.stroke_id) throw new Error("필기 저장 응답에 stroke_id가 없습니다.");

          const savedStroke = {
            ...optimisticStroke,

            id:
              mapping?.stroke_id,
          };

          if (
            sessionRef.current === session
          ) {
            setStrokes((previous) => sortStrokes([
              ...previous.filter((item) => item.id !== localStrokeId && item.id !== savedStroke.id),
              savedStroke,
            ]));
          }

          strokeMappingsRef.current.set(localStrokeId, savedStroke.id);
          if (layer === "SHARED" && sessionRef.current === session) {
            session.sender.saved(clientStrokeId);
            session.sync.acceptSaved(response, [{
              ...toStrokeRequest(stroke, clientStrokeId), stroke_id: savedStroke.id,
            }]);
          } else if (layer === "SHARED") {
            versions.current.set(slideId, Math.max(versions.current.get(slideId) ?? 0, responseVersion));
          }

          if (
            recordHistory &&
            sessionRef.current === session
          ) {
            setUndoStack(
              (previous) => [
                ...previous,
                {
                  type:
                    "CREATE",

                  strokes: [
                    savedStroke,
                  ],
                },
              ],
            );

            setRedoStack(
              [],
            );
          }

          return savedStroke;
        } catch (error) {
          if (
            sessionRef.current === session
          ) {
            setStrokes(
              (previous) =>
                previous.filter(
                  (item) =>
                    item.id !==
                    localStrokeId,
                ),
            );
          }

          if (layer === "SHARED") session?.sender.cancel(clientStrokeId);
          try { await refreshLayer(layer, slideId, session); }
          catch (refreshError) { console.error("필기 복구 실패", refreshError); }

          setToast(
            error?.response
              ?.data
              ?.message ??
              "필기를 저장하지 못했습니다.",
          );

          return null;
        }
      },
    );
  }

  async function deleteStrokesOnServer(
    strokeIds,
    recordHistory = true,
  ) {
    if (
      !currentSlideId ||
      !strokeIds.length
    ) {
      return [];
    }

    const slideId =
      currentSlideId;

    const layer =
      editableLayer;

    const {
      strokes,
      setStrokes,
      versions,
    } =
      getLayerState(
        layer,
      );

    const session = sessionRef.current;

    const removed =
      strokes.filter(
        (stroke) =>
          strokeIds.includes(
            stroke.id,
          ),
      );

    setStrokes(
      (previous) =>
        previous.filter(
          (stroke) =>
            !strokeIds.includes(
              stroke.id,
            ),
        ),
    );

    return enqueueLayerTask(
      layer,
      async () => {
        try {
          const serverStrokeIds = strokeIds.map((id) =>
            String(id).startsWith("local-") ? strokeMappingsRef.current.get(id) : id,
          ).filter(Boolean);
          if (!serverStrokeIds.length) return [];
          const response = await syncOperations(layer, slideId, serverStrokeIds.map((id) => ({
            client_operation_id: createUuid(), type: "DELETE", stroke_id: id,
          })), session);
          if (layer === "SHARED" && sessionRef.current === session) {
            session.sync.acceptSaved(response, [], serverStrokeIds);
          } else {
            versions.current.set(slideId, Number(response.version));
          }
          if (sessionRef.current === session) {
            setStrokes((previous) => previous.filter((stroke) => !serverStrokeIds.includes(stroke.id)));
          }

          if (
            recordHistory &&
            removed.length &&
            sessionRef.current === session
          ) {
            setUndoStack(
              (previous) => [
                ...previous,
                {
                  type:
                    "DELETE",

                  strokes:
                    removed,
                },
              ],
            );

            setRedoStack(
              [],
            );
          }

          return removed;
        } catch (error) {
          try { await refreshLayer(layer, slideId, session); }
          catch (refreshError) { console.error("필기 복구 실패", refreshError); }

          setToast(
            error?.response
              ?.data
              ?.message ??
              "필기를 삭제하지 못했습니다.",
          );

          return [];
        }
      },
    );
  }

  async function recreateStrokes(
    strokesToRestore,
  ) {
    const recreated = [];

    for (
      const stroke of
      strokesToRestore
    ) {
      const saved =
        await createStrokeOnServer(
          {
            ...stroke,
            id: undefined,
            clientStrokeId: undefined,
          },
          false,
        );

      if (saved) {
        recreated.push(
          saved,
        );
      }
    }

    return recreated;
  }

  async function handleUndo() {
    const action =
      undoStack[
        undoStack.length - 1
      ];

    if (!action) {
      return;
    }

    setUndoStack(
      (previous) =>
        previous.slice(
          0,
          -1,
        ),
    );

    if (
      action.type ===
      "CREATE"
    ) {
      await deleteStrokesOnServer(
        action.strokes.map(
          (stroke) =>
            stroke.id,
        ),
        false,
      );

      setRedoStack(
        (previous) => [
          ...previous,
          action,
        ],
      );

      return;
    }

    const recreated =
      await recreateStrokes(
        action.strokes,
      );

    setRedoStack(
      (previous) => [
        ...previous,
        {
          ...action,

          strokes:
            recreated,
        },
      ],
    );
  }

  async function handleRedo() {
    const action =
      redoStack[
        redoStack.length - 1
      ];

    if (!action) {
      return;
    }

    setRedoStack(
      (previous) =>
        previous.slice(
          0,
          -1,
        ),
    );

    if (
      action.type ===
      "CREATE"
    ) {
      const recreated =
        await recreateStrokes(
          action.strokes,
        );

      setUndoStack(
        (previous) => [
          ...previous,
          {
            ...action,

            strokes:
              recreated,
          },
        ],
      );

      return;
    }

    const removed =
      await deleteStrokesOnServer(
        action.strokes.map(
          (stroke) =>
            stroke.id,
        ),
        false,
      );

    setUndoStack(
      (previous) => [
        ...previous,
        {
          ...action,

          strokes:
            removed,
        },
      ],
    );
  }

  function resetStrokeHistory() {
    setUndoStack([]);
    setRedoStack([]);
  }

  return {
    createStrokeOnServer,
    deleteStrokesOnServer,
    handleLiveStroke,
    liveStrokes,

    handleUndo,
    handleRedo,

    resetStrokeHistory,

    canUndo:
      undoStack.length > 0,

    canRedo:
      redoStack.length > 0,
  };
}
