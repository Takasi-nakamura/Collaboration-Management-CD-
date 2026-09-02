(() => {
  "use strict";
  const firebaseConfig = {
    apiKey: "AIzaSyBJSyPxVJDWezDvLhYWJ80TWFv441IeA8A",
    authDomain: "toolbox-9ae26.firebaseapp.com",
    projectId: "toolbox-9ae26",
    storageBucket: "toolbox-9ae26.firebasestorage.app",
    messagingSenderId: "102342085744",
    appId: "1:102342085744:web:f92a560d27432e197878b5"
  };
  const tabs=document.querySelectorAll(".tab"),form=document.getElementById("authForm"),submit=document.getElementById("authSubmit"),email=document.getElementById("email"),password=document.getElementById("password"),error=document.getElementById("authError");
  let mode="login";
  function message(e){const map={"auth/invalid-email":"メールアドレスが正しくありません。","auth/user-not-found":"アカウントが見つかりません。","auth/wrong-password":"パスワードが違います。","auth/invalid-credential":"メールアドレスまたはパスワードが違います。","auth/email-already-in-use":"このメールアドレスはすでに登録されています。","auth/weak-password":"パスワードは6文字以上にしてください。","auth/operation-not-allowed":"Firebaseでメール/パスワード認証が有効になっていません。","auth/too-many-requests":"試行回数が多すぎます。少し待ってください。","auth/api-key-not-valid":"Firebase APIキーがFirebase側で拒否されています。Firebase ConsoleのWeb APIキーを確認してください。","auth/network-request-failed":"Firebaseへの接続に失敗しました。","auth/internal-error":"Firebase内部エラーが発生しました。"};return map[e?.code]||`認証に失敗しました。(${e?.code||"unknown"}) ${e?.message||""}`}
  function setMode(next){mode=next==="signup"?"signup":"login";tabs.forEach(tab=>tab.classList.toggle("active",tab.dataset.mode===mode));if(submit){submit.disabled=false;submit.textContent=mode==="login"?"ログイン":"アカウントを作成"}if(password)password.autocomplete=mode==="login"?"current-password":"new-password";if(error)error.textContent=""}
  tabs.forEach(tab=>tab.addEventListener("click",()=>setMode(tab.dataset.mode)));setMode("login");
  try{
    if(!window.firebase)throw new Error("Firebase SDKが読み込まれていません。");
    const app=window.firebase.apps.length?window.firebase.app():window.firebase.initializeApp(firebaseConfig);
    const auth=app.auth();window.__cmFirebaseAuth=auth;
    const originalInitializeApp=window.firebase.initializeApp;
    window.firebase.initializeApp=function(config,name){if(!name&&window.firebase.apps.length)return window.firebase.app();return originalInitializeApp.call(window.firebase,config,name)};
    if(form)form.addEventListener("submit",async event=>{
      event.preventDefault();event.stopImmediatePropagation();
      const mail=email?.value.trim()||"",pass=password?.value||"";
      if(!mail||!pass){error.textContent="メールアドレスとパスワードを入力してください。";return}
      submit.disabled=true;error.textContent="";
      try{if(mode==="signup")await auth.createUserWithEmailAndPassword(mail,pass);else await auth.signInWithEmailAndPassword(mail,pass)}catch(e){console.error("Authentication failed",e);error.textContent=message(e);submit.disabled=false}
    },true);
  }catch(e){console.error("Firebase bootstrap failed",e);if(error)error.textContent=`Firebaseの読み込みに失敗しました。${e.message||""}`;if(submit)submit.disabled=false}
})();
