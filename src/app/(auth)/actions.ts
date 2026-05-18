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
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const workspace = String(formData.get("workspace") ?? "");

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
    redirect("/signup?error=signup_failed");
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
