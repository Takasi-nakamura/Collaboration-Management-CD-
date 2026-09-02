/* 開発中はここにFirebaseのWebアプリ設定を直接入れてください。公開前に.env方式へ移行できます。 */
const firebaseConfig = {
  apiKey: "AIzaSyBJSyPxVJDWezDvLhYWJ80TWFv441IeA8A",
  authDomain: "toolbox-9ae26.firebaseapp.com",
  projectId: "toolbox-9ae26",
  storageBucket: "toolbox-9ae26.firebasestorage.app",
  messagingSenderId: "102342085744",
  appId: "1:102342085744:web:f92a560d27432e197878b5"
};


window.CM_FIREBASE_CONFIGURED = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
