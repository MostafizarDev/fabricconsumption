/* Shared behavior for the standalone INFORMATION pages. */
(function(){
  'use strict';
  var key='fc-theme';
  var saved=localStorage.getItem(key);
  var prefersDark=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.body.classList.toggle('dark-mode',saved?saved==='dark':prefersDark);
  var btn=document.getElementById('theme-toggle');
  if(!btn) return;
  function sync(){
    var dark=document.body.classList.contains('dark-mode');
    btn.setAttribute('aria-label',dark?'Switch to light mode':'Switch to dark mode');
    btn.setAttribute('title',dark?'Switch to light mode':'Switch to dark mode');
    btn.innerHTML='<i data-lucide="'+(dark?'sun':'moon')+'" aria-hidden="true"></i>';
    if(window.lucide) window.lucide.createIcons();
  }
  btn.addEventListener('click',function(){
    var next=!document.body.classList.contains('dark-mode');
    document.body.classList.toggle('dark-mode',next);
    localStorage.setItem(key,next?'dark':'light');
    sync();
  });
  sync();
})();
