"use client";

import { useEffect } from "react";
import getConfig from "next/config";

export default function RegisterPWA() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    // @ts-ignore
    if (window.serwist === undefined) return;

    const { publicRuntimeConfig } = getConfig() || {};
    const basePath = publicRuntimeConfig?.BASE_PATH || "";
    const url = `${basePath || ""}/sw.js`;
    const scope = `${basePath || ""}/`;
    try {
      // @ts-ignore
      window.serwist.register({ url, scope }).catch(() => {});
    } catch {
      // noop
    }
  }, []);
  return null;
}

