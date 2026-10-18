import { createContext, useContext } from "react";
import type { ToastInput } from "./admin-helpers";

export const ToastContext = createContext<((toast: ToastInput) => void) | null>(null);

export function useToast() {
  return useContext(ToastContext);
}
