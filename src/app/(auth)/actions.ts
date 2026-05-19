"use server";

import type { AuthError } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { provisionSignupWorkspace } from "@/services/workspace-service";
import type { WorkspaceIndustry } from "@/types/workspace";

const allowedIndustries = new Set<WorkspaceIndustry>([
  "office",
  "restaurant",
  "retail",
  "services",
  "transport"
]);

const signupProfileIndustries: Record<string, WorkspaceIndustry> = {
  associations: "services",
  "commerce-distribution": "retail",
  "hotellerie-restauration": "restaurant",
  "industrie-btp": "services",
  "sante-medico-social": "services",
  "services-a-la-personne": "services",
  "tech-startup": "office",
  "transport-logistique": "transport"
};

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
  const industryInput = String(formData.get("industry") ?? "").trim() as WorkspaceIndustry;
  const industry =
    signupProfileIndustries[profile] ?? (allowedIndustries.has(industryInput) ? industryInput : null);
  const signupPath = getSignupRedirectPath(profile);

  if (!workspace || !email || password.length < 6) {
    redirect(`${signupPath}${signupPath.includes("?") ? "&" : "?"}error=invalid_signup_fields`);
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
    redirect(`${signupPath}${signupPath.includes("?") ? "&" : "?"}error=${getSignupErrorCode(error)}`);
  }

  if (!data.user) {
    redirect(`${signupPath}${signupPath.includes("?") ? "&" : "?"}error=signup_failed`);
  }

  try {
    await provisionSignupWorkspace({
      email,
      industry,
      userId: data.user.id,
      workspaceName: workspace
    });
  } catch (provisionError) {
    console.error(provisionError);
    redirect(`${signupPath}${signupPath.includes("?") ? "&" : "?"}error=workspace_setup_failed`);
  }

  redirect("/dashboard");
}

function getSignupRedirectPath(profile: string) {
  if (!profile) {
    return "/signup";
  }

  return `/signup?profile=${encodeURIComponent(profile)}`;
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
