"use client";

import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEsc?: boolean;
  footer?: React.ReactNode;
}

const maxWidthClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  full: "max-w-full mx-4",
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = "lg",
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEsc = true,
  footer,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !closeOnEsc) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeOnEsc, onClose]);

  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === overlayRef.current) {
      onClose();
    }
  };

  const [isVisible, setIsVisible] = React.useState(false);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  if (!isOpen && !isVisible) return null;

  return createPortal(
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className={`
        fixed inset-0 z-50 flex items-start justify-center
        pt-[10vh] px-4
        bg-black/30 backdrop-blur-xl
        transition-opacity duration-300 ease-out
        ${isVisible ? "opacity-100" : "opacity-0"}
      `}
      aria-modal="true"
      role="dialog"
    >
      <div
        ref={contentRef}
        className={`
          w-full ${maxWidthClasses[maxWidth]}
          bg-white/95 dark:bg-gray-900/95
          rounded-2xl shadow-apple-lg
          border border-gray-200/50 dark:border-gray-700/50
          transform transition-all duration-300 ease-out
          ${isVisible ? "scale-100 translate-y-0 opacity-100" : "scale-[0.95] -translate-y-4 opacity-0"}
        `}
      >
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200/50 dark:border-gray-800/50">
            <div className="flex-1 min-w-0">
              {title && (
                <h2 className="text-[17px] font-semibold text-gray-900 dark:text-white tracking-tight">
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-1 text-[13px] text-gray-500 dark:text-gray-400">
                  {description}
                </p>
              )}
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="ml-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        <div className="px-5 py-4">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-200/50 dark:border-gray-800/50">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export function useModal(initialOpen = false) {
  const [isOpen, setIsOpen] = React.useState(initialOpen);

  const open = React.useCallback(() => setIsOpen(true), []);
  const close = React.useCallback(() => setIsOpen(false), []);
  const toggle = React.useCallback(() => setIsOpen((prev) => !prev), []);

  return { isOpen, open, close, toggle, setIsOpen };
}

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "default";
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
}: ConfirmModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="sm"
      showCloseButton={false}
      footer={
        <>
          <button
            onClick={onClose}
            className="px-4 py-2 text-[13px] text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors font-medium"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 text-[13px] font-medium text-white rounded-xl transition-all duration-200 ${
              variant === "danger"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100"
            }`}
          >
            {confirmText}
          </button>
        </>
      }
    >
      <p className="text-[15px] text-gray-600 dark:text-gray-400">{message}</p>
    </Modal>
  );
}
