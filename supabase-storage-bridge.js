(() => {
  "use strict";
  const FUNCTION_URL = "https://hxbwsrsphkpvhjngyobu.supabase.co/functions/v1/storage-api";

  async function authToken() {
    const auth = window.__cmFirebaseAuth || window.firebase?.auth?.();
    const user = auth?.currentUser;
    if (!user) throw new Error("ログインしてください。");
    return user.getIdToken();
  }

  async function request(path, options = {}) {
    const token = await authToken();
    const headers = new Headers(options.headers || {});
    headers.set("Authorization", `Bearer ${token}`);
    const response = await fetch(`${FUNCTION_URL}${path}`, { ...options, headers });
    let data = null;
    try { data = await response.json(); } catch {}
    if (!response.ok) throw new Error(data?.error || `Storage API error (${response.status})`);
    return data;
  }

  function ref(path) {
    return {
      async put(file) {
        const form = new FormData();
        form.append("file", file, file.name || "upload");
        await request(`/upload?path=${encodeURIComponent(path)}`, { method: "POST", body: form });
        return { ref: this };
      },
      async getDownloadURL() {
        const data = await request(`/signed?path=${encodeURIComponent(path)}`);
        return data.url;
      },
      async delete() {
        await request(`/delete?path=${encodeURIComponent(path)}`, { method: "DELETE" });
      }
    };
  }

  window.__cmStorageBridge = { ref };
  if (window.firebase) window.firebase.storage = () => window.__cmStorageBridge;
})();
