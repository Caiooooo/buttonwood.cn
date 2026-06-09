/**
 * NEO.JS — Shared engine for the Immersive Digital Universe
 * Provides: particle background, custom cursor, scroll reveals, sidebar logic
 */
(function() {
  'use strict';

  // ====== PARTICLE SYSTEM ======
  function initParticles() {
    const canvas = document.createElement('canvas');
    canvas.id = 'neoParticleCanvas';
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    let W, H, particles = [], mouse = { x: -999, y: -999 };
    const COUNT = 100;

    function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
    window.addEventListener('resize', resize); resize();

    class Particle {
      constructor() { this.reset(); this.y = Math.random() * H; }
      reset() {
        this.x = Math.random() * W; this.y = -10;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = Math.random() * 0.3 + 0.1;
        this.r = Math.random() * 1.5 + 0.5;
        this.alpha = Math.random() * 0.5 + 0.2;
      }
      update() {
        const dx = mouse.x - this.x, dy = mouse.y - this.y;
        const dist = Math.sqrt(dx*dx+dy*dy);
        if (dist < 150 && dist > 0) {
          const force = (150-dist)/150 * 0.03;
          this.vx -= (dx/dist)*force; this.vy -= (dy/dist)*force;
        }
        this.vx *= 0.999; this.vy *= 0.999;
        this.x += this.vx; this.y += this.vy;
        if (this.y > H+10 || this.x < -50 || this.x > W+50) this.reset();
      }
      draw() {
        ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI*2);
        ctx.fillStyle = `rgba(180,220,255,${this.alpha})`; ctx.fill();
      }
    }

    for (let i=0; i<COUNT; i++) particles.push(new Particle());

    document.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
    document.addEventListener('mouseleave', () => { mouse.x=-999; mouse.y=-999; });

    function drawLines() {
      for (let i=0; i<particles.length; i++) {
        for (let j=i+1; j<particles.length; j++) {
          const dx=particles[i].x-particles[j].x, dy=particles[i].y-particles[j].y;
          const dist=Math.sqrt(dx*dx+dy*dy);
          if (dist<100) {
            ctx.beginPath(); ctx.moveTo(particles[i].x,particles[i].y); ctx.lineTo(particles[j].x,particles[j].y);
            ctx.strokeStyle=`rgba(180,220,255,${0.07*(1-dist/100)})`; ctx.lineWidth=0.5; ctx.stroke();
          }
        }
      }
    }

    (function anim() { ctx.clearRect(0,0,W,H); particles.forEach(p=>{p.update();p.draw();}); drawLines(); requestAnimationFrame(anim); })();
  }

  // ====== CUSTOM CURSOR ======
  function initCursor() {
    if (window.innerWidth < 769) return;
    const c = document.createElement('div'); c.id='neoCursor';
    c.style.cssText='position:fixed;pointer-events:none;z-index:9999;width:22px;height:22px;border:2px solid var(--cyan, #00e5ff);border-radius:50%;transform:translate(-50%,-50%);transition:width .2s,height .2s,border-color .3s;mix-blend-mode:difference;';
    const t = document.createElement('div'); t.id='neoTrail';
    t.style.cssText='position:fixed;pointer-events:none;z-index:9998;width:70px;height:70px;background:radial-gradient(circle,rgba(0,229,255,.12) 0%,transparent 70%);border-radius:50%;transform:translate(-50%,-50%);';
    document.body.appendChild(c); document.body.appendChild(t);

    let cx=-100, cy=-100, tx=-100, ty=-100;
    document.addEventListener('mousemove', e=>{ tx=e.clientX; ty=e.clientY; });
    document.addEventListener('mouseleave', ()=>{ c.style.opacity='0'; t.style.opacity='0'; });
    document.addEventListener('mouseenter', ()=>{ c.style.opacity='1'; t.style.opacity='1'; });

    document.querySelectorAll('a,button,.neo-card,.neo-tool-card,.neo-glass,.neo-nav li,.neo-btn')
      .forEach(el=>{
        el.addEventListener('mouseenter',()=>{ c.style.width='44px';c.style.height='44px';c.style.borderColor='var(--purple, #b44dff)'; });
        el.addEventListener('mouseleave',()=>{ c.style.width='22px';c.style.height='22px';c.style.borderColor='var(--cyan, #00e5ff)'; });
      });

    (function follow(){ cx+=(tx-cx)*0.12; cy+=(ty-cy)*0.12; c.style.left=cx+'px';c.style.top=cy+'px'; t.style.left=tx+'px';t.style.top=ty+'px'; requestAnimationFrame(follow); })();
  }

  // ====== SCROLL REVEAL ======
  function initReveal() {
    const obs = new IntersectionObserver(entries=>{
      entries.forEach(e=>{ if(e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.12 });
    document.querySelectorAll('.neo-reveal').forEach(el=>obs.observe(el));
  }

  // ====== SIDEBAR MOBILE ======
  function initSidebar() {
    const sidebar = document.querySelector('.neo-sidebar');
    const overlay = document.querySelector('.neo-overlay');
    const menuBtn = document.querySelector('.neo-menu-btn');
    if (!sidebar || !menuBtn) return;

    function open() { sidebar.classList.add('open'); if(overlay) overlay.classList.add('show'); menuBtn.classList.add('active'); }
    function close() { sidebar.classList.remove('open'); if(overlay) overlay.classList.remove('show'); menuBtn.classList.remove('active'); }
    menuBtn.addEventListener('click', ()=> sidebar.classList.contains('open') ? close() : open());
    if (overlay) overlay.addEventListener('click', close);

    // Active nav highlighting
    const path = window.location.pathname;
    const navItems = document.querySelectorAll('.neo-nav li[data-page]');
    navItems.forEach(li => {
      if (path.includes(li.dataset.page) || (path==='/' && li.dataset.page==='index')) {
        li.classList.add('active');
      }
    });
  }

  // ====== INIT ======
  document.addEventListener('DOMContentLoaded', ()=>{
    initParticles();
    initCursor();
    initReveal();
    initSidebar();

    // Query param user info
    setTimeout(()=>{
      const un = new URLSearchParams(window.location.search).get('userName');
      if (un) {
        const ne = document.getElementById('neoUserName');
        if (ne) ne.textContent = un;
        const ae = document.getElementById('neoUserAvatar') || document.querySelector('.neo-sidebar-footer img');
        if (ae) ae.src = '/img/userAvatar/' + un + '.jpg?t=' + Date.now();
      }
    }, 500);
  });

})();
