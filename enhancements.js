(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  let deferredInstallPrompt = null;
  function toast(message){const el=$("toast");if(!el)return;el.textContent=message;el.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove("show"),2600)}
  function setupInstall(){
    const button=$("installApp");if(!button)return;
    const standalone=window.matchMedia("(display-mode: standalone)").matches||window.navigator.standalone===true;
    if(standalone){button.classList.add("hidden");return}
    button.classList.remove("hidden");
    window.addEventListener("beforeinstallprompt",event=>{event.preventDefault();deferredInstallPrompt=event;button.classList.remove("hidden")});
    button.addEventListener("click",async()=>{
      if(deferredInstallPrompt){deferredInstallPrompt.prompt();const choice=await deferredInstallPrompt.userChoice;deferredInstallPrompt=null;if(choice.outcome==="accepted")toast("ホーム画面に追加しました");else toast("インストールはキャンセルされました");return}
      toast("ブラウザのメニューから「ホーム画面に追加」または「アプリをインストール」を選択してください。");
    });
    window.addEventListener("appinstalled",()=>{button.classList.add("hidden");deferredInstallPrompt=null;toast("インストールしました")});
  }
  function setupDeviceReset(){
    const button=$("resetDevicesButton");
    if(!button||button.dataset.bound==="1")return;
    button.dataset.bound="1";
    button.addEventListener("click",async event=>{
      event.preventDefault();
      event.stopPropagation();
      const auth=window.__cmFirebaseAuth||window.firebase?.auth?.();
      const user=auth?.currentUser;
      if(!user){toast("ログイン状態を確認できません。再読み込みしてください。");return}
      if(!window.confirm("登録されている端末をすべて削除しますか？\n削除後、この端末を新しく登録します。"))return;
      const original=button.textContent;
      button.disabled=true;button.textContent="削除中…";
      try{
        const db=window.firebase.firestore();
        const ref=db.collection("users").doc(user.uid).collection("devices");
        const snap=await ref.get();
        const docs=snap.docs;
        for(let i=0;i<docs.length;i+=450){
          const batch=db.batch();
          docs.slice(i,i+450).forEach(doc=>batch.delete(doc.ref));
          await batch.commit();
        }
        localStorage.removeItem("cm_device_id");
        toast("登録端末をすべて削除しました。現在の端末を再登録します。");
        setTimeout(()=>location.reload(),700);
      }catch(e){
        console.error("device reset failed",e);
        toast(`端末情報を削除できませんでした。${e?.code?` (${e.code})`:""}`);
        button.disabled=false;button.textContent=original;
      }
    });
  }
  window.addEventListener("DOMContentLoaded",()=>{setupInstall();setupDeviceReset()});
})();
