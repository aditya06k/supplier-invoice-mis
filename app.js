/* InvoiceOS — App Logic (Firebase-ready data layer) */

// ── Firebase Integration ──
// Firestore rules: allow read/write only to authenticated users
const firebaseConfig = {
  apiKey: "AIzaSyCtV81kTYR5Pj2eby5GiMQR-fbt3808By4",
  authDomain: "supplier-invoice-mis.firebaseapp.com",
  projectId: "supplier-invoice-mis",
  storageBucket: "supplier-invoice-mis.firebasestorage.app",
  messagingSenderId: "761182246021",
  appId: "1:761182246021:web:35efac67a34696940005ec"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
// File uploads stored as base64 in Firestore (no Firebase Storage needed — works on free Spark plan)

// ══════ DATA LAYER (Firestore-backed) ══════

// Demo seed data — written to Firestore once if the invoices collection is empty
const SEED_INVOICES = [
  { invoiceNumber: 'INV-2026-0041', supplierName: 'Apex Manufacturing Ltd', supplierId: 'demo', amountINR: 2475000, description: 'CNC machined components — PO #8871', category: 'Manufacturing Parts', status: 'pending', createdAt: '2026-04-25T10:30:00', fileURL: '' },
  { invoiceNumber: 'INV-2026-0040', supplierName: 'Meridian Logistics Co', supplierId: 'demo', amountINR: 832050, description: 'Freight forwarding — Mumbai to Rotterdam', category: 'Logistics & Freight', status: 'approved', createdAt: '2026-04-24T14:18:00', fileURL: '' },
  { invoiceNumber: 'INV-2026-0039', supplierName: 'Steelworks International', supplierId: 'demo', amountINR: 13750000, description: 'Structural steel beams — Project Titan', category: 'Raw Materials', status: 'pending', createdAt: '2026-04-23T11:05:00', fileURL: '' },
  { invoiceNumber: 'INV-2026-0038', supplierName: 'NovaChem Industries', supplierId: 'demo', amountINR: 560000, description: 'Chemical reagents — quantity mismatch on delivery', category: 'Raw Materials', status: 'rejected', createdAt: '2026-04-22T09:22:00', fileURL: '' },
  { invoiceNumber: 'INV-2026-0037', supplierName: 'Global Fasteners Inc', supplierId: 'demo', amountINR: 329075, description: 'M8 hex bolts, washers, lock nuts — 5000 units', category: 'Manufacturing Parts', status: 'approved', createdAt: '2026-04-21T15:44:00', fileURL: '' },
  { invoiceNumber: 'INV-2026-0036', supplierName: 'Apex Manufacturing Ltd', supplierId: 'demo', amountINR: 1890000, description: 'Precision gears and shafts — PO #8845', category: 'Manufacturing Parts', status: 'approved', createdAt: '2026-04-20T13:30:00', fileURL: '' },
  { invoiceNumber: 'INV-2026-0035', supplierName: 'TechParts Solutions', supplierId: 'demo', amountINR: 4210000, description: 'PCB assemblies and sensor modules', category: 'IT & Software', status: 'pending', createdAt: '2026-04-19T10:11:00', fileURL: '' },
  { invoiceNumber: 'INV-2026-0034', supplierName: 'Meridian Logistics Co', supplierId: 'demo', amountINR: 675000, description: 'Customs clearance and warehousing fees', category: 'Logistics & Freight', status: 'pending', createdAt: '2026-04-18T08:55:00', fileURL: '' },
  { invoiceNumber: 'INV-2026-0033', supplierName: 'EnviroSeal Packaging', supplierId: 'demo', amountINR: 215025, description: 'Anti-static packaging materials — 200 rolls', category: 'Packaging', status: 'approved', createdAt: '2026-04-17T16:09:00', fileURL: '' },
  { invoiceNumber: 'INV-2026-0032', supplierName: 'Steelworks International', supplierId: 'demo', amountINR: 8900000, description: 'Hot-rolled steel plates — missing quality certs', category: 'Raw Materials', status: 'rejected', createdAt: '2026-04-16T12:33:00', fileURL: '' }
];
const SEED_LOGS = [
  { invoiceId: 'INV-2026-0041', action: 'SUBMIT', performedBy: 'Rajesh Kumar', role: 'supplier', remarks: 'Invoice submitted for review', timestamp: '2026-04-25 10:30:22' },
  { invoiceId: 'INV-2026-0040', action: 'APPROVE', performedBy: 'Priya Sharma', role: 'manager', remarks: 'Verified against PO and BOL', timestamp: '2026-04-24 14:18:33' },
  { invoiceId: 'INV-2026-0039', action: 'SUBMIT', performedBy: 'Rajesh Kumar', role: 'supplier', remarks: 'Submitted for Project Titan', timestamp: '2026-04-23 11:05:47' },
  { invoiceId: 'INV-2026-0038', action: 'REJECT', performedBy: 'Priya Sharma', role: 'manager', remarks: 'Quantity mismatch with delivery receipt', timestamp: '2026-04-22 09:22:19' },
  { invoiceId: 'INV-2026-0037', action: 'APPROVE', performedBy: 'Priya Sharma', role: 'manager', remarks: 'Matched with GRN #4421', timestamp: '2026-04-21 15:44:02' },
  { invoiceId: 'INV-2026-0036', action: 'APPROVE', performedBy: 'Priya Sharma', role: 'manager', remarks: 'All documents verified', timestamp: '2026-04-20 13:30:58' },
  { invoiceId: 'INV-2026-0035', action: 'SUBMIT', performedBy: 'Rajesh Kumar', role: 'supplier', remarks: 'PCB batch delivery complete', timestamp: '2026-04-19 10:11:26' },
  { invoiceId: 'INV-2026-0034', action: 'SUBMIT', performedBy: 'Rajesh Kumar', role: 'supplier', remarks: 'Warehousing invoice attached', timestamp: '2026-04-18 08:55:41' },
  { invoiceId: 'INV-2026-0033', action: 'APPROVE', performedBy: 'Priya Sharma', role: 'manager', remarks: 'Within budget allocation', timestamp: '2026-04-17 16:09:13' },
  { invoiceId: 'INV-2026-0032', action: 'REJECT', performedBy: 'Amit Verma', role: 'auditor', remarks: 'Missing ISO quality certificates', timestamp: '2026-04-16 12:33:07' }
];

// Seed Firestore with demo data if empty (runs once per fresh database)
async function seedIfEmpty() {
  try {
    const snap = await db.collection('invoices').limit(1).get();
    if (snap.empty) {
      console.log('Seeding Firestore with demo data...');
      const batch = db.batch();
      SEED_INVOICES.forEach(inv => {
        batch.set(db.collection('invoices').doc(inv.invoiceNumber), inv);
      });
      SEED_LOGS.forEach((log, i) => {
        batch.set(db.collection('audit_logs').doc('seed_' + i), log);
      });
      await batch.commit();
      console.log('Demo data seeded successfully');
    }
  } catch (e) {
    console.error('Seed failed:', e);
  }
}

// ── Firestore API functions ──
async function getInvoices(filter) {
  try {
    let query = db.collection('invoices').orderBy('createdAt', 'desc');
    if (filter && filter.status && filter.status !== 'all') {
      query = query.where('status', '==', filter.status);
    }
    const snap = await query.get();
    let list = snap.docs.map(doc => ({ ...doc.data(), _docId: doc.id }));
    if (filter && filter.supplierId) {
      list = list.filter(i => i.supplierId === filter.supplierId);
    }
    return list;
  } catch (e) {
    console.error('getInvoices failed:', e);
    return [];
  }
}

async function submitInvoice(data) {
  try {
    await db.collection('invoices').doc(data.invoiceNumber).set(data);
    await addLog(data.invoiceNumber, 'SUBMIT', `Invoice submitted by ${data.supplierName}`);
    return data;
  } catch (e) {
    console.error('submitInvoice failed:', e);
    throw e;
  }
}

async function updateStatus(invoiceNumber, newStatus, remarks) {
  try {
    await db.collection('invoices').doc(invoiceNumber).update({ status: newStatus });
    await addLog(invoiceNumber, newStatus.toUpperCase(), remarks || 'No remarks');
    return { invoiceNumber, status: newStatus };
  } catch (e) {
    console.error('updateStatus failed:', e);
    throw e;
  }
}

async function getLogs() {
  try {
    const snap = await db.collection('audit_logs').orderBy('timestamp', 'desc').get();
    return snap.docs.map(doc => doc.data());
  } catch (e) {
    console.error('getLogs failed:', e);
    return [];
  }
}

async function addLog(invoiceId, action, remarks) {
  const now = new Date();
  const ts = now.getFullYear() + '-' + p(now.getMonth() + 1) + '-' + p(now.getDate()) + ' ' + p(now.getHours()) + ':' + p(now.getMinutes()) + ':' + p(now.getSeconds());
  const logEntry = { invoiceId, action, performedBy: currentUser.name, role: currentUser.role, remarks, timestamp: ts };
  try {
    await db.collection('audit_logs').add(logEntry);
  } catch (e) {
    console.error('addLog failed:', e);
  }
}

// Upload file as base64 to Firestore (no Storage needed — free Spark plan compatible)
// Files stored in separate 'invoice_files' collection to keep invoice docs lightweight
const MAX_FILE_SIZE = 750 * 1024; // 750 KB limit (base64 inflates ~33%, must stay under 1MB Firestore doc limit)

async function uploadInvoiceFile(file, invoiceNumber) {
  if (!file) return '';
  if (file.size > MAX_FILE_SIZE) {
    toast(`File too large (${(file.size / 1024).toFixed(0)} KB). Max allowed is 750 KB.`, 'error');
    return '';
  }
  try {
    // Convert file to base64 data URL
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
    // Store in a separate Firestore collection
    await db.collection('invoice_files').doc(invoiceNumber).set({
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      data: base64,
      uploadedAt: nowISO()
    });
    console.log('File saved to Firestore:', file.name, file.size, 'bytes');
    // Return a marker so we know a file exists (actual data is in invoice_files collection)
    return 'firestore://' + invoiceNumber;
  } catch (e) {
    console.error('File upload failed:', e);
    toast('File upload failed: ' + (e.message || 'Unknown error') + '. Invoice will be submitted without attachment.', 'error');
    return '';
  }
}

// Retrieve and open a file stored in Firestore
async function viewInvoiceFile(invoiceNumber) {
  try {
    toast('Loading document...', 'info');
    const doc = await db.collection('invoice_files').doc(invoiceNumber).get();
    if (!doc.exists) { toast('Document not found', 'error'); return; }
    const fileData = doc.data();
    // Convert base64 data URL back to blob and open in new tab
    const res = await fetch(fileData.data);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    // Clean up object URL after a delay
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch (e) {
    console.error('File view failed:', e);
    toast('Failed to load document: ' + e.message, 'error');
  }
}

function p(n) { return String(n).padStart(2, '0'); }

// ══════ STATE ══════
let currentUser = null;
let managerFilter = 'pending';
// Flag to prevent onAuthStateChanged from racing with login/signup handlers
let authActionInProgress = false;
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

// ══════ HELPERS ══════
function formatINR(n) {
  const s = Math.abs(Math.round(n)).toString();
  if (s.length <= 3) return '₹' + s;
  let last3 = s.slice(-3), rest = s.slice(0, -3);
  let result = '';
  while (rest.length > 2) { result = ',' + rest.slice(-2) + result; rest = rest.slice(0, -2); }
  return '₹' + rest + result + ',' + last3;
}
function fmtDate(d) {
  const dt = new Date(d);
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function nowISO() { return new Date().toISOString(); }

function toast(msg, type = 'info') {
  const rack = $('#toastRack');
  const t = document.createElement('div');
  t.className = 'toast toast-' + type;
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  t.innerHTML = `<span style="font-size:1.1rem">${icons[type] || 'ℹ'}</span><span>${msg}</span>`;
  rack.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(40px)'; setTimeout(() => t.remove(), 300); }, 3500);
}

// ══════ INIT ══════
document.addEventListener('DOMContentLoaded', () => {
  setupLogin();
  setupSignup();
  setupClock();
  setupHamburger();
  setupSubmitModal();
  setupDetailModal();

  // SESSION RESTORE — always re-fetch role from Firestore, never trust localStorage alone
  auth.onAuthStateChanged(async (user) => {
    // If login/signup handler is active, let it handle routing — don't race
    if (authActionInProgress) {
      console.log('onAuthStateChanged: skipping — auth action in progress');
      return;
    }

    if (user) {
      try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists) {
          const role = userDoc.data().role.trim().toLowerCase();
          const name = userDoc.data().name || user.displayName || 'User';
          localStorage.setItem('userRole', role);
          localStorage.setItem('userName', name);
          console.log('Session restored — role from Firestore:', role);

          currentUser = { uid: user.uid, email: user.email, name: name, role: role };
          $('#loginPage').classList.add('hidden');
          const signupPage = $('#signupPage');
          if (signupPage) signupPage.classList.add('hidden');
          $('#appShell').classList.remove('hidden');
          bootApp();
        } else {
          console.warn('User doc not found in Firestore for uid:', user.uid);
          // No Firestore profile — stay on login, sign them out
          await auth.signOut();
        }
      } catch (err) {
        console.error('Session restore failed:', err);
      }
    } else {
      currentUser = null;
      localStorage.removeItem('userRole');
      localStorage.removeItem('userName');
      $('#appShell').classList.add('hidden');
      $('#loginPage').classList.remove('hidden');
      const signupPage = $('#signupPage');
      if (signupPage) signupPage.classList.add('hidden');
    }
  });
});

// ══════ CLOCK ══════
function setupClock() {
  const el = $('#clock');
  if (!el) return;
  function tick() { const n = new Date(); el.textContent = p(n.getHours()) + ':' + p(n.getMinutes()) + ':' + p(n.getSeconds()) + ' IST'; }
  tick(); setInterval(tick, 1000);
}

// ══════ LOGIN ══════
function setupLogin() {
  // role option highlight
  $$('.role-option').forEach(opt => {
    opt.addEventListener('click', () => {
      opt.parentElement.querySelectorAll('.role-option').forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
    });
  });

  const showSignupBtn = $('#showSignupBtn');
  if (showSignupBtn) {
    showSignupBtn.onclick = () => {
      $('#loginPage').classList.add('hidden');
      $('#signupPage').classList.remove('hidden');
    };
  }

  $('#loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    const email = $('#loginEmail').value.trim();
    const password = $('#loginPassword').value;
    const btn = $('#loginBtn');
    const oldText = btn.innerHTML;
    btn.textContent = 'Signing In...';
    btn.disabled = true;

    // Prevent onAuthStateChanged from racing
    authActionInProgress = true;

    try {
      const userCred = await auth.signInWithEmailAndPassword(email, password);

      // Always fetch fresh role from Firestore on login — never trust localStorage
      const userDoc = await db.collection('users').doc(userCred.user.uid).get();

      if (!userDoc.exists()) {
        toast('User profile not found. Please sign up first.', 'error');
        await auth.signOut();
        return;
      }

      const userData = userDoc.data();
      const role = userData.role.trim().toLowerCase();
      const name = userData.name || userCred.user.displayName || 'User';
      console.log('Logged in — role from Firestore:', role);

      localStorage.setItem('userRole', role);
      localStorage.setItem('userName', name);

      currentUser = { uid: userCred.user.uid, email: userCred.user.email, name: name, role: role };
      $('#loginPage').classList.add('hidden');
      const signupPage = $('#signupPage');
      if (signupPage) signupPage.classList.add('hidden');
      $('#appShell').classList.remove('hidden');
      bootApp();
      toast('Signed in successfully', 'success');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      btn.innerHTML = oldText;
      btn.disabled = false;
      authActionInProgress = false;
    }
  });
}

