(() => {
  "use strict";

  // localStorage を消されても同じブラウザ環境をできるだけ同じ端末として扱うためのID。
  // OSの固有IDなどは取得せず、ブラウザから取得できる環境情報だけを使います。
  const fingerprint = [
    navigator.userAgent,
    navigator.platform || "",
    navigator.language || "",
    screen.width,
    screen.height,
    window.devicePixelRatio || 1,
    screen.colorDepth || 0,
    Intl.DateTimeFormat().resolvedOptions().timeZone || ""
  ].join("|");

  let hash = 2166136261;
  for (let i = 0; i < fingerprint.length; i++) {
    hash ^= fingerprint.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const id = `device-${(hash >>> 0).toString(16).padStart(8, "0")}`;

  localStorage.setItem("cm_device_id", id);
  window.__cmDeviceFingerprint = fingerprint;
  window.__cmDeviceId = id;

  // 旧バージョンでランダムUUIDとして作られた重複端末を、
  // 同一環境のものに限ってログイン時に整理します。
  const cleanup = async user => {
    try {
      if (!window.firebase || !user) return;
      const db = firebase.firestore();
      const ref = db.collection("users").doc(user.uid).collection("devices");
      const snap = await ref.get();
      const currentUa = navigator.userAgent;
      const currentName = /iphone/i.test(currentUa) ? "iPhone"
        : /ipad/i.test(currentUa) ? "iPad"
        : /android/i.test(currentUa) ? ((screen.width < 600 || screen.height < 600) ? "Android スマートフォン" : "Android タブレット")
        : /windows/i.test(currentUa) ? "Windows PC"
        : /macintosh/i.test(currentUa) ? "Mac"
        : /linux/i.test(currentUa) ? "Linux PC"
        : "ブラウザ端末";
      const currentType = /ipad|tablet|android(?!.*mobile)/i.test(currentUa) || Math.min(screen.width, screen.height) >= 600 ? "tablet"
        : /mobile|iphone|ipod|android/i.test(currentUa) || Math.min(screen.width, screen.height) < 600 ? "phone"
        : "pc";

      const candidates = snap.docs.filter(d => {
        const x = d.data() || {};
        return d.id !== id && x.userAgent === currentUa && x.name === currentName && x.type === currentType;
      });

      if (!candidates.length) return;

      // 同一環境の旧レコードだけを整理し、最新利用の1件を残します。
      const ranked = [...candidates].sort((a, b) => {
        const av = a.data().lastSeen?.toMillis?.() || 0;
        const bv = b.data().lastSeen?.toMillis?.() || 0;
        return bv - av;
      });
      const batch = db.batch();
      ranked.slice(0).forEach(d => batch.delete(d.ref));
      await batch.commit();
    } catch (e) {
      console.warn("legacy device cleanup failed", e);
    }
  };

  const auth = window.__cmFirebaseAuth;
  if (auth) auth.onAuthStateChanged(user => { if (user) cleanup(user); });
})();
