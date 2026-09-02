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
      event.preventDefault();event.stopPropagation();
      const auth=window.__cmFirebaseAuth||window.firebase?.auth?.();const user=auth?.currentUser;
      if(!user){toast("ログイン状態を確認できません。再読み込みしてください。");return}
      if(!window.confirm("登録されている端末をすべて削除しますか？\n削除後、この端末を新しく登録します。"))return;
      const original=button.textContent;button.disabled=true;button.textContent="削除中…";
      try{const db=window.firebase.firestore(),ref=db.collection("users").doc(user.uid).collection("devices"),snap=await ref.get(),docs=snap.docs;for(let i=0;i<docs.length;i+=450){const batch=db.batch();docs.slice(i,i+450).forEach(doc=>batch.delete(doc.ref));await batch.commit()}localStorage.removeItem("cm_device_id");toast("登録端末をすべて削除しました。現在の端末を再登録します。");setTimeout(()=>location.reload(),700)}catch(e){console.error("device reset failed",e);toast(`端末情報を削除できませんでした。${e?.code?` (${e.code})`:""}`);button.disabled=false;button.textContent=original}
    });
  }
  function setupPreview(){
    if($("filePreviewModal"))return;
    const modal=document.createElement("div");modal.id="filePreviewModal";modal.className="file-preview-modal hidden";modal.innerHTML='<div class="file-preview-backdrop"></div><div class="file-preview-panel"><div class="file-preview-head"><div><strong id="filePreviewTitle">プレビュー</strong><small id="filePreviewMeta"></small></div><button id="filePreviewClose" class="icon-button" type="button" aria-label="閉じる">×</button></div><div id="filePreviewBody" class="file-preview-body"></div><div class="file-preview-actions"><a id="filePreviewOpen" class="secondary preview-link" href="#" target="_blank" rel="noopener">別タブで開く</a></div></div>';
    document.body.appendChild(modal);
    const close=()=>{modal.classList.add("hidden");const body=$("filePreviewBody");body.innerHTML=""};
    $("filePreviewClose").addEventListener("click",close);modal.querySelector(".file-preview-backdrop").addEventListener("click",close);document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!modal.classList.contains("hidden"))close()});
    document.addEventListener("click",e=>{
      const target=e.target.closest(".image-preview,.file-card");if(!target)return;
      const card=target.closest(".clipboard-card");const link=target.closest("a");const url=link?.href;if(!url)return;
      e.preventDefault();e.stopPropagation();
      const type=target.classList.contains("image-preview")?"image":"file",img=target.querySelector("img"),name=card?.querySelector(".file-card strong")?.textContent||img?.alt||"ファイル";
      $("filePreviewTitle").textContent=name;$("filePreviewMeta").textContent=type==="image"?"画像プレビュー":"ファイルプレビュー";$("filePreviewOpen").href=url;
      const body=$("filePreviewBody");
      if(type==="image")body.innerHTML=`<img class="preview-image" src="${url.replace(/"/g,"&quot;")}" alt="">`;
      else {
        const lower=name.toLowerCase();
        const previewable=/\.(pdf|txt|csv|html?|svg)$/i.test(lower);
        if(previewable)body.innerHTML=`<iframe class="preview-frame" src="${url.replace(/"/g,"&quot;")}" title="${name.replace(/"/g,"&quot;")}"></iframe>`;
        else body.innerHTML='<div class="preview-fallback"><div class="preview-fallback-icon">↗</div><strong>このファイルはブラウザ内プレビューに対応していません</strong><p>「別タブで開く」から端末の対応アプリで開けます。</p></div>';
      }
      modal.classList.remove("hidden");
    },true);
  }
  window.addEventListener("DOMContentLoaded",()=>{setupInstall();setupDeviceReset();setupPreview()});
})();