function setupSignup() {
  const showLoginBtn = $('#showLoginBtn');
  if (showLoginBtn) {
    showLoginBtn.onclick = () => {
      $('#signupPage').classList.add('hidden');
      $('#loginPage').classList.remove('hidden');
    };
  }

  $('#signupForm').addEventListener('submit', async e => {
    e.preventDefault();
    const name = $('#signupName').value.trim();
    const email = $('#signupEmail').value.trim();
    const password = $('#signupPassword').value;
    const role = document.querySelector('input[name=signupRole]:checked').value.trim().toLowerCase();
    const btn = $('#signupSubmitBtn');
    const oldText = btn.innerHTML;
    btn.textContent = 'Signing Up...';
    btn.disabled = true;

    console.log('Signing up with role:', role);

    // Prevent onAuthStateChanged from racing — this is the critical fix
    authActionInProgress = true;

    try {
      const userCred = await auth.createUserWithEmailAndPassword(email, password);
      await userCred.user.updateProfile({ displayName: name });

      // Write Firestore profile BEFORE we route
      await db.collection('users').doc(userCred.user.uid).set({
        uid: userCred.user.uid,
        name: name,
        email: email,
        role: role,
        createdAt: nowISO()
      });

      console.log('Saved role to Firestore:', role);
      localStorage.setItem('userRole', role);
      localStorage.setItem('userName', name);

      // Now manually route to correct dashboard
      currentUser = { uid: userCred.user.uid, email: userCred.user.email, name: name, role: role };
      $('#loginPage').classList.add('hidden');
      const signupPage = $('#signupPage');
      if (signupPage) signupPage.classList.add('hidden');
      $('#appShell').classList.remove('hidden');
      bootApp();
      toast('Account created', 'success');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      btn.innerHTML = oldText;
      btn.disabled = false;
      authActionInProgress = false;
    }
  });
}

