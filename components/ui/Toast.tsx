"use client";

import React from "react";
import { Toast as ToastType, useToastStore } from "@/lib/toastStore";
import {
  CheckCircle,
  XCircle,
  Info,
  AlertTriangle,
  X,
} from "lucide-react";

interface ToastProps {
  toast: ToastType;
}

const toastIcons = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const toastStyles = {
  success: "bg-green-500/10 text-green-600 dark:text-green-400",
  error: "bg-red-500/10 text-red-600 dark:text-red-400",
  info: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

export function Toast({ toast }: ToastProps) {
  const { removeToast } = useToastStore();
  const Icon = toastIcons[toast.type];

  return (
    <div
      className="relative flex items-start gap-3 p-4 rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-apple-lg animate-slide-in"
      role="alert"
    >
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${toastStyles[toast.type]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="font-semibold text-gray-900 dark:text-white text-[14px]">
          {toast.title}
        </p>
        {toast.message && (
          <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">
            {toast.message}
          </p>
        )}
      </div>
      <button
        onClick={() => removeToast(toast.id)}
        className="flex-shrink-0 p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
        aria-label="Close"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 w-full max-w-sm">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
