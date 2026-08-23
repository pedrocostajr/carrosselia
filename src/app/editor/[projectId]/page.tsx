import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { isAdminEmail } from "@/lib/admin/config";
import { getEditorData } from "@/lib/data/editor";
import { EditorShell } from "@/components/editor/editor-shell";
import { MissingSupabaseConfig } from "@/components/missing-supabase-config";
import { ApprovalGate } from "@/components/admin/approval-gate";

export default async function EditorPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  if (!isSupabaseConfigured()) {
    return <MissingSupabaseConfig />;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const isAdmin = isAdminEmail(user.email);
  const { data: profile } = await supabase
    .from("profiles")
    .select("approval_status")
    .eq("id", user.id)
    .maybeSingle();
  const approvalStatus = profile?.approval_status ?? (isAdmin ? "approved" : "pending");
  if (approvalStatus === "pending" || approvalStatus === "rejected") {
    return <ApprovalGate status={approvalStatus} />;
  }

  const data = await getEditorData(projectId);
  if (!data) notFound();

  return <EditorShell data={data} userId={user.id} />;
}
