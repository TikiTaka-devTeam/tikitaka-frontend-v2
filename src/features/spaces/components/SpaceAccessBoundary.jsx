import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Navigate, Outlet, useLocation, useParams } from "react-router-dom";
import { apiClient } from "../../../lib/api/client.js";
import { getSpaces } from "../api/spacesApi.js";
import { SpaceAccessContext } from "../context/SpaceAccessContext.js";
import { ARCHIVED_SPACE_MESSAGE, findSpaceAccess, isSpaceMutation } from "../utils/spaceAccess.js";
import "../styles/space-access.css";
import SpaceLayout from "./SpaceLayout.jsx";

export default function SpaceAccessBoundary() {
  const { spaceId } = useParams();
  const location = useLocation();
  const scope = spaceId;
  const [access, setAccess] = useState({ scope: "", status: "", name: "", error: "" });
  const [checking, setChecking] = useState(false);
  const requestRef = useRef(null);
  const mutationBlockedRef = useRef(true);
  const archived = access.status === "ARCHIVED";
  const ready = access.scope === scope && Boolean(access.status);
  const readOnly = !ready || Boolean(access.error) || archived;

  useLayoutEffect(() => {
    mutationBlockedRef.current = readOnly;
  }, [readOnly]);

  useLayoutEffect(() => {
    const interceptor = apiClient.interceptors.request.use((config) => {
      if (mutationBlockedRef.current && isSpaceMutation(config, spaceId)) {
        throw new Error(ARCHIVED_SPACE_MESSAGE);
      }
      return config;
    });
    return () => apiClient.interceptors.request.eject(interceptor);
  }, [spaceId]);

  const refresh = useCallback(async () => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setChecking(true);
    try {
      const [active, archivedList] = await Promise.all([
        getSpaces("ACTIVE", { signal: controller.signal }),
        getSpaces("ARCHIVED", { signal: controller.signal }),
      ]);
      if (controller.signal.aborted) return;
      const next = findSpaceAccess(spaceId, active, archivedList);
      setAccess({ ...next, scope, error: "" });
    } catch (error) {
      if (controller.signal.aborted) return;
      setAccess((previous) => ({
        ...previous,
        error: error?.response?.data?.message || error.message || "Space 상태를 확인하지 못했습니다.",
      }));
    } finally {
      if (!controller.signal.aborted) setChecking(false);
    }
  }, [spaceId, scope]);

  useEffect(() => {
    void refresh();
    const onFocus = () => { void refresh(); };
    window.addEventListener("focus", onFocus);
    return () => {
      requestRef.current?.abort();
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);

  if (!ready && access.error) {
    return <div className="space-access-state" role={access.error ? "alert" : "status"}>
      <p>{access.error}</p>
      <button type="button" disabled={checking} onClick={refresh}>다시 시도</button>
    </div>;
  }
  if (archived && location.pathname.endsWith("/modify")) {
    return <Navigate to={`/spaces/${spaceId}`} replace state={{ spaceName: access.name }} />;
  }

  return <SpaceAccessContext.Provider value={{ readOnly, archived, spaceId, spaceName: access.name }}>
    {access.error && <div className="space-access-state" role="alert">
      <p>{access.error}</p>
      <button type="button" disabled={checking} onClick={refresh}>다시 시도</button>
    </div>}
    <SpaceLayout><Outlet /></SpaceLayout>
  </SpaceAccessContext.Provider>;
}
