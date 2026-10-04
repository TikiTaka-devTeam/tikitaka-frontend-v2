import { createContext, useContext } from "react";

export const SpaceAccessContext = createContext({ readOnly: true, archived: false });

export function useSpaceAccess() {
  return useContext(SpaceAccessContext);
}