async function bootApp() {
  const role = currentUser.role.trim().toLowerCase();
  console.log('bootApp — routing to role:', role);
  // sidebar user info
  $('#sidebarUserName').textContent = currentUser.name;
  $('#sidebarRoleBadge').textContent = role.toUpperCase();
  $('#userAvatar').textContent = currentUser.name.charAt(0);
  // Seed demo data on first boot
  await seedIfEmpty();
  buildNav();
  renderPage();
}

// ══════ NAVIGATION ══════
function buildNav() {
  const nav = $('#sidebarNav');
  const links = {
    supplier: [
      { id: 'pageSupplierDash', icon: 'grid', label: 'Dashboard' },
      { id: 'pageAuditTrail', icon: 'activity', label: 'Audit Trail' }
    ], manager: [
      { id: 'pageManagerDash', icon: 'grid', label: 'Dashboard' },
      { id: 'pageAuditTrail', icon: 'activity', label: 'Audit Trail' }
    ], auditor: [
      { id: 'pageAuditorDash', icon: 'grid', label: 'Dashboard' },
      { id: 'pageAuditTrail', icon: 'activity', label: 'Audit Trail' }
    ]
  };
  const svgs = {
    grid: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
    activity: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>'
  };
  const items = links[currentUser.role] || links.supplier;
  nav.innerHTML = items.map((l, i) =>
    `<div class="nav-link${i === 0 ? ' active' : ''}" data-page="${l.id}">${svgs[l.icon]}<span>${l.label}</span></div>`
  ).join('');
  $$('.nav-link').forEach(nl => nl.addEventListener('click', () => {
    $$('.nav-link').forEach(n => n.classList.remove('active'));
    nl.classList.add('active');
    $$('.page').forEach(pg => pg.classList.remove('active'));
    const pg = document.getElementById(nl.dataset.page);
    if (pg) pg.classList.add('active');
    $('#bcPage').textContent = nl.querySelector('span').textContent;
    $('#sidebar').classList.remove('open');
    renderPage();
  }));
}

