"use server";

import type { AuthError } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { provisionTenant } from "@/services/tenant-service";

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
