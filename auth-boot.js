const tabs=document.querySelectorAll('.tab');
const submit=document.getElementById('authSubmit');
const password=document.getElementById('password');
const error=document.getElementById('authError');

tabs.forEach(tab=>tab.addEventListener('click',()=>{
  tabs.forEach(x=>x.classList.remove('active'));
  tab.classList.add('active');
  const signup=tab.dataset.mode==='signup';
  if(submit)submit.textContent=signup?'アカウントを作成':'ログイン';
  if(password)password.autocomplete=signup?'new-password':'current-password';
  if(error)error.textContent='';
}));
