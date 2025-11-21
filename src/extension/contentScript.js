// contentScript.js — fixed positioning + join flow (permanent)
(function () {
  if (window.__classEngageInjected) return;
  window.__classEngageInjected = true;

  const el = (tag, cls) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    return e;
  };

  // base container
  const container = el('div', 'ce-overlay');
  container.id = 'classengage-overlay';

  // Inline essential positioning to avoid being hidden by Meet DOM/layout
  Object.assign(container.style, {
    position: 'fixed',
    top: '12px',
    right: '12px',
    left: 'auto',
    width: '300px',
    zIndex: '2147483647',
    pointerEvents: 'auto',
    display: 'block',
    background: 'rgba(255,255,255,0.98)',
    borderRadius: '12px',
    boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
    border: '1px solid #E3E3EE',
    fontFamily: 'Inter, Arial, Helvetica, sans-serif'
  });

  container.innerHTML = `
    <div class="ce-panel" style="padding:8px;">
      <div class="ce-top" style="display:flex;justify-content:space-between;align-items:center;">
        <div class="ce-title" style="font-weight:600">ClassEngage</div>
        <button class="ce-collapse" title="Collapse" style="background:#F2F2F6;border:none;border-radius:6px;padding:4px 6px;cursor:pointer">−</button>
      </div>
      <div class="ce-tabs" style="display:flex;gap:8px;padding:8px 0;">
        <button class="ce-tab ce-tab-active" data-tab="polls" style="padding:6px 10px;border-radius:8px;background:#6C5CE7;color:#fff;font-weight:600;border:none;cursor:pointer;">Polls</button>
        <button class="ce-tab" data-tab="leader" style="padding:6px 10px;border-radius:8px;background:transparent;border:none;color:#6F6F78;cursor:pointer;">Leaderboard</button>
      </div>
      <div class="ce-body" style="padding:6px 0;">
        <div class="ce-join" style="display:none;">
          <div style="margin-bottom:8px;font-weight:600;">Join Session</div>
          <input id="ce-name" placeholder="Your name" style="width:100%;padding:8px;margin-bottom:8px;border-radius:8px;border:1px solid #e6e6ee;" />
          <input id="ce-center" placeholder="Your center (e.g., Pune)" style="width:100%;padding:8px;margin-bottom:8px;border-radius:8px;border:1px solid #e6e6ee;" />
          <div style="display:flex;gap:8px">
            <button id="ce-join-btn" style="flex:1;background:#6C5CE7;color:white;border:none;padding:8px;border-radius:8px;cursor:pointer;">Join</button>
            <button id="ce-join-guest" style="flex:1;background:#f2f2f6;border:none;padding:8px;border-radius:8px;cursor:pointer;">Guest</button>
          </div>
        </div>

        <div class="ce-content ce-content-polls" style="display:none;">
          <div class="ce-hello" style="margin-bottom:8px;"></div>
          <div class="ce-question">No active poll</div>
          <div class="ce-options" style="display:none;"></div>
          <button class="ce-submit" style="display:none;"></button>
        </div>

        <div class="ce-content ce-content-leader" style="display:none;">
          <div class="ce-top3-title" style="font-weight:600;margin-bottom:6px;">Top 3 Students</div>
          <ol class="ce-top3" style="padding-left:18px;margin-top:6px;margin-bottom:12px;"></ol>
          <div class="ce-centers-title" style="font-weight:600;margin-bottom:6px;">Centers</div>
          <div class="ce-centers"></div>
        </div>
      </div>

      <div class="ce-footer" style="padding-top:8px;font-size:12px;color:#6F6F78;border-top:1px solid #F1F1F6;margin-top:8px;">Session-only leaderboard. Resets after meeting.</div>
    </div>
  `;

  // append to body (not documentElement) to avoid layout clipping
  try {
    document.body.appendChild(container);
  } catch (e) {
    // fallback: append to documentElement if body unavailable
    document.documentElement.appendChild(container);
    console.warn('appended overlay to documentElement as fallback', e);
  }

  // small behavior JS (tabs, collapse, basic join) - same logic as before
  const tabs = container.querySelectorAll('.ce-tab');
  tabs.forEach(t => {
    t.addEventListener('click', () => {
      container.querySelectorAll('.ce-tab').forEach(x => x.classList.remove('ce-tab-active'));
      t.classList.add('ce-tab-active');
      const tab = t.dataset.tab;
      container.querySelectorAll('.ce-content, .ce-join').forEach(c => c.style.display = 'none');
      if (!localStorage.getItem('classengage_student')) {
        container.querySelector('.ce-join').style.display = 'block';
      } else {
        if (tab === 'polls') container.querySelector('.ce-content-polls').style.display = 'block';
        else container.querySelector('.ce-content-leader').style.display = 'block';
      }
    });
  });

  // collapse
  const collapseBtn = container.querySelector('.ce-collapse');
  let collapsed = false;
  collapseBtn.addEventListener('click', () => {
    const panel = container.querySelector('.ce-panel');
    collapsed = !collapsed;
    if (collapsed) {
      panel.style.width = '56px';
      panel.style.height = '56px';
      panel.querySelector('.ce-body').style.display = 'none';
      panel.querySelector('.ce-tabs').style.display = 'none';
      panel.querySelector('.ce-footer').style.display = 'none';
    } else {
      panel.style.width = '';
      panel.style.height = '';
      panel.querySelector('.ce-body').style.display = '';
      panel.querySelector('.ce-tabs').style.display = '';
      panel.querySelector('.ce-footer').style.display = '';
    }
  });

  // basic join behavior
  const nameInput = container.querySelector('#ce-name');
  const centerInput = container.querySelector('#ce-center');
  const joinBtn = container.querySelector('#ce-join-btn');
  const guestBtn = container.querySelector('#ce-join-guest');

  function saveStudent(s){ localStorage.setItem('classengage_student', JSON.stringify(s)); }
  function loadStudent(){ try{ return JSON.parse(localStorage.getItem('classengage_student')); }catch(e){return null;} }

  function renderLeaderboard(students){
    const ol = container.querySelector('.ce-top3');
    const centersDiv = container.querySelector('.ce-centers');
    ol.innerHTML = ''; centersDiv.innerHTML = '';
    students.sort((a,b)=> (b.score||0)-(a.score||0)).slice(0,3).forEach(s=>{
      const li = document.createElement('li'); li.innerHTML = `${s.name} — <span class="score">${s.score||0}</span>`; ol.appendChild(li);
    });
    const centers={}; students.forEach(s=> centers[s.center]=(centers[s.center]||0)+(s.score||0));
    Object.entries(centers).forEach(([c,sc])=>{ const d=document.createElement('div'); d.innerText=`${c} — ${sc}`; centersDiv.appendChild(d); });
  }

  function showJoinedState(){
    const s = loadStudent();
    if(!s) return;
    container.querySelector('.ce-join').style.display='none';
    container.querySelector('.ce-content-polls').style.display='block';
    container.querySelector('.ce-hello').innerText = `Hello, ${s.name} — ${s.center}`;
    renderLeaderboard([s]);
  }

  joinBtn.addEventListener('click', ()=>{
    const name = (nameInput.value||'').trim(); const center=(centerInput.value||'Unknown').trim();
    if(!name){ alert('Please enter your name'); return; }
    const s = { id:'local_'+Math.random().toString(36).slice(2,9), name, center, score:0 };
    saveStudent(s); showJoinedState();
  });

  guestBtn.addEventListener('click', ()=>{ const s = { id:'guest_'+Math.random().toString(36).slice(2,9), name:'Guest', center:'Guest', score:0 }; saveStudent(s); showJoinedState(); });

  // Drag (keeps it draggable)
  (function makeDraggable(node){
    let down=false, off={x:0,y:0}; const header=node.querySelector('.ce-top'); header.style.cursor='move';
    header.addEventListener('mousedown',e=>{ down=true; off.x=node.offsetLeft - e.clientX; off.y=node.offsetTop - e.clientY; document.body.style.userSelect='none'; });
    document.addEventListener('mouseup',()=>{ down=false; document.body.style.userSelect=''; });
    document.addEventListener('mousemove',e=>{ if(!down) return; const x=e.clientX + off.x; const y=e.clientY + off.y; node.style.left = Math.max(8, Math.min(window.innerWidth - 320, x)) + 'px'; node.style.top = Math.max(8, Math.min(window.innerHeight - 120, y)) + 'px'; node.style.position='fixed'; });
  })(container);

  // initial view
  if (loadStudent()) { showJoinedState(); } else { container.querySelector('.ce-join').style.display='block'; }

  console.log('ClassEngage content script loaded (fixed-position overlay)');
})();
