(() => {
  "use strict";

  const $ = id => document.getElementById(id);

  function setupUrlModes() {
    const direct = $("urlModeDirect");
    const search = $("urlModeSearch");
    const directFields = $("urlDirectFields");
    const searchFields = $("urlSearchFields");
    const searchInput = $("urlSearchInput");
    const searchButton = $("urlSearchButton");
    const selectedUrl = $("urlSelectedResult");
    const editorUrl = $("editorUrl");
    if (!direct || !search || !directFields || !searchFields || !searchInput || !searchButton || !selectedUrl || !editorUrl) return;

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

    searchButton.addEventListener("click", () => {
      const q = searchInput.value.trim();
      if (!q) {
        searchInput.focus();
        return;
      }
      const url = `https://www.google.com/search?igu=1&q=${encodeURIComponent(q)}`;
      window.open(url, "cm-google-browser", "popup,width=1100,height=800,resizable=yes,scrollbars=yes");
    });

    selectedUrl.addEventListener("input", () => {
      const value = selectedUrl.value.trim();
      if (/^https?:\/\//i.test(value)) editorUrl.value = value;
    });

    searchInput.addEventListener("keydown", e => {
      if (e.key === "Enter") {
        e.preventDefault();
        searchButton.click();
      }
    });

    setMode("direct");
  }

  function setupDeviceReset() {
    const button = $("resetDevicesButton");
    if (!button) return;
    button.addEventListener("click", async () => {
      const user = window.firebase?.auth?.().currentUser;
      if (!user) {
        alert("ログインしてください。");
        return;
      }
      if (!confirm("登録されている端末をすべてリセットしますか？\n次回ログイン時に、この端末だけを新しく登録します。")) return;

      button.disabled = true;
      const original = button.textContent;
      button.textContent = "リセット中…";
      try {
        const db = firebase.firestore();
        const ref = db.collection("users").doc(user.uid).collection("devices");
        const snap = await ref.get();
        const batch = db.batch();
        snap.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        alert("端末登録をリセットしました。ページを再読み込みします。");
        location.reload();
      } catch (e) {
        console.error(e);
        alert("端末登録のリセットに失敗しました。FirestoreのSecurity Rulesを確認してください。");
        button.disabled = false;
        button.textContent = original;
      }
    });
  }

  window.addEventListener("DOMContentLoaded", () => {
    setupUrlModes();
    setupDeviceReset();
  });
})();
