(() => {
  "use strict";

  const $ = id => document.getElementById(id);
  let deferredInstallPrompt = null;

  function toast(message) {
    const el = $("toast");
    if (!el) return;
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.classList.remove("show"), 2600);
  }

  function setupInstall() {
    const button = $("installApp");
    if (!button) return;

    const standalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
    if (standalone) return;

    window.addEventListener("beforeinstallprompt", event => {
      event.preventDefault();
      deferredInstallPrompt = event;
      button.classList.remove("hidden");
    });

    button.addEventListener("click", async () => {
      if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        const choice = await deferredInstallPrompt.userChoice;
        deferredInstallPrompt = null;
        button.classList.add("hidden");
        if (choice.outcome === "accepted") toast("ホーム画面に追加しました");
        return;
      }

      toast("ブラウザのメニューから「ホーム画面に追加」または「アプリをインストール」を選択してください。");
    });

    window.addEventListener("appinstalled", () => {
      button.classList.add("hidden");
      deferredInstallPrompt = null;
    });
  }

  function setupUrlModes() {
    const direct = $("urlModeDirect");
    const search = $("urlModeSearch");
    const directFields = $("urlDirectFields");
    const searchFields = $("urlSearchFields");
    const searchInput = $("urlSearchInput");
    const searchButton = $("urlSearchButton");
    const readButton = $("urlReadButton");
    const selectedUrl = $("urlSelectedResult");
    const editorUrl = $("editorUrl");
    if (!direct || !search || !directFields || !searchFields || !searchInput || !searchButton || !readButton || !selectedUrl || !editorUrl) return;

    const setMode = mode => {
      const isSearch = mode === "search";
      direct.classList.toggle("active", !isSearch);
      search.classList.toggle("active", isSearch);
      directFields.classList.toggle("hidden", isSearch);
      searchFields.classList.toggle("hidden", !isSearch);
      if (!isSearch) setTimeout(() => editorUrl.focus(), 20);
      else setTimeout(() => searchInput.focus(), 20);
    };

    direct.addEventListener("click", () => setMode("direct"));
    search.addEventListener("click", () => setMode("search"));

    const openGoogle = () => {
      const q = searchInput.value.trim();
      if (!q) {
        searchInput.focus();
        toast("検索ワードを入力してください");
        return;
      }
      const url = `https://www.google.com/search?igu=1&q=${encodeURIComponent(q)}`;
      const popup = window.open(url, "cm-google-browser", "popup,width=1100,height=800,resizable=yes,scrollbars=yes");
      if (!popup) toast("ポップアップがブロックされています。ブラウザのポップアップを許可してください。");
    };

    searchButton.addEventListener("click", openGoogle);
    searchInput.addEventListener("keydown", e => {
      if (e.key === "Enter") {
        e.preventDefault();
        openGoogle();
      }
    });

    const useUrl = value => {
      const url = String(value || "").trim();
      if (!/^https?:\/\//i.test(url)) return false;
      selectedUrl.value = url;
      editorUrl.value = url;
      toast("URLを取り込みました");
      return true;
    };

    selectedUrl.addEventListener("input", () => useUrl(selectedUrl.value));

    readButton.addEventListener("click", async () => {
      try {
        if (!navigator.clipboard?.readText) throw new Error("clipboard-unavailable");
        const value = await navigator.clipboard.readText();
        if (!useUrl(value)) {
          toast("クリップボードにURLが見つかりません");
        }
      } catch (e) {
        console.warn("URL clipboard read failed", e);
        toast("Googleで選んだページのURLをコピーしてから押してください");
      }
    });

    setMode("direct");
  }

  function setupDeviceReset() {
    const button = $("resetDevicesButton");
    if (!button || button.dataset.bound === "1") return;
    button.dataset.bound = "1";

    button.addEventListener("click", async () => {
      const auth = window.firebase?.auth?.();
      const user = auth?.currentUser;
      if (!user) {
        toast("ログインしてください");
        return;
      }
      if (!window.confirm("登録されている端末をすべて削除しますか？\n削除後、この端末を新しく登録します。")) return;

      button.disabled = true;
      const original = button.textContent;
      button.textContent = "削除中…";
      try {
        const db = window.firebase.firestore();
        const ref = db.collection("users").doc(user.uid).collection("devices");
        const snap = await ref.get();
        if (!snap.empty) {
          const batch = db.batch();
          snap.docs.forEach(doc => batch.delete(doc.ref));
          await batch.commit();
        }
        toast("端末情報を削除しました");
        setTimeout(() => location.reload(), 700);
      } catch (e) {
        console.error("device reset failed", e);
        toast("端末情報を削除できませんでした");
        button.disabled = false;
        button.textContent = original;
      }
    });
  }

  window.addEventListener("DOMContentLoaded", () => {
    setupInstall();
    setupUrlModes();
    setupDeviceReset();
  });
})();
