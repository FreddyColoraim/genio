"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { provisionSignupWorkspace } from "@/services/workspace-service";

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect("/login?error=invalid_credentials");
  }

  redirect("/dashboard");
}

export async function signUp(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const workspace = String(formData.get("workspace") ?? "").trim();

  if (!workspace || !email || password.length < 6) {
    redirect("/signup?error=invalid_signup_fields");
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
    redirect(`/signup?error=${getSignupErrorCode(error)}`);
  }

  if (!data.user) {
    redirect("/signup?error=signup_failed");
  }

  try {
    await provisionSignupWorkspace({
      email,
      userId: data.user.id,
      workspaceName: workspace
    });
  } catch (provisionError) {
    console.error(provisionError);
    redirect("/signup?error=workspace_setup_failed");
  }

  redirect("/dashboard");
}

function getSignupErrorCode(error: { code?: string; message?: string }) {
  const message = error.message?.toLowerCase() ?? "";

  if (error.code === "weak_password" || message.includes("password")) {
    return "weak_password";
  }

  if (message.includes("already") || message.includes("registered")) {
    return "email_already_registered";
  }

  if (message.includes("invalid") && message.includes("email")) {
    return "invalid_email";
  }

  if (message.includes("signup") && message.includes("disabled")) {
    return "signup_disabled";
  }

  return "signup_failed";
}
