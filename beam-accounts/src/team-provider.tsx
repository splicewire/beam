import { createContext, useContext, type ReactNode } from "react";
import type { TeamServices } from "./team-types";
const Context = createContext<TeamServices | null>(null);
export function TeamProvider({
  services,
  children,
}: {
  services: TeamServices;
  children: ReactNode;
}) {
  return <Context.Provider value={services}>{children}</Context.Provider>;
}
export function useTeamServices(): TeamServices {
  const services = useContext(Context);
  if (!services)
    throw new Error("TeamPage must be rendered inside TeamProvider.");
  return services;
}