function renderPage() {
  $$('.page').forEach(pg => pg.classList.remove('active'));
  const activeLink = $('.nav-link.active');
  if (activeLink) { const pg = document.getElementById(activeLink.dataset.page); if (pg) pg.classList.add('active'); }
  if (currentUser.role === 'supplier') renderSupplier();
  else if (currentUser.role === 'manager') renderManager();
  else renderAuditor();
  renderAuditTrail();
}

// ══════ HAMBURGER ══════
function setupHamburger() {
  $('#hamburger').addEventListener('click', () => $('#sidebar').classList.toggle('open'));
}

// ══════ SUPPLIER VIEW ══════
async function renderSupplier() {
  const all = await getInvoices({});
  const pending = all.filter(i => i.status === 'pending').length;
  const approved = all.filter(i => i.status === 'approved').length;
  const rejected = all.filter(i => i.status === 'rejected').length;
  const vol = all.reduce((s, i) => s + i.amountINR, 0);
  $('#supplierKpis').innerHTML = kpiHTML([
    { v: all.length, l: 'Total', c: 'blue' },
    { v: pending, l: 'Pending', c: 'amber' },
    { v: approved, l: 'Approved', c: 'green' },
    { v: rejected, l: 'Rejected', c: 'red' },
    { v: formatINR(vol), l: 'Volume', c: 'purple', raw: true }
  ]);
  const grid = $('#supplierInvoiceGrid');
  if (!all.length) { grid.innerHTML = '<div class="empty"><p>No invoices yet. Submit your first invoice.</p></div>'; return; }
  grid.innerHTML = all.map(inv => cardHTML(inv, 'supplier')).join('');
}

