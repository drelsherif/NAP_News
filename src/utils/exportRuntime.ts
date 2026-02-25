/**
 * exportRuntime.ts
 *
 * The shared browser runtime script embedded in all exported HTML files.
 * This handles:
 *  - RSS ticker + sidebar live refresh
 *  - Copy-to-clipboard buttons
 *  - Template expand/collapse toggles
 *  - Local storage persistence for RSS settings
 *  - Hourly live refresh interval
 *
 * Single source of truth — imported by export.ts and exportViewer.ts so
 * both always produce identical interactive behaviour without regex extraction.
 */

export const RUNTIME_JS: string = `(function(){
  'use strict';
  const PROXY = 'https://api.allorigins.win/get?url=';

  // Preset RSS feeds (starter set). Users can add custom URLs.
  const PRESETS = [
    { label: 'Frontiers in Neuroscience — RSS', url: 'https://www.frontiersin.org/journals/neuroscience/rss' },
    { label: 'Frontiers in Neurology — RSS', url: 'https://www.frontiersin.org/journals/neurology/rss' },
    { label: 'MIT News — Artificial Intelligence', url: 'https://news.mit.edu/rss/topic/artificial-intelligence2' },
    { label: 'ScienceDaily — Artificial Intelligence', url: 'https://www.sciencedaily.com/rss/computers_math/artificial_intelligence.xml' },
    { label: 'MarkTechPost — AI News', url: 'https://www.marktechpost.com/feed/' },
    { label: 'The Lancet Neurology — Current', url: 'https://www.thelancet.com/rssfeed/laneur_current.xml' },
    { label: 'JAMA Neurology — RSS', url: 'https://jamanetwork.com/rss/site_16/0.xml' },
    { label: 'npj Digital Medicine — RSS', url: 'https://www.nature.com/npjdigitalmed.rss' },
    { label: 'PubMed RSS — Neurology AI Search', url: 'https://pubmed.ncbi.nlm.nih.gov/rss/search/1x9bY_ZPGMIgWOrGWvQbkjt2X1J5zCH66gaj5UHwPTuOP_TklI/?limit=15&utm_campaign=pubmed-2&fc=20260222062849' }
  ];

  function esc(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  function parseXml(xml){
    try {
      const doc = new DOMParser().parseFromString(xml,'text/xml');
      if(doc.querySelector('parsererror')) return [];
      const items = Array.from(doc.querySelectorAll('item'));
      if(items.length) return items.map(el=>({
        title:(el.querySelector('title')?.textContent||'').trim(),
        url:(el.querySelector('link')?.textContent||'').trim(),
        date:(el.querySelector('pubDate')?.textContent||'').trim(),
        source:''
      })).filter(x=>x.title);
      return Array.from(doc.querySelectorAll('entry')).map(el=>({
        title:(el.querySelector('title')?.textContent||'').trim(),
        url:(el.querySelector('link')?.getAttribute('href')||el.querySelector('link')?.textContent||'').trim(),
        date:(el.querySelector('updated')?.textContent||'').trim(),
        source:''
      })).filter(x=>x.title);
    } catch(e){ return []; }
  }

  async function fetchFeed(url){
    try {
      const res = await fetch(PROXY+encodeURIComponent(url),{cache:'no-store'});
      if(!res.ok) return [];
      const data = await res.json();
      const xml = (data && typeof data.contents === 'string') ? data.contents : '';
      return parseXml(xml);
    } catch(e){ return []; }
  }

  function dedupe(arr,max){
    const seen=new Set();
    return arr.filter(x=>{const k=x.url||x.title;if(!k||seen.has(k))return false;seen.add(k);return true;}).slice(0,Math.max(1,max));
  }

  function getCssVar(v){ return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }

  function storageKey(kind,key){ return 'nap_rss_'+kind+'_'+(key||'default'); }
  function safeJsonParse(raw, fallback){ try{ const v=JSON.parse(raw); return v ?? fallback; }catch(e){ return fallback; } }

  function getSelectedFeeds(kind, el){
    const key = el.getAttribute('data-key') || 'default';
    const k = storageKey(kind, key);
    const saved = safeJsonParse(localStorage.getItem(k) || 'null', null);
    if(Array.isArray(saved) && saved.length) return saved;
    const raw = (kind==='sidebar') ? (el.getAttribute('data-feeds')||'[]') : (el.getAttribute('data-rss')||'[]');
    const arr = safeJsonParse(raw, []);
    return Array.isArray(arr) ? arr : [];
  }

  function setSelectedFeeds(kind, el, feeds){
    const key = el.getAttribute('data-key') || 'default';
    const k = storageKey(kind, key);
    localStorage.setItem(k, JSON.stringify(feeds));
    if(kind==='sidebar') el.setAttribute('data-feeds', JSON.stringify(feeds));
    else el.setAttribute('data-rss', JSON.stringify(feeds));
  }

  function getLiveEnabled(kind, el){
    const key = el.getAttribute('data-key') || 'default';
    const k = storageKey(kind, key) + '_live';
    const v = localStorage.getItem(k);
    if(v==='1') return true;
    return (el.getAttribute('data-live')||'0') === '1';
  }

  function setLiveEnabled(kind, el, on){
    el.setAttribute('data-live', on ? '1' : '0');
    const key = el.getAttribute('data-key') || 'default';
    const k = storageKey(kind, key) + '_live';
    localStorage.setItem(k, on ? '1' : '0');
  }

  function getMaxItems(kind, el){
    const key = el.getAttribute('data-key') || 'default';
    const k = storageKey(kind, key) + '_max';
    const v = localStorage.getItem(k);
    if(v && /^\\d+$/.test(v)) return parseInt(v,10);
    if(kind==='ticker') return parseInt(el.getAttribute('data-rss-max')||'20',10);
    return parseInt(el.getAttribute('data-max')||'10',10);
  }

  function getMaxFeeds(kind, el){
    const key = el.getAttribute('data-key') || 'default';
    const k = storageKey(kind, key) + '_maxfeeds';
    const v = localStorage.getItem(k);
    if(v && /^\\d+$/.test(v)) return parseInt(v,10);
    const attr = el.getAttribute('data-max-feeds');
    if(attr && /^\\d+$/.test(attr)) return parseInt(attr,10);
    return 10;
  }

  function setMaxFeeds(kind, el, n){
    const key = el.getAttribute('data-key') || 'default';
    const k = storageKey(kind, key) + '_maxfeeds';
    const val = String(Math.min(20, Math.max(5, parseInt(n,10)||10)));
    localStorage.setItem(k, val);
    el.setAttribute('data-max-feeds', val);
  }

  function setMaxItems(kind, el, n){
    const key = el.getAttribute('data-key') || 'default';
    const k = storageKey(kind, key) + '_max';
    const val = String(Math.min(50, Math.max(1, parseInt(n,10)||10)));
    localStorage.setItem(k, val);
    if(kind==='ticker') el.setAttribute('data-rss-max', val);
    else el.setAttribute('data-max', val);
  }

  function applySidebarMax(el){
    try{
      const container = el.querySelector('.nap-rss-items');
      if(!container) return;
      const max = getMaxItems('sidebar', el);
      const kids = Array.from(container.children);
      kids.forEach((node, idx)=>{ node.style.display = (idx < max) ? '' : 'none'; });
    } catch(e){}
  }

  const CUSTOM_PRESETS_KEY = 'nap_rss_custom_presets_v1';
  function loadCustomPresets(){
    const raw = localStorage.getItem(CUSTOM_PRESETS_KEY);
    const arr = safeJsonParse(raw || '[]', []);
    return Array.isArray(arr) ? arr.filter(x=>x && x.url) : [];
  }
  function saveCustomPresets(arr){
    try{ localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(arr||[])); }catch(e){}
  }
  function deriveLabel(url){
    try{ const u=new URL(url); return u.hostname.replace(/^www\\./,''); }catch(e){ return 'Custom RSS'; }
  }

  function renderPresetList(el, kind){
    const list = el.querySelector('.nap-rss-preset-list');
    if(!list) return;
    const selected = new Set(getSelectedFeeds(kind, el));
    const text = kind==='ticker' ? 'rgba(255,255,255,0.92)' : (getCssVar('--c-text')||'#1A2B4A');
    const muted = kind==='ticker' ? 'rgba(255,255,255,0.75)' : (getCssVar('--c-muted')||'#5A789A');
    const fb=getCssVar('--f-body')||'system-ui';
    const customs = loadCustomPresets();
    const allPresets = PRESETS.concat(customs);
    list.innerHTML = allPresets.map(p => {
      const checked = selected.has(p.url) ? 'checked' : '';
      const isCustom = !PRESETS.some(x=>x.url===p.url);
      const removeBtn = isCustom ? '<button type="button" data-remove="'+esc(p.url)+'" style="margin-left:auto;border:none;background:transparent;color:'+muted+';cursor:pointer;font-size:14px;line-height:1">×</button>' : '';
      return '<label style="display:flex;gap:8px;align-items:flex-start;font-family:'+fb+';font-size:12px;color:'+text+';line-height:1.3">'
        + '<input type="checkbox" data-url="'+esc(p.url)+'" '+checked+' style="transform:translateY(2px)" />'
        + '<span style="flex:1"><span style="font-weight:600">'+esc(p.label||deriveLabel(p.url))+'</span><br/><span style="color:'+muted+';font-size:11px">'+esc(p.url)+'</span></span>'
        + removeBtn
        + '</label>';
    }).join('');

    list.querySelectorAll('button[data-remove]').forEach(btn => {
      btn.addEventListener('click', (e)=>{
        e.preventDefault(); e.stopPropagation();
        const url = btn.getAttribute('data-remove');
        const customs = loadCustomPresets().filter(x=>x.url!==url);
        saveCustomPresets(customs);
        const next = new Set(getSelectedFeeds(kind, el));
        next.delete(url);
        setSelectedFeeds(kind, el, Array.from(next));
        renderPresetList(el, kind);
        const st = el.querySelector('.nap-rss-status');
        if(st) st.textContent = 'Removed custom feed.';
      });
    });

    list.querySelectorAll('input[type=checkbox]').forEach(cb => {
      cb.addEventListener('change', () => {
        const url = cb.getAttribute('data-url');
        const next = new Set(getSelectedFeeds(kind, el));
        if(cb.checked) next.add(url); else next.delete(url);
        setSelectedFeeds(kind, el, Array.from(next));
        const st = el.querySelector('.nap-rss-status');
        if(st) st.textContent = 'Selected '+next.size+' feed(s).';
      });
    });
  }

  function wireRssConfig(el, kind){
    const details = el.querySelector('.nap-rss-config');
    if(!details) return;
    const live = details.querySelector('.nap-rss-live');
    if(live){
      live.checked = getLiveEnabled(kind, el);
      live.addEventListener('change', () => {
        setLiveEnabled(kind, el, live.checked);
        const st = el.querySelector('.nap-rss-status');
        if(st) st.textContent = live.checked ? 'Live enabled. Refreshing…' : 'Live disabled (snapshot).';
        if(live.checked){
          if(kind==='sidebar') hydrateRssSidebar(el);
          else hydrateTicker(el);
        }
      });
    }
    renderPresetList(el, kind);
    const maxFeedsSel = details.querySelector('.nap-rss-maxfeeds');
    if(maxFeedsSel){
      maxFeedsSel.value = String(getMaxFeeds(kind, el));
      maxFeedsSel.addEventListener('change', () => {
        setMaxFeeds(kind, el, maxFeedsSel.value);
        const st = el.querySelector('.nap-rss-status');
        if(st) st.textContent = 'Max feeds: ' + getMaxFeeds(kind, el) + '.';
        if(getLiveEnabled(kind, el)){
          if(kind==='sidebar') hydrateRssSidebar(el);
          else hydrateTicker(el);
        }
      });
    }
    const maxSel = details.querySelector('.nap-rss-max');
    if(maxSel){
      maxSel.value = String(getMaxItems(kind, el));
      maxSel.addEventListener('change', () => {
        setMaxItems(kind, el, maxSel.value);
        const st = el.querySelector('.nap-rss-status');
        if(st) st.textContent = 'Items per feed: ' + getMaxItems(kind, el) + '.';
        if(kind==='sidebar'){
          if(getLiveEnabled('sidebar', el)) hydrateRssSidebar(el);
          else applySidebarMax(el);
        } else {
          if(getLiveEnabled('ticker', el)) hydrateTicker(el);
        }
      });
    }
    const input = details.querySelector('.nap-rss-add');
    const btn = details.querySelector('.nap-rss-add-btn');
    function addUrl(){
      const v = (input && input.value || '').trim();
      if(!v) return;
      try{ new URL(v); } catch(e){ const st=el.querySelector('.nap-rss-status'); if(st) st.textContent='Invalid URL.'; return; }
      const next = new Set(getSelectedFeeds(kind, el));
      next.add(v);
      setSelectedFeeds(kind, el, Array.from(next));
      if(!PRESETS.some(p=>p.url===v)){
        const customs = loadCustomPresets();
        if(!customs.some(p=>p.url===v)){
          customs.unshift({ label: deriveLabel(v), url: v });
          saveCustomPresets(customs.slice(0, 100));
        }
      }
      if(input) input.value='';
      renderPresetList(el, kind);
      const st = el.querySelector('.nap-rss-status');
      if(st) st.textContent='Added feed. Selected '+next.size+' feed(s).';
    }
    if(btn) btn.addEventListener('click', addUrl);
    if(input) input.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ e.preventDefault(); addUrl(); } });
    const st = el.querySelector('.nap-rss-status');
    if(st) st.textContent = 'Selected '+getSelectedFeeds(kind, el).length+' feed(s).';
  }

  /* ── Ticker ── */
  async function hydrateTicker(el){
    if(!el||el.getAttribute('data-source')!=='rss') return;
    if(!getLiveEnabled('ticker', el)) return;
    const urlsAll = getSelectedFeeds('ticker', el);
    const maxFeeds = getMaxFeeds('ticker', el);
    const urls = urlsAll.slice(0, maxFeeds);
    if(!urls.length) return;
    const max=parseInt(el.getAttribute('data-rss-max')||'20',10);
    const all=[];
    for(const u of urls){const items=await fetchFeed(u);all.push(...items);}
    const items=dedupe(all,max);
    if(!items.length) return;
    const textColor=el.style.color||'#fff';
    const accent=getCssVar('--c-accent')||'#009CDE';
    const fm=getCssVar('--f-mono')||'ui-monospace';
    const html=items.map(it=>
      '<a href="'+esc(it.url||'#')+'" target="_blank" rel="noopener noreferrer" '+
      'style="font-family:'+fm+';font-size:12px;color:'+textColor+';padding:0 32px;letter-spacing:0.04em;display:inline-flex;align-items:center;gap:10px;text-decoration:none">'+
      '<span style="width:5px;height:5px;border-radius:50%;background:'+accent+';display:inline-block;flex-shrink:0"></span>'+
      esc(it.title)+'<span style="font-size:10px;opacity:0.6">↗</span></a>'
    ).join('');
    const track=el.querySelector('.nap-ticker-track');
    if(track) track.innerHTML=html+html;
  }

  /* ── RSS Sidebar ── */
  async function hydrateRssSidebar(el){
    if(!el) return;
    if(!getLiveEnabled('sidebar', el)) return;
    const feedsAll = getSelectedFeeds('sidebar', el);
    const maxFeeds = getMaxFeeds('sidebar', el);
    const feeds = feedsAll.slice(0, maxFeeds);
    if(!feeds.length) return;
    const max=getMaxItems('sidebar', el);
    const all=[];
    for(const u of feeds){
      const items=await fetchFeed(u);
      try{const host=new URL(u).hostname.replace(/^www\\./,'');items.forEach(it=>it.source=host);}catch(e){}
      all.push(...items);
    }
    const items=dedupe(all,max);
    if(!items.length) return;
    const text=getCssVar('--c-text')||'#1A2B4A';
    const accent=getCssVar('--c-accent')||'#009CDE';
    const muted=getCssVar('--c-muted')||'#5A789A';
    const border=getCssVar('--c-border')||'#C8D9EE';
    const fb=getCssVar('--f-body')||'system-ui';
    const fm=getCssVar('--f-mono')||'ui-monospace';
    function fmtDate(d){try{return new Date(d).toLocaleDateString();}catch(e){return '';}}
    const container=el.querySelector('.nap-rss-items');
    if(!container) return;
    container.innerHTML=items.map((it,i)=>{
      const n=String(i+1).padStart(2,'0');
      const dt=it.date?fmtDate(it.date):'';
      return '<div style="padding:11px 18px;border-bottom:1px solid '+border+';display:flex;gap:10px;align-items:flex-start">'+
        '<span style="font-family:'+fm+';font-size:12px;color:'+accent+';flex-shrink:0;min-width:20px;margin-top:1px">'+n+'</span>'+
        '<div style="flex:1">'+
          '<div style="font-family:'+fb+';font-size:13px;font-weight:600;color:'+text+';line-height:1.3;margin-bottom:3px">'+
            (it.url?'<a href="'+esc(it.url)+'" target="_blank" rel="noopener" style="color:'+text+';text-decoration:none">'+esc(it.title)+'</a>':esc(it.title))+
          '</div>'+
          '<div style="display:flex;gap:8px;align-items:center">'+
            (it.source?'<span style="font-family:'+fm+';font-size:9px;color:'+muted+';text-transform:uppercase;letter-spacing:0.08em">'+esc(it.source)+'</span>':'')+
            (dt?'<span style="font-family:'+fm+';font-size:9px;color:'+muted+'">'+dt+'</span>':'')+
          '</div>'+
        '</div>'+
        (it.url?'<a href="'+esc(it.url)+'" target="_blank" rel="noopener" style="flex-shrink:0;font-family:'+fb+';font-size:11px;color:'+accent+';font-weight:600;text-decoration:none;padding-top:1px">↗</a>':'')+
      '</div>';
    }).join('');
    const ts=el.querySelector('.nap-rss-timestamp');
    applySidebarMax(el);
    if(ts) ts.textContent='Updated '+new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
  }

  /* ── Copy buttons ── */
  function initCopyButtons(){
    document.querySelectorAll('.nap-copy-btn').forEach(function(btn){
      btn.addEventListener('click',function(){
        const text=this.getAttribute('data-copy')||'';
        const orig=this.innerHTML;
        const accent=getCssVar('--c-accent')||'#009CDE';
        const done=()=>{
          this.innerHTML='✓ Copied!';
          this.style.background=accent;
          this.style.color='#fff';
          this.style.border='none';
          setTimeout(()=>{this.innerHTML=orig;this.style.background='';this.style.color='';this.style.border='';},2000);
        };
        if(navigator.clipboard){
          navigator.clipboard.writeText(text).then(done).catch(()=>done());
        } else {
          const ta=document.createElement('textarea');
          ta.value=text;ta.style.position='fixed';ta.style.opacity='0';
          document.body.appendChild(ta);ta.select();document.execCommand('copy');
          document.body.removeChild(ta);done();
        }
      });
    });
  }

  /* ── Template expand ── */
  function initExpandButtons(){
    document.querySelectorAll('.nap-expand-btn').forEach(function(btn){
      btn.addEventListener('click',function(){
        const target=document.getElementById(this.getAttribute('data-target'));
        if(!target) return;
        const isOpen=target.classList.toggle('open');
        this.textContent=isOpen?'Collapse':'Preview';
      });
    });
  }

  // Wire RSS config UIs (snapshot-first; live optional)
  document.querySelectorAll('.nap-ticker[data-source="rss"]').forEach(el=>wireRssConfig(el,'ticker'));
  document.querySelectorAll('.nap-rss-sidebar').forEach(el=>wireRssConfig(el,'sidebar'));
  document.querySelectorAll('.nap-rss-sidebar').forEach(el=>applySidebarMax(el));

  // Only hydrate if live is enabled (persisted)
  document.querySelectorAll('.nap-ticker[data-source="rss"]').forEach(el=>{ if(getLiveEnabled('ticker', el)) hydrateTicker(el); });
  document.querySelectorAll('.nap-rss-sidebar').forEach(el=>{ if(getLiveEnabled('sidebar', el)) hydrateRssSidebar(el); });
  initCopyButtons();
  initExpandButtons();

  /* ── Hourly live refresh ── */
  const REFRESH_MS = 60 * 60 * 1000;
  setInterval(function() {
    document.querySelectorAll('.nap-ticker[data-source="rss"]').forEach(el=>{ if(getLiveEnabled('ticker', el)) hydrateTicker(el); });
    document.querySelectorAll('.nap-rss-sidebar').forEach(el=>{ if(getLiveEnabled('sidebar', el)) hydrateRssSidebar(el); });
  }, REFRESH_MS);

  /* Show a subtle "Live" indicator on the RSS sidebar header */
  document.querySelectorAll('.nap-rss-sidebar').forEach(function(rssEl){
    const header = rssEl.querySelector('div');
    if (!header) return;
    const dot = document.createElement('span');
    dot.title = 'Updates every hour (when Live is enabled)';
    dot.style.cssText = 'width:6px;height:6px;border-radius:50%;background:#00A651;display:inline-block;margin-left:auto;animation:nap_pulse 2s ease-in-out infinite;opacity:0.85';
    header.appendChild(dot);
  });
})();`;
