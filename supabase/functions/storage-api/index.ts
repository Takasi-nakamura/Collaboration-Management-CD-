import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const BUCKET = "collaboration-files";
const FIREBASE_API_KEY = "AIzaSyBJSyPxVJDWezDvLhYWJ80TWFv441IeA8A";
const MAX_FILE_SIZE = 50 * 1024 * 1024;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function getSecretKey() {
  const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (raw) {
    try {
      const keys = JSON.parse(raw);
      if (keys.default) return keys.default;
    } catch {}
  }
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) return legacy;
  throw new Error("Supabase secret key is not configured");
}

function getPath(req: Request) {
  return new URL(req.url).searchParams.get("path") || "";
}

function validPath(path: string, uid: string) {
  return path.startsWith(`users/${uid}/uploads/`) &&
    !path.includes("..") &&
    !path.includes("//") &&
    path.length <= 500;
}

async function verifyFirebase(req: Request) {
  const auth = req.headers.get("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token) throw new Error("Unauthorized");

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: token }),
    },
  );

  if (!response.ok) throw new Error("Firebase authentication failed");
  const data = await response.json();
  const user = data?.users?.[0];
  if (!user?.localId || user.disabled) throw new Error("Firebase user is invalid");
  return user.localId as string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const uid = await verifyFirebase(req);
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      getSecretKey(),
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const url = new URL(req.url);
    const action = url.pathname.split("/").pop() || "";

    if (action === "upload" && req.method === "POST") {
      const path = getPath(req);
      if (!validPath(path, uid)) return json({ error: "Invalid storage path" }, 403);
      const form = await req.formData();
      const file = form.get("file");
      if (!(file instanceof File)) return json({ error: "File is required" }, 400);
      if (file.size > MAX_FILE_SIZE) return json({ error: "ファイルは50MB以下にしてください。" }, 413);

      const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
        contentType: file.type || "application/octet-stream",
        upsert: true,
      });
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true, path, fileName: file.name, fileSize: file.size, mimeType: file.type });
    }

    if (action === "signed" && req.method === "GET") {
      const path = getPath(req);
      if (!validPath(path, uid)) return json({ error: "Invalid storage path" }, 403);
      const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
      if (error || !data?.signedUrl) return json({ error: error?.message || "Could not create signed URL" }, 404);
      return json({ ok: true, url: data.signedUrl });
    }

    if (action === "delete" && req.method === "DELETE") {
      const path = getPath(req);
      if (!validPath(path, uid)) return json({ error: "Invalid storage path" }, 403);
      const { error } = await supabase.storage.from(BUCKET).remove([path]);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    return json({ error: "Not found" }, 404);
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Storage API error";
    return json({ error: message }, message === "Unauthorized" ? 401 : 500);
  }
});