// ══════ MANAGER VIEW ══════
async function renderManager() {
  const all = await getInvoices({});
  const pending = all.filter(i => i.status === 'pending').length;
  const approved = all.filter(i => i.status === 'approved').length;
  const rejected = all.filter(i => i.status === 'rejected').length;
  $('#managerKpis').innerHTML = kpiHTML([
    { v: all.length, l: 'Total', c: 'blue' },
    { v: pending, l: 'Pending', c: 'amber' },
    { v: approved, l: 'Approved', c: 'green' },
    { v: rejected, l: 'Rejected', c: 'red' }
  ]);
  setupManagerFilters();
  const filtered = await getInvoices({ status: managerFilter });
  const grid = $('#managerInvoiceGrid');
  if (!filtered.length) { grid.innerHTML = '<div class="empty"><p>No invoices match this filter.</p></div>'; return; }
  grid.innerHTML = filtered.map(inv => cardHTML(inv, 'manager')).join('');
}

function setupManagerFilters() {
  $$('#managerFilters .pill').forEach(pill => {
    pill.classList.toggle('active', pill.dataset.f === managerFilter);
    pill.onclick = () => { managerFilter = pill.dataset.f; renderManager(); };
  });
}

// ══════ AUDITOR VIEW ══════
async function renderAuditor() {
  const all = await getInvoices({});
  const pending = all.filter(i => i.status === 'pending').length;
  const vol = all.reduce((s, i) => s + i.amountINR, 0);
  $('#auditorKpis').innerHTML = kpiHTML([
    { v: all.length, l: 'Total Invoices', c: 'blue' },
    { v: pending, l: 'Pending Review', c: 'amber' },
    { v: formatINR(vol), l: 'Total Volume', c: 'purple', raw: true }
  ]);
  renderAuditorTable(all);
  const input = $('#auditorSearch');
  input.oninput = async () => {
    const q = input.value.toLowerCase().trim();
    let list = await getInvoices({});
    if (q) list = list.filter(i => i.supplierName.toLowerCase().includes(q) || i.invoiceNumber.toLowerCase().includes(q) || i.category.toLowerCase().includes(q));
    renderAuditorTable(list);
  };
}

