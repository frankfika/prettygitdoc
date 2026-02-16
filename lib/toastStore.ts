import { create } from "zustand";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

const MAX_TOASTS = 3;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  addToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    set((state) => {
      // Remove oldest toast if at max
      const newToasts = state.toasts.length >= MAX_TOASTS
        ? state.toasts.slice(1)
        : state.toasts;

      return {
        toasts: [...newToasts, { ...toast, id }],
      };
    });

    // Auto remove after duration
    const duration = toast.duration ?? 4000;
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, duration);
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  clearAll: () => {
    set({ toasts: [] });
  },
}));

// Helper functions for common toast types
export const toast = {
  success: (title: string, message?: string, duration?: number) => {
    useToastStore.getState().addToast({
      type: "success",
      title,
      message,
      duration,
    });
  },

  error: (title: string, message?: string, duration?: number) => {
    useToastStore.getState().addToast({
      type: "error",
      title,
      message,
      duration: duration ?? 6000, // Errors stay longer
    });
  },

  info: (title: string, message?: string, duration?: number) => {
    useToastStore.getState().addToast({
      type: "info",
      title,
      message,
      duration,
    });
  },

  warning: (title: string, message?: string, duration?: number) => {
    useToastStore.getState().addToast({
      type: "warning",
      title,
      message,
      duration,
    });
  },
};
