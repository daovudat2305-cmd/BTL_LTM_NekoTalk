"use client";

import { useEffect } from "react";

/**
 * Xoa stale token khoi localStorage va cookie ngay khi trang login mount.
 * Dam bao nguoi dung khong gap loi Authorization khi token da het han
 * nhung van con luu trong trinh duyet.
 */
export default function StaleTokenCleaner() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      document.cookie = "accessToken=; path=/; max-age=0";
    }
  }, []);

  return null;
}