function renderAuditorTable(list) {
  $('#auditorTbody').innerHTML = list.map(i => `<tr onclick="openDetail('${i.invoiceNumber}')" style="cursor:pointer">
    <td class="mono">${i.invoiceNumber}</td><td>${i.supplierName}</td>
    <td class="mono">${formatINR(i.amountINR)}</td><td>${i.category}</td>
    <td><span class="badge badge-${i.status}">${i.status}</span></td>
    <td class="mono">${fmtDate(i.createdAt)}</td></tr>`).join('');
}

// ══════ AUDIT TRAIL ══════
async function renderAuditTrail() {
  const logs = await getLogs();
  $('#logCount').textContent = logs.length;
  $('#auditLogTbody').innerHTML = logs.map(l => {
    const cls = l.action === 'APPROVE' ? 'act-approve' : l.action === 'REJECT' ? 'act-reject' : 'act-submit';
    return `<tr><td>${l.timestamp}</td><td>${l.invoiceId}</td><td class="${cls}">${l.action}</td><td>${l.performedBy} <span style="opacity:.5">(${l.role})</span></td><td style="white-space:normal;max-width:300px">${l.remarks}</td></tr>`;
  }).join('');
  const btn = $('#exportCsv');
  btn.onclick = () => {
    const csv = 'Timestamp,Invoice ID,Action,Done By,Role,Remarks\n' + logs.map(l => `"${l.timestamp}","${l.invoiceId}","${l.action}","${l.performedBy}","${l.role}","${l.remarks}"`).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'audit_trail.csv'; a.click();
    toast('Audit log exported', 'info');
  };
}

