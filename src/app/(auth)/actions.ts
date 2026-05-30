"use server";

import type { AuthError } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { provisionTenant } from "@/services/tenant-service";
import { onUserSignup } from "@/lib/brevo";

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/login?error=missing_credentials");
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    console.error("Supabase signin failed", {
      code: error.code,
      message: error.message,
      status: error.status
    });
    redirect(`/login?error=${getSigninErrorCode(error)}`);
  }

  redirect("/dashboard");
}

export async function signUp(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const workspace = String(formData.get("workspace") ?? "").trim();
  const profile = String(formData.get("profile") ?? "").trim();

  if (!workspace || !email || password.length < 6) {
    redirect(getSignupErrorPath(profile, "invalid_signup_fields"));
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        workspace
      }
    }
  });

  if (error) {
    console.error("Supabase signup failed", {
      code: error.code,
      message: error.message,
      status: error.status
    });
    redirect(getSignupErrorPath(profile, getSignupErrorCode(error)));
  }

  if (!data.user) {
    redirect(getSignupErrorPath(profile, "signup_failed"));
  }

  try {
    await provisionTenant({
      userId:     data.user.id,
      email,
      tenantName: workspace,
      ...(profile ? { profile } : {}),
    });
  } catch (provisionError) {
    console.error(provisionError);
    redirect(getSignupErrorPath(profile, "workspace_setup_failed"));
  }

  // Email de bienvenue — fire and forget (erreur non bloquante)
  onUserSignup({
    email,
    company:    workspace,
    sector:     profile || undefined,
    trialEndAt: new Date(Date.now() + 14 * 86400000),
  }).catch((err: unknown) => {
    console.error("[Brevo] onUserSignup failed:", err);
  });

  redirect("/onboarding" as never);
}

function getSignupErrorPath(profile: string, error: string): `/signup?${string}` {
  const params = new URLSearchParams({ error });

  if (profile) {
    params.set("profile", profile);
  }

  return `/signup?${params.toString()}`;
}

function getSignupErrorCode(error: AuthError) {
  const message = error.message.toLowerCase();

  if (error.code === "weak_password" || message.includes("password")) {
    return "weak_password";
  }

  if (message.includes("already") || message.includes("registered")) {
    return "email_already_registered";
  }

  if (message.includes("rate limit")) {
    return "rate_limit";
  }

  if (message.includes("database")) {
    return "auth_database_error";
  }

  if (message.includes("invalid") && message.includes("email")) {
    return "invalid_email";
  }

  if (
    (message.includes("signup") && message.includes("disabled")) ||
    (message.includes("email") && message.includes("disabled")) ||
    message.includes("provider is not enabled")
  ) {
    return "signup_disabled";
  }

  return "signup_failed";
}

export async function forgotPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    redirect("/forgot-password?error=invalid_email" as never);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/auth/callback?next=/reset-password`,
  });

  if (error) {
    console.error("forgotPassword failed:", error.message);
    redirect("/forgot-password?error=reset_failed" as never);
  }

  redirect("/forgot-password?sent=1" as never);
}

export async function resetPassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirm  = String(formData.get("confirm")  ?? "");

  if (password.length < 8) {
    redirect("/reset-password?error=weak_password" as never);
  }

  if (password !== confirm) {
    redirect("/reset-password?error=password_mismatch" as never);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    console.error("resetPassword failed:", error.message);
    redirect("/reset-password?error=reset_failed" as never);
  }

  redirect("/dashboard");
}

function getSigninErrorCode(error: AuthError) {
  const message = error.message.toLowerCase();

  if (message.includes("email not confirmed") || message.includes("not confirmed")) {
    return "email_not_confirmed";
  }

  if (message.includes("invalid login") || message.includes("invalid credentials")) {
    return "invalid_credentials";
  }

  if (message.includes("email")) {
    return "invalid_email";
  }

  return "signin_failed";
}
