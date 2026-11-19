/* Buildiful® optional GA4 module. No GA script is loaded without consent.
 * Shared storage key matches other Buildiful browser tools on this origin.
 */
(() => {
  'use strict';
  const script=document.currentScript;
  const measurementId=(script?.dataset.measurementId||'').trim();
  const toolName=script?.dataset.toolName||document.title||'Buildiful® tool';
  const privacyUrl=script?.dataset.privacyUrl||'./privacy.html';
  const storageKey='buildiful_analytics_consent_v1';
  let loaded=false, banner=null;
  window.BoxophoneAnalyticsAllowed=false;
  if(!/^G-[A-Za-z0-9]+$/.test(measurementId))return;
  function getChoice(){try{const x=JSON.parse(localStorage.getItem(storageKey)||'null');return ['allow','decline'].includes(x?.choice)?x.choice:null;}catch{return null;}}
  function store(choice){try{localStorage.setItem(storageKey,JSON.stringify({choice,recordedAt:new Date().toISOString()}));}catch{}}
  function enable(){
    if(location.protocol==='file:')return; // Never transmit local filesystem paths.
    if(loaded)return;loaded=true;window.BoxophoneAnalyticsAllowed=true;
    window.dataLayer=window.dataLayer||[];
    window.gtag=window.gtag||function(){window.dataLayer.push(arguments);};
    window.gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
    window.gtag('consent','update',{analytics_storage:'granted'});
    window.gtag('js',new Date());
    window.gtag('config',measurementId,{
      allow_google_signals:false,allow_ad_personalization_signals:false,
      page_location:location.origin+location.pathname,page_title:toolName
    });
    const el=document.createElement('script');el.async=true;
    el.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(measurementId);
    document.head.appendChild(el);
  }
  function clearCookies(){
    for(const part of document.cookie.split(';')){
      const name=part.trim().split('=')[0];
      if(/^(_ga(?:_.*)?|_gid|_gat(?:_.*)?)$/.test(name))document.cookie=`${name}=; Max-Age=0; path=/; SameSite=Lax`;
    }
  }
  function choose(choice){
    store(choice);banner?.remove();banner=null;
    if(choice==='allow')enable();
    else if(loaded){window.BoxophoneAnalyticsAllowed=false;window.gtag?.('consent','update',{analytics_storage:'denied'});clearCookies();location.reload();}
  }
  function showBanner(){
    if(banner||!document.body)return;
    banner=document.createElement('section');banner.setAttribute('role','region');banner.setAttribute('aria-label','Optional analytics');
    banner.style.cssText='position:fixed;bottom:16px;left:16px;right:16px;max-width:450px;z-index:2147483647;box-sizing:border-box;padding:16px;border:1px solid #d9dce5;border-radius:12px;background:#fff;color:#232733;box-shadow:0 7px 28px #0003;font:14px/1.5 system-ui,-apple-system,sans-serif';
    const title=document.createElement('strong');title.textContent='Optional analytics';
    const description=document.createElement('p');description.style.margin='8px 0 12px';
    description.textContent='May we use Google Analytics to understand visits to our free tools? You can decline; Boxophone works either way. We do not intentionally send the notes you play, recordings, or MIDI device names to Analytics.';
    const actions=document.createElement('div');actions.style.cssText='display:flex;gap:8px;flex-wrap:wrap';
    function btn(label,choice,primary){const b=document.createElement('button');b.type='button';b.textContent=label;
      b.style.cssText='padding:8px 12px;border-radius:8px;cursor:pointer;font:inherit;border:1px solid #737e93;'+(primary?'background:#344d9e;color:#fff':'background:#fff;color:#232733');
      b.addEventListener('click',()=>choose(choice));return b;}
    actions.append(btn('Decline analytics','decline',false),btn('Allow analytics','allow',true));
    const link=document.createElement('a');link.href=privacyUrl;link.textContent='Privacy notice';link.style.cssText='display:inline-block;margin-top:10px;color:#344d9e';
    banner.append(title,description,actions,link);document.body.appendChild(banner);
  }
  function init(){
    document.addEventListener('click',e=>{if(e.target.closest('[data-buildiful-analytics-settings]')){e.preventDefault();showBanner();}});
    const choice=getChoice();if(choice==='allow')enable();else if(choice!=='decline')showBanner();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