// ══════ CARD HTML ══════
function cardHTML(inv, role) {
  let actions = `<button class="btn btn-sm btn-ghost" onclick="openDetail('${inv.invoiceNumber}')">View</button>`;
  if (role === 'manager' && inv.status === 'pending') {
    actions = `<button class="btn btn-sm btn-success" onclick="event.stopPropagation();confirmAction('${inv.invoiceNumber}','approved')">✓ Approve</button>
    <button class="btn btn-sm btn-danger" onclick="event.stopPropagation();confirmAction('${inv.invoiceNumber}','rejected')">✕ Reject</button>` + actions;
  }
  return `<div class="inv-card s-${inv.status}" onclick="openDetail('${inv.invoiceNumber}')">
    <div class="card-row"><div><div class="card-supplier">${inv.supplierName}</div><div class="card-invnum">${inv.invoiceNumber}</div></div><span class="badge badge-${inv.status}">${inv.status}</span></div>
    <div class="card-metas"><div class="card-meta"><span class="meta-lbl">Amount</span><span class="meta-val">${formatINR(inv.amountINR)}</span></div><div class="card-meta"><span class="meta-lbl">Date</span><span class="meta-val">${fmtDate(inv.createdAt)}</span></div><div class="card-meta"><span class="meta-lbl">Category</span><span class="meta-val" style="font-family:var(--ui);font-size:.78rem">${inv.category}</span></div></div>
    <div class="card-desc">${inv.description}</div>
    <div class="card-actions">${actions}</div></div>`;
}

// ══════ KPI HTML ══════
function kpiHTML(items) {
  return items.map(k => `<div class="kpi"><div class="kpi-ico ${k.c}">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
    </div><div><span class="kpi-val">${k.raw ? k.v : k.v}</span><span class="kpi-lbl">${k.l}</span></div></div>`).join('');
}

// ══════ CONFIRM DIALOG ══════
let pendingAction = null;
function confirmAction(invoiceNumber, newStatus) {
  pendingAction = { invoiceNumber, newStatus };
  const label = newStatus === 'approved' ? 'Approve' : 'Reject';
  const cls = newStatus === 'approved' ? 'btn-success' : 'btn-danger';
  $('#confirmTitle').textContent = label + ' Invoice';
  $('#confirmMsg').textContent = `Are you sure you want to ${label.toLowerCase()} invoice ${invoiceNumber}?`;
  $('#confirmRemarks').value = '';
  $('#confirmOk').className = 'btn ' + cls;
  $('#confirmOk').textContent = label;
  $('#confirmOverlay').classList.add('open');
  $('#confirmCancel').onclick = () => $('#confirmOverlay').classList.remove('open');
  $('#confirmOk').onclick = async () => {
    const remarks = $('#confirmRemarks').value.trim() || 'No remarks';
    await updateStatus(pendingAction.invoiceNumber, pendingAction.newStatus, remarks);
    $('#confirmOverlay').classList.remove('open');
    toast(`Invoice ${pendingAction.invoiceNumber} ${pendingAction.newStatus}`, pendingAction.newStatus === 'approved' ? 'success' : 'error');
    renderPage();
    pendingAction = null;
  };
}

// ══════ DETAIL MODAL ══════
function setupDetailModal() {
  $('#closeDetail').onclick = () => $('#detailOverlay').classList.remove('open');
  $('#detailOverlay').addEventListener('click', e => { if (e.target === $('#detailOverlay')) $('#detailOverlay').classList.remove('open'); });
}
async function openDetail(id) {
  // Fetch invoice from Firestore so detail is always fresh
  try {
    const doc = await db.collection('invoices').doc(id).get();
    if (!doc.exists) { toast('Invoice not found', 'error'); return; }
    const inv = doc.data();
    $('#detailTitle').textContent = inv.invoiceNumber;
    const rows = [
      ['Supplier', inv.supplierName],
      ['Invoice #', inv.invoiceNumber],
      ['Amount', formatINR(inv.amountINR)],
      ['Category', inv.category],
      ['Date', fmtDate(inv.createdAt)],
      ['Status', `<span class="badge badge-${inv.status}">${inv.status}</span>`],
      ['Description', inv.description]
    ];
    // Add document view button if a file was uploaded
    if (inv.fileURL) {
      rows.push(['Document', `<button onclick="viewInvoiceFile('${inv.invoiceNumber}')" style="background:rgba(37,99,235,.08);border:1px solid var(--accent);color:var(--accent);padding:6px 14px;border-radius:6px;cursor:pointer;font-family:var(--ui);font-size:.82rem;font-weight:600;display:inline-flex;align-items:center;gap:6px">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        View / Download</button>`]);
    }
    $('#detailBody').innerHTML = rows.map(([l, v]) => `<div class="detail-row"><span class="detail-lbl">${l}</span><span class="detail-val">${v}</span></div>`).join('');
    let foot = '<button class="btn btn-ghost" onclick="$(\'#detailOverlay\').classList.remove(\'open\')">Close</button>';
    if (currentUser.role === 'manager' && inv.status === 'pending') {
      foot = `<button class="btn btn-danger" onclick="$('#detailOverlay').classList.remove('open');confirmAction('${inv.invoiceNumber}','rejected')">Reject</button>
      <button class="btn btn-success" onclick="$('#detailOverlay').classList.remove('open');confirmAction('${inv.invoiceNumber}','approved')">Approve</button>` + foot;
    }
    $('#detailFoot').innerHTML = foot;
    $('#detailOverlay').classList.add('open');
  } catch (e) {
    console.error('openDetail failed:', e);
    toast('Failed to load invoice details', 'error');
  }
}

