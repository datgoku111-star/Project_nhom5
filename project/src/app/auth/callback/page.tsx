"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { Route } from "@/routers/types";
import Link from "next/link";

const getRedirectUrlByRole = (role?: string, fallback = "/") => {
  if (role === "ADMIN") return "/admin/dashboard";
  if (role === "RECEPTIONIST") return "/dashboard/receptionist";
  if (role === "HOUSEKEEPING") return "/housekeeping";
  if (role === "KITCHEN") return "/orders";
  return fallback;
};

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, login } = useAuth();

  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const hasExchanged = useRef(false);

  const code = searchParams?.get("code");
  const errorParam = searchParams?.get("error_description") || searchParams?.get("error");
  const next = searchParams?.get("next") || searchParams?.get("callbackUrl") || "/";

  // Watch for authenticated user in context to redirect
  useEffect(() => {
    if (user) {
      const targetUrl = getRedirectUrlByRole(user.role, next);
      router.replace(targetUrl as Route);
    }
  }, [user, next, router]);

  // Handle OAuth code exchange
  useEffect(() => {
    if (hasExchanged.current) return;
    hasExchanged.current = true;

    if (errorParam) {
      setStatus("error");
      setErrorMessage(errorParam);
      return;
    }

    const processAuth = async () => {
      try {
        let activeSession = null;

        if (code) {
          // Exchange code for Supabase session
          const { data, error } = await supabaseBrowser.auth.exchangeCodeForSession(code);
          if (error) {
            console.warn("exchangeCodeForSession warning:", error);
            // Fallback to checking active session in case it was already processed
            const { data: sessionData } = await supabaseBrowser.auth.getSession();
            activeSession = sessionData.session;
            if (!activeSession) {
              throw error;
            }
          } else {
            activeSession = data.session;
          }
        } else {
          // Check if session exists (e.g. hash-based OAuth or pre-authenticated)
          const { data: sessionData } = await supabaseBrowser.auth.getSession();
          activeSession = sessionData.session;
        }

        if (activeSession) {
          // Sync session with backend to set HttpOnly auth_token cookie and create user record if needed
          const res = await fetch("/api/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session: activeSession }),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.user) {
              login(data.user);
              const targetUrl = getRedirectUrlByRole(data.user.role, next);
              router.replace(targetUrl as Route);
              return;
            }
          }
        } else if (!code) {
          // No code and no session found
          setStatus("error");
          setErrorMessage("Không tìm thấy mã xác thực Google. Vui lòng thử đăng nhập lại.");
        }
      } catch (err: any) {
        console.error("Auth callback error:", err);
        setStatus("error");
        setErrorMessage(
          err.message || "Đã xảy ra lỗi khi xác thực tài khoản Google. Vui lòng thử lại."
        );
      }
    };

    processAuth();
  }, [code, errorParam, next, router, login]);

  if (status === "error") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full p-8 text-center bg-white dark:bg-neutral-800 rounded-2xl shadow-lg border border-neutral-200 dark:border-neutral-700">
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
            Đăng nhập thất bại
          </h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-6">
            {errorMessage}
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors"
          >
            Quay lại trang Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full p-8 text-center bg-white dark:bg-neutral-800 rounded-2xl shadow-lg border border-neutral-200 dark:border-neutral-700">
        <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
          Đang xử lý đăng nhập Google...
        </h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          Vui lòng đợi giây lát, hệ thống đang đồng bộ và chuyển hướng tài khoản của bạn.
        </p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
