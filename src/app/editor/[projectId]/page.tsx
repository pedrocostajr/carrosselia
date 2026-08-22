import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getEditorData } from "@/lib/data/editor";
import { EditorShell } from "@/components/editor/editor-shell";

export default async function EditorPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const data = await getEditorData(projectId);
  if (!data) notFound();

  return <EditorShell data={data} userId={user.id} />;
}
