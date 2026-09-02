/* 開発中はここにFirebaseのWebアプリ設定を直接入れてください。公開前に.env方式へ移行できます。 */
const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

window.CM_FIREBASE_CONFIGURED = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