// ══════ SUBMIT MODAL ══════
function setupSubmitModal() {
  const openBtn = $('#openSubmitModal');
  const overlay = $('#submitOverlay');
  const closeBtn = $('#closeSubmitModal');
  const cancelBtn = $('#cancelSubmit');
  const form = $('#submitForm');
  const dropZone = $('#dropZone');
  const fileInput = $('#fFile');
  const fileChosen = $('#fileChosen');

  if (openBtn) openBtn.onclick = () => overlay.classList.add('open');
  closeBtn.onclick = () => overlay.classList.remove('open');
  cancelBtn.onclick = () => overlay.classList.remove('open');
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('open'); });

  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.style.borderColor = 'var(--accent)'; });
  dropZone.addEventListener('dragleave', () => { dropZone.style.borderColor = ''; });
  dropZone.addEventListener('drop', e => { e.preventDefault(); dropZone.style.borderColor = ''; if (e.dataTransfer.files.length) { fileInput.files = e.dataTransfer.files; fileChosen.textContent = e.dataTransfer.files[0].name; } });
  fileInput.onchange = () => { fileChosen.textContent = fileInput.files.length ? fileInput.files[0].name : ''; };

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const invoiceNumber = $('#fInvNum').value.trim();
    const amountINR = parseInt($('#fAmount').value);
    const category = $('#fCategory').value;
    if (!invoiceNumber || !amountINR || !category) { toast('Fill all required fields', 'error'); return; }

    // Show loading state on submit button
    const submitBtn = form.querySelector('button[type=submit]');
    const oldBtnText = submitBtn.innerHTML;
    submitBtn.textContent = 'Submitting...';
    submitBtn.disabled = true;

    try {
      // Upload file to Firebase Storage if provided
      let fileURL = '';
      const file = fileInput.files.length ? fileInput.files[0] : null;
      if (file) {
        toast('Uploading document...', 'info');
        fileURL = await uploadInvoiceFile(file, invoiceNumber);
      }

      const data = {
        invoiceNumber: invoiceNumber,
        supplierName: currentUser.name,
        supplierId: currentUser.uid,
        amountINR: amountINR,
        description: $('#fDesc').value.trim() || 'No description',
        category: category,
        status: 'pending',
        createdAt: nowISO(),
        fileURL: fileURL
      };
      await submitInvoice(data);
      toast(`Invoice ${data.invoiceNumber} submitted`, 'success');
      form.reset();
      fileChosen.textContent = '';
      overlay.classList.remove('open');
      renderPage();
    } catch (err) {
      console.error('Invoice submit failed:', err);
      toast('Submit failed: ' + err.message, 'error');
    } finally {
      submitBtn.innerHTML = oldBtnText;
      submitBtn.disabled = false;
    }
  });
}

// ══════ LOGOUT ══════
document.addEventListener('DOMContentLoaded', () => {
  $('#logoutBtn').onclick = async () => {
    try {
      await auth.signOut();
      localStorage.removeItem('userRole');
      $('#loginForm').reset();
      const signupForm = $('#signupForm');
      if (signupForm) signupForm.reset();
      $$('.role-option').forEach((o, i) => o.classList.toggle('active', i === 0));
      toast('Logged out', 'info');
    } catch (e) {
      toast(e.message, 'error');
    }
  };
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { $$('.overlay.open').forEach(o => o.classList.remove('open')); }
  });
});
