/* =====================================================
   CortaClic – Session Manager + Navigation Renderer
   ===================================================== */

const CC = (() => {
  const SESSION_KEY = 'cc_session';

  /* ── Session ─────────────────────────────────────── */
  function getSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; }
  }
  function saveSession(token, user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ token, user }));
  }
  function clearSession() { localStorage.removeItem(SESSION_KEY); }
  function isLoggedIn()   { return !!getSession(); }
  function getUser()      { const s = getSession(); return s ? s.user : null; }
  function getToken()     { const s = getSession(); return s ? s.token : null; }

  /* ── Access Control ──────────────────────────────── */
  function requireAuth(roles = []) {
    const s = getSession();
    if (!s) {
      window.location.href = '/login?next=' + encodeURIComponent(window.location.pathname);
      return false;
    }
    if (roles.length && !roles.includes(s.user.rol)) {
      window.location.href = '/';
      return false;
    }
    return true;
  }

  function redirectIfLoggedIn(to = '/') {
    const s = getSession();
    if (s) {
      const target = s.user.rol === 0 ? '/admin/dashboard' : to;
      window.location.href = target;
      return true;
    }
    return false;
  }

  /* ── Navigation ──────────────────────────────────── */
  function renderNav() {
    const user = getUser();
    const path = window.location.pathname;
    const isAdminPath = path.startsWith('/admin');

    /* --- Mobile Header --- */
    const mhEl = document.getElementById('mobile-header');
    if (mhEl) {
      if (isAdminPath) {
        mhEl.innerHTML = `
          <div class="mobile-header__brand">
            <i class="fa fa-shield-lock acc"></i>
            Admin<span class="acc">Panel</span>
          </div>
          <div class="mobile-header__actions">
            <button class="btn-ghost" style="padding:4px 10px; font-size:.75rem;" onclick="CC.logout()">
              <i class="fa fa-sign-out"></i>
            </button>
          </div>`;
      } else {
        mhEl.innerHTML = `
          <div class="mobile-header__brand">
            <i class="fa fa-scissors acc"></i>
            Corta<span class="acc">Clic</span>
          </div>
          <div class="mobile-header__actions">
            ${user ? `<a href="/carrito" class="icon-btn"><i class="fa fa-shopping-bag"></i><span class="cart-badge">0</span></a>` : ''}
          </div>`;
      }
    }

    /* --- Desktop Navbar --- */
    const dnEl = document.getElementById('desktop-nav');
    if (dnEl) {
      if (isAdminPath) {
        dnEl.innerHTML = `
          <nav class="navbar navbar-expand-md desktop-navbar">
            <div class="container">
              <a class="navbar-brand" href="/admin/dashboard">
                <i class="fa fa-shield-lock acc"></i>Corta<span class="acc">Clic</span> Admin
              </a>
              <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#dnMenu" aria-expanded="false">
                <span class="navbar-toggler-icon"></span>
              </button>
              <div class="collapse navbar-collapse" id="dnMenu">
                <ul class="navbar-nav mr-auto">
                  <li class="nav-item"><a class="nav-link ${path==='/admin/dashboard'?'active':''}" href="/admin/dashboard">Inicio</a></li>
                  <li class="nav-item"><a class="nav-link ${path==='/admin/barberos'?'active':''}" href="/admin/barberos">Barberos</a></li>
                  <li class="nav-item"><a class="nav-link ${path==='/admin/servicios'?'active':''}" href="/admin/servicios">Servicios</a></li>
                  <li class="nav-item"><a class="nav-link ${path==='/admin/productos'?'active':''}" href="/admin/productos">Productos</a></li>
                  <li class="nav-item"><a class="nav-link ${path==='/admin/historial'?'active':''}" href="/admin/historial">Historial</a></li>
                </ul>
                <ul class="navbar-nav">
                  <li class="nav-item">
                    <span class="nav-link text-warning" style="font-size:.85rem; font-weight:700;">
                      <i class="fa fa-person-fill mr-1"></i>${user ? user.nombre.split(' ')[0] : 'Admin'}
                    </span>
                  </li>
                  <li class="nav-item ml-2">
                    <button class="btn-nav-cta" onclick="CC.logout()">
                      <i class="fa fa-sign-out mr-1"></i>Salir
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </nav>`;
      } else {
        const rightLinks = user
          ? `<li class="nav-item">
               <a class="nav-link ${path==='/mis-citas'?'active':''}" href="/mis-citas">
                 <i class="fa fa-calendar-check-o mr-1"></i>Mis Citas
               </a>
             </li>
             <li class="nav-item">
               <a class="nav-link ${path==='/perfil'?'active':''}" href="/perfil">
                 <i class="fa fa-user mr-1"></i>${user.nombre.split(' ')[0]}
               </a>
             </li>
             <li class="nav-item ml-2">
               <a class="nav-link ${path==='/carrito'?'active':''}" href="/carrito" title="Carrito">
                 <i class="fa fa-shopping-bag"></i>
               </a>
             </li>
             <li class="nav-item ml-1">
               <button class="btn-nav-cta" onclick="CC.logout()">
                 <i class="fa fa-sign-out mr-1"></i>Salir
               </button>
             </li>`
          : `<li class="nav-item ml-2">
               <a class="btn-nav-cta" href="/login">Iniciar sesión</a>
             </li>`;

        dnEl.innerHTML = `
          <nav class="navbar navbar-expand-md desktop-navbar">
            <div class="container">
              <a class="navbar-brand" href="/">
                <i class="fa fa-scissors acc"></i>Corta<span class="acc">Clic</span>
              </a>
              <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#dnMenu" aria-expanded="false">
                <span class="navbar-toggler-icon"></span>
              </button>
              <div class="collapse navbar-collapse" id="dnMenu">
                <ul class="navbar-nav mr-auto">
                  <li class="nav-item"><a class="nav-link ${path==='/'?'active':''}" href="/">Inicio</a></li>
                  <li class="nav-item"><a class="nav-link ${path==='/servicios'?'active':''}" href="/servicios">Servicios</a></li>
                  <li class="nav-item"><a class="nav-link ${path==='/tienda'?'active':''}" href="/tienda">Tienda</a></li>
                </ul>
                <ul class="navbar-nav">${rightLinks}</ul>
              </div>
            </div>
          </nav>`;
      }
    }

    /* --- Bottom Nav --- */
    const bnEl = document.getElementById('bottom-nav');
    if (bnEl) {
      if (isAdminPath) {
        bnEl.innerHTML = `
          <a href="/admin/dashboard" class="bottom-nav__item ${path==='/admin/dashboard'?'active':''}">
            <i class="fa fa-speedometer2"></i><span>Inicio</span>
          </a>
          <a href="/admin/barberos" class="bottom-nav__item ${path==='/admin/barberos'?'active':''}">
            <i class="fa fa-users"></i><span>Barberos</span>
          </a>
          <a href="/admin/servicios" class="bottom-nav__item ${path==='/admin/servicios'?'active':''}">
            <i class="fa fa-scissors"></i><span>Servicios</span>
          </a>
          <a href="/admin/productos" class="bottom-nav__item ${path==='/admin/productos'?'active':''}">
            <i class="fa fa-archive"></i><span>Productos</span>
          </a>
          <a href="/admin/historial" class="bottom-nav__item ${path==='/admin/historial'?'active':''}">
            <i class="fa fa-clock-history"></i><span>Historial</span>
          </a>`;
      } else {
        const profileItem = user
          ? `<a href="/perfil" class="bottom-nav__item ${path==='/perfil'?'active':''}">
               <i class="fa fa-user${path==='/perfil'?'-fill':''}"></i><span>Perfil</span>
             </a>`
          : `<a href="/login" class="bottom-nav__item ${path==='/login'?'active':''}">
               <i class="fa fa-box-arrow-in-right"></i><span>Entrar</span>
             </a>`;

        bnEl.innerHTML = `
          <a href="/" class="bottom-nav__item ${path==='/'?'active':''}">
            <i class="fa fa-home${path==='/'?'-fill':''}"></i><span>Inicio</span>
          </a>
          <a href="/tienda" class="bottom-nav__item ${path==='/tienda'?'active':''}">
            <i class="fa fa-shopping-bag${path==='/tienda'?'-window':''}"></i><span>Tienda</span>
          </a>
          <a href="/mis-citas" class="bottom-nav__item ${path==='/mis-citas'?'active':''}">
            <i class="fa fa-calendar${path==='/mis-citas'?'-check-fill':''}"></i><span>Mis Citas</span>
          </a>
          ${profileItem}`;
      }
    }
  }

  /* ── Logout ──────────────────────────────────────── */
  function logout() {
    clearSession();
    window.location.href = '/';
  }

  /* ── API helpers ─────────────────────────────────── */
  async function apiLogin(email, password) {
    const r = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return r.json();
  }

  async function apiRegister(nombre, email, telefono, password) {
    const r = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, email, telefono, password }),
    });
    return r.json();
  }

  /* ── UI helpers ──────────────────────────────────── */
  function showAlert(id, msg, type = 'err') {
    const el = document.getElementById(id);
    if (!el) return;
    el.className = `cc-alert cc-alert-${type} show`;
    el.innerHTML = `<i class="fa fa-${type==='err'?'exclamation-circle':'check-circle'}"></i> ${msg}`;
  }

  function hideAlert(id) {
    const el = document.getElementById(id);
    if (el) el.className = 'cc-alert';
  }

  function setLoading(btnId, loading, text = '') {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    if (loading) {
      btn.disabled = true;
      btn.innerHTML = `<span class="btn-spinner"></span>`;
    } else {
      btn.disabled = false;
      btn.innerHTML = text;
    }
  }

  /* ── Init ────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', renderNav);

  return {
    getSession, saveSession, clearSession,
    isLoggedIn, getUser, getToken,
    requireAuth, redirectIfLoggedIn,
    renderNav, logout,
    apiLogin, apiRegister,
    showAlert, hideAlert, setLoading,
  };
})();