'use strict';
const $ = id => document.getElementById(id);
let books = [], visible = [], shown = 0;
const PAGE_SIZE = 24;
const collator = new Intl.Collator('ja', {numeric:true, sensitivity:'base'});
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function safeUrl(url) {try {const u = new URL(url);return ['https:','http:'].includes(u.protocol) ? u.href : '';} catch{return '';}}
function makeCard(b) {
  const card=document.createElement('article');card.className='book';
  const links=[['BOOK☆WALKER',b.bookwalker,''],['Amazon',b.amazon,'amazon']].filter(x=>safeUrl(x[1])).map(([name,url,cls])=>`<a class="${cls}" href="${esc(safeUrl(url))}" target="_blank" rel="noopener noreferrer sponsored">${name} ↗</a>`).join('');
  const statusCls=b.status==='打ち切り'?'stop':'status';
  const date=b.date?`${b.date.slice(0,4)}年${Number(b.date.slice(5))}月`:'発売年月未設定';
  card.innerHTML=`<h3 class="book-title">${esc(b.title)}</h3><dl class="meta"><dt>著者</dt><dd>${esc(b.author)||'—'}</dd><dt>イラスト</dt><dd>${esc(b.illustrator)||'—'}</dd><dt>レーベル</dt><dd>${esc(b.label)||'—'}</dd><dt>ジャンル</dt><dd>${esc(b.genre)||'—'}</dd></dl><div class="tags"><span class="tag">${esc(date)}</span><span class="tag ${statusCls}">${esc(b.publication)||'未設定'}</span></div>${links?`<div class="links">${links}</div>`:''}`;
  return card;
}
function appendPage(){const fragment=document.createDocumentFragment();visible.slice(shown,shown+PAGE_SIZE).forEach(b=>fragment.appendChild(makeCard(b)));$('cards').appendChild(fragment);shown=Math.min(shown+PAGE_SIZE,visible.length);$('more').hidden=shown>=visible.length;}
function update(){const query=$('search').value.trim().normalize('NFKC').toLocaleLowerCase();const field=document.querySelector('input[name="field"]:checked').value;const date=$('date').value,status=$('status').value,sort=$('sort').value;
  visible=books.filter(b=>{if(date&&b.date!==date)return false;if(status&&b.status!==status)return false;if(!query)return true;const fields=field==='all'?['title','author','illustrator','label']:[field];return fields.some(k=>String(b[k]??'').normalize('NFKC').toLocaleLowerCase().includes(query));});
  visible.sort((a,b)=>sort==='date-desc'?b.date.localeCompare(a.date)||collator.compare(a.title,b.title):sort==='date-asc'?a.date.localeCompare(b.date)||collator.compare(a.title,b.title):collator.compare(a[sort]??'',b[sort]??''));
  $('count').textContent=visible.length.toLocaleString('ja-JP');$('hint').textContent=`全${books.length.toLocaleString('ja-JP')}作品から検索`; $('cards').replaceChildren();$('empty').hidden=visible.length!==0;shown=0;appendPage();}
// Apps Script のデプロイURL（/exec）を貼り付けます。
// 未設定なら同梱の books.json を読み込みます。
const GAS_URL = 'https://script.google.com/macros/s/AKfycbyXLRZeXgETMqQ5vJTqu_0GpvRH27opU3YqmDpJgwsLHQIwCY2ityMSlx_fWTYaLDQvmw/exec';
function loadJsonp(url) {
  return new Promise((resolve, reject) => {
    const callback = 'portalCallback_' + Date.now() + '_' + Math.floor(Math.random() * 1000000);
    const script = document.createElement('script');
    const timeout = setTimeout(() => finish(new Error('API応答がタイムアウトしました')), 15000);
    function finish(error, data) {
      clearTimeout(timeout);
      delete window[callback];
      script.remove();
      if (error) reject(error); else resolve(data);
    }
    window[callback] = data => finish(null, data);
    script.onerror = () => finish(new Error('APIを読み込めませんでした'));
    script.src = url + (url.includes('?') ? '&' : '?') + 'callback=' + encodeURIComponent(callback);
    document.head.appendChild(script);
  });
}
async function init(){
  try {
    if (GAS_URL) {
      if (!/^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/.test(GAS_URL)) throw Error('GAS_URL に /exec で終わるURLを設定してください');
      books = await loadJsonp(GAS_URL);
    } else {
      const res = await fetch('./books.json', {cache:'no-store'});
      if (!res.ok) throw Error('HTTP ' + res.status);
      books = await res.json();
    }
    if (!Array.isArray(books)) throw Error('APIのデータ形式が不正です');
    const dateSelect = $('date');
    dateSelect.replaceChildren(new Option('すべて', ''));
    const dates = [...new Set(books.map(b => b.date).filter(Boolean))].sort((a,b) => b.localeCompare(a));
    dates.forEach(d => dateSelect.add(new Option(`${d.slice(0,4)}年${Number(d.slice(5))}月`, d)));
    update();
  } catch(e) {
    $('hint').textContent = 'データの読み込みに失敗しました';
    $('empty').hidden = false;
    $('empty').textContent = 'データを読み込めませんでした。APIのデプロイ設定とURLをご確認ください。';
    console.error(e);
  }
}
$('search').addEventListener('input',update);document.querySelectorAll('input[name="field"]').forEach(x=>x.addEventListener('change',update));['date','status','sort'].forEach(id=>$(id).addEventListener('change',update));$('clear').addEventListener('click',()=>{$('search').value='';document.querySelector('input[name="field"][value="all"]').checked=true;$('date').value='';$('status').value='';update();});$('more').addEventListener('click',appendPage);init();
