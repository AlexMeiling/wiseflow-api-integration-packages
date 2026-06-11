'use strict';

// ── IndexedDB ─────────────────────────────────────────────────────────────

const DB_NAME = 'fads-db';
const DB_VERSION = 1;
let db = null;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => {
      const d = e.target.result;

      const students = d.createObjectStore('students', { keyPath: 'id' });
      students.createIndex('wf_id', 'wf_id', { unique: true });
      students.createIndex('email', 'email', { unique: true });
      students.createIndex('status', 'status');
      students.createIndex('programme_code', 'programme_code');

      const exams = d.createObjectStore('exams', { keyPath: 'id' });
      exams.createIndex('exam_code', 'exam_code', { unique: true });
      exams.createIndex('status', 'status');
      exams.createIndex('faculty', 'faculty');
      exams.createIndex('flow_type', 'flow_type');

      const enrolments = d.createObjectStore('enrolments', { keyPath: 'id' });
      enrolments.createIndex('student_id', 'student_id');
      enrolments.createIndex('exam_id', 'exam_id');
      enrolments.createIndex('enrolment_status', 'enrolment_status');
      enrolments.createIndex('student_exam', ['student_id', 'exam_id'], { unique: true });

      const staff = d.createObjectStore('staff', { keyPath: 'id' });
      staff.createIndex('wf_id', 'wf_id', { unique: true });
    };
    req.onsuccess = e => { db = e.target.result; resolve(db); };
    req.onerror = e => reject(e.target.error);
  });
}

function idbReq(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = e => reject(e.target.error);
  });
}

function txStore(storeName, mode) {
  return db.transaction(storeName, mode).objectStore(storeName);
}

async function dbGetAll(storeName) {
  return idbReq(txStore(storeName, 'readonly').getAll());
}

async function dbGet(storeName, id) {
  return idbReq(txStore(storeName, 'readonly').get(id));
}

async function dbPut(storeName, obj) {
  return idbReq(txStore(storeName, 'readwrite').put(obj));
}

async function dbDelete(storeName, id) {
  return idbReq(txStore(storeName, 'readwrite').delete(id));
}

async function dbGetByIndex(storeName, indexName, value) {
  return idbReq(txStore(storeName, 'readonly').index(indexName).getAll(value));
}

async function dbCount(storeName) {
  return idbReq(txStore(storeName, 'readonly').count());
}

async function dbClear(storeName) {
  return idbReq(txStore(storeName, 'readwrite').clear());
}

// ── Random utilities ───────────────────────────────────────────────────────

function uuid() { return crypto.randomUUID(); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randomHex(n) {
  return Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}
function wfUserId() { return 'wfu-' + randomHex(8); }
function wfStaffId() { return 'wfs-' + randomHex(8); }
function wfFlowId() { return 'flw-' + randomHex(8); }
function wfParticipantId() { return 'par-' + randomHex(8); }
function wfSubmissionId() { return 'sub-' + randomHex(8); }

// POST /license/create/flow takes an integer flow-type id, not a name.
const FLOW_TYPE_IDS = { FLOWlock: 1, FLOWmulti: 2, FLOWassign: 3, FLOWhandin: 4 };
// WISEflow date fields use unixtime (seconds).
function toUnix(iso) { return Math.floor(new Date(iso).getTime() / 1000); }

function randomDate(start, end) {
  const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return d.toISOString().split('T')[0];
}

function randomDatetime(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
}

function isoNow() { return new Date().toISOString(); }

// ── Seed constants ─────────────────────────────────────────────────────────

const FIRST_NAMES_DA = [
  'Søren', 'Lars', 'Mikkel', 'Frederik', 'Emilie', 'Astrid', 'Mette', 'Peter',
  'Anders', 'Christina', 'Jens', 'Thomas', 'Maria', 'Louise', 'Niels', 'Rasmus',
  'Emma', 'Oliver', 'Sofie', 'Kasper', 'Maja', 'Magnus', 'Camilla', 'Erik',
  'Ingrid', 'Signe', 'Henrik', 'Ida', 'Hans', 'Anna', 'Viktor', 'Lotte',
  'Axel', 'Frida', 'Tobias', 'Nora', 'Christian', 'Line', 'Mathias', 'Sara',
];

const FIRST_NAMES_EN = [
  'James', 'Emma', 'William', 'Sophia', 'Noah', 'Charlotte', 'Liam', 'Amelia',
  'Michael', 'Sarah', 'David', 'Jessica', 'Daniel', 'Emily', 'Matthew', 'Lauren',
  'Andrew', 'Rachel', 'Christopher', 'Megan',
];

const LAST_NAMES_DA = [
  'Jensen', 'Nielsen', 'Hansen', 'Pedersen', 'Andersen', 'Christensen', 'Larsen',
  'Sørensen', 'Rasmussen', 'Jørgensen', 'Petersen', 'Madsen', 'Kristensen', 'Olsen',
  'Thomsen', 'Poulsen', 'Dalgaard', 'Holm', 'Berg', 'Lund', 'Kjær', 'Bak',
  'Friis', 'Møller', 'Vestergaard', 'Nygaard', 'Bruun', 'Iversen',
];

const LAST_NAMES_EN = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Davis', 'Miller', 'Wilson',
  'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris',
];

const PROGRAMMES = [
  { name: 'BSc Computer Science', code: 'BSCS', faculty: 'Faculty of Technology' },
  { name: 'BSc Business Administration', code: 'BSBIZ', faculty: 'Faculty of Business' },
  { name: 'MSc Artificial Intelligence', code: 'MSAI', faculty: 'Faculty of Technology' },
  { name: 'MSc Education Technology', code: 'MSEDT', faculty: 'Faculty of Education' },
  { name: 'BSc Mathematics', code: 'BSMAT', faculty: 'Faculty of Arts & Science' },
  { name: 'MA Digital Communication', code: 'MADC', faculty: 'Faculty of Arts & Science' },
];

const STUDENT_STATUSES = ['active', 'active', 'active', 'active', 'inactive', 'graduated', 'suspended'];

const EXAMS_TEMPLATE = [
  { code: 'CS101', name: 'Introduction to Programming',        faculty: 'Faculty of Technology',      dept: 'Computer Science'      },
  { code: 'CS201', name: 'Data Structures and Algorithms',     faculty: 'Faculty of Technology',      dept: 'Computer Science'      },
  { code: 'CS301', name: 'Software Engineering Principles',    faculty: 'Faculty of Technology',      dept: 'Computer Science'      },
  { code: 'CS401', name: 'Operating Systems',                  faculty: 'Faculty of Technology',      dept: 'Computer Science'      },
  { code: 'CS501', name: 'Distributed Systems',                faculty: 'Faculty of Technology',      dept: 'Computer Science'      },
  { code: 'BIZ101', name: 'Principles of Management',          faculty: 'Faculty of Business',        dept: 'Business Administration'},
  { code: 'BIZ201', name: 'Financial Accounting',              faculty: 'Faculty of Business',        dept: 'Business Administration'},
  { code: 'BIZ301', name: 'Marketing Strategy',                faculty: 'Faculty of Business',        dept: 'Business Administration'},
  { code: 'BIZ401', name: 'Business Ethics and Governance',    faculty: 'Faculty of Business',        dept: 'Business Administration'},
  { code: 'AI501',  name: 'Machine Learning Fundamentals',     faculty: 'Faculty of Technology',      dept: 'Artificial Intelligence'},
  { code: 'AI601',  name: 'Deep Learning and Neural Networks', faculty: 'Faculty of Technology',      dept: 'Artificial Intelligence'},
  { code: 'AI701',  name: 'AI Ethics and Society',             faculty: 'Faculty of Technology',      dept: 'Artificial Intelligence'},
  { code: 'EDT501', name: 'Learning Design Principles',        faculty: 'Faculty of Education',       dept: 'Education Technology'  },
  { code: 'EDT601', name: 'Digital Assessment Methods',        faculty: 'Faculty of Education',       dept: 'Education Technology'  },
  { code: 'EDT701', name: 'Educational Technology Research',   faculty: 'Faculty of Education',       dept: 'Education Technology'  },
  { code: 'MAT101', name: 'Calculus I',                        faculty: 'Faculty of Arts & Science',  dept: 'Mathematics'           },
  { code: 'MAT201', name: 'Linear Algebra',                    faculty: 'Faculty of Arts & Science',  dept: 'Mathematics'           },
  { code: 'MAT301', name: 'Probability and Statistics',        faculty: 'Faculty of Arts & Science',  dept: 'Mathematics'           },
  { code: 'DC501',  name: 'Digital Communication Theory',      faculty: 'Faculty of Arts & Science',  dept: 'Digital Communication' },
  { code: 'DC601',  name: 'Media Production and Strategy',     faculty: 'Faculty of Arts & Science',  dept: 'Digital Communication' },
];

const EXAM_TYPES  = ['written', 'oral', 'portfolio', 'multiple-choice', 'take-home'];
const FLOW_TYPES  = ['FLOWlock', 'FLOWmulti', 'FLOWassign', 'FLOWhandin'];
const GRADE_SCALES = ['7-point', 'pass-fail', 'ECTS'];
const EXAM_STATUSES = ['draft', 'active', 'completed', 'archived'];
const DEPARTMENTS = [
  'Computer Science', 'Business Administration', 'Artificial Intelligence',
  'Education Technology', 'Mathematics', 'Digital Communication',
];
const STAFF_ROLES = ['examiner', 'co-examiner', 'admin', 'course-coordinator'];

// ── Seed generators ────────────────────────────────────────────────────────

function generateStudent(emailMap) {
  const isDanish = Math.random() < 0.65;
  const firstName = pick(isDanish ? FIRST_NAMES_DA : FIRST_NAMES_EN);
  const lastName  = pick(isDanish ? LAST_NAMES_DA  : LAST_NAMES_EN);
  const fn = firstName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, '');
  const ln = lastName .toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, '');

  let email = `${fn}.${ln}@stud.wf.dk`;
  if (emailMap.has(email)) {
    let n = 2;
    while (emailMap.has(`${fn}.${ln}${n}@stud.wf.dk`)) n++;
    email = `${fn}.${ln}${n}@stud.wf.dk`;
  }
  emailMap.set(email, true);

  const programme   = pick(PROGRAMMES);
  const isProvisioned = Math.random() < 0.6;

  return {
    id: uuid(),
    wf_id: wfUserId(),
    first_name: firstName,
    last_name: lastName,
    email,
    programme: programme.name,
    programme_code: programme.code,
    year_of_study: rand(1, 5),
    enrolment_date: randomDate(new Date('2020-09-01'), new Date('2025-09-01')),
    status: pick(STUDENT_STATUSES),
    nationality: isDanish ? 'Danish' : pick(['Norwegian', 'Swedish', 'German', 'British', 'Dutch', 'Finnish']),
    language: isDanish ? 'da' : 'en',
    student_group: `Group ${String.fromCharCode(65 + rand(0, 5))}`,
    date_of_birth: randomDate(new Date('1995-01-01'), new Date('2006-12-31')),
    wf_provisioned: isProvisioned,
    wf_provisioned_at: isProvisioned ? randomDatetime(new Date('2024-01-01'), new Date()) : null,
    created_at: isoNow(),
  };
}

function generateExam(template) {
  const year      = pick([2025, 2026]);
  const semester  = pick(['S1', 'S2']);
  const examType  = pick(EXAM_TYPES);
  const statusRand = Math.random();
  let status, start, end;

  if (statusRand < 0.3) {
    status = 'completed';
    start  = new Date(randomDatetime(new Date('2024-01-01'), new Date('2025-12-31')));
    end    = new Date(start.getTime() + rand(2, 5) * 3600000);
  } else if (statusRand < 0.5) {
    status = 'archived';
    start  = new Date(randomDatetime(new Date('2023-01-01'), new Date('2024-06-01')));
    end    = new Date(start.getTime() + rand(2, 5) * 3600000);
  } else if (statusRand < 0.75) {
    status = 'active';
    start  = new Date(randomDatetime(new Date('2026-05-01'), new Date('2026-12-31')));
    end    = new Date(start.getTime() + rand(2, 5) * 3600000);
  } else {
    status = 'draft';
    start  = new Date(randomDatetime(new Date('2026-09-01'), new Date('2027-06-01')));
    end    = new Date(start.getTime() + rand(2, 5) * 3600000);
  }

  const isProvisioned = status !== 'draft' && Math.random() < 0.6;

  return {
    id: uuid(),
    exam_code: `${template.code}-${year}-${semester}`,
    title: `${template.name} — ${semester === 'S1' ? 'Spring' : 'Autumn'} ${year}`,
    course_code: template.code,
    course_name: template.name,
    exam_type: examType,
    flow_type: pick(FLOW_TYPES),
    faculty: template.faculty,
    department: template.dept,
    start_date: start.toISOString(),
    end_date:   end.toISOString(),
    duration_minutes: ['written', 'multiple-choice'].includes(examType) ? pick([60, 90, 120, 180, 240]) : null,
    max_participants: pick([25, 30, 40, 50, 60, 80, 100]),
    grade_scale: pick(GRADE_SCALES),
    language: pick(['da', 'en']),
    status,
    wf_flow_id:       isProvisioned ? wfFlowId() : null,
    wf_provisioned:   isProvisioned,
    wf_provisioned_at: isProvisioned ? randomDatetime(new Date('2024-06-01'), new Date()) : null,
    created_at: isoNow(),
  };
}

function generateEnrolment(studentId, examId, exam) {
  const statusRand = Math.random();
  const enrolmentStatus = statusRand < 0.84 ? 'enrolled' : (statusRand < 0.93 ? 'withdrawn' : 'no-show');
  const isProvisioned   = exam.wf_provisioned && Math.random() < 0.7;
  let grade = null, gradePassed = null, gradePassbackAt = null, submissionId = null;

  if (exam.status === 'completed' && enrolmentStatus === 'enrolled' && Math.random() < 0.75) {
    submissionId = wfSubmissionId();
    const gs = exam.grade_scale;
    if (gs === '7-point') {
      grade = pick(['12', '10', '7', '4', '02', '00', '-3']);
      gradePassed = !['00', '-3'].includes(grade);
    } else if (gs === 'ECTS') {
      grade = pick(['A', 'B', 'C', 'D', 'E', 'Fx', 'F']);
      gradePassed = !['Fx', 'F'].includes(grade);
    } else {
      grade = pick(['Pass', 'Fail']);
      gradePassed = grade === 'Pass';
    }
    gradePassbackAt = randomDatetime(new Date(exam.end_date), new Date());
  }

  return {
    id: uuid(),
    student_id: studentId,
    exam_id: examId,
    enrolment_status: enrolmentStatus,
    wf_participant_id: isProvisioned ? wfParticipantId() : null,
    wf_provisioned: isProvisioned,
    wf_provisioned_at: isProvisioned ? randomDatetime(new Date('2024-06-01'), new Date()) : null,
    grade,
    grade_passed: gradePassed,
    grade_passback_at: gradePassbackAt,
    submission_id: submissionId,
    created_at: isoNow(),
  };
}

function generateStaff() {
  const isDanish  = Math.random() < 0.6;
  const firstName = pick(isDanish ? FIRST_NAMES_DA : FIRST_NAMES_EN);
  const lastName  = pick(isDanish ? LAST_NAMES_DA  : LAST_NAMES_EN);
  const fn = firstName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, '');
  const ln = lastName .toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, '');
  const isProvisioned = Math.random() < 0.6;

  return {
    id: uuid(),
    wf_id: wfStaffId(),
    first_name: firstName,
    last_name: lastName,
    email: `${fn}.${ln}@wf.dk`,
    role: pick(STAFF_ROLES),
    department: pick(DEPARTMENTS),
    wf_provisioned: isProvisioned,
    created_at: isoNow(),
  };
}

async function seedDatabase() {
  const emailMap  = new Map();
  const students  = Array.from({ length: 80 }, () => generateStudent(emailMap));
  const exams     = EXAMS_TEMPLATE.map(t => generateExam(t));
  const staffList = Array.from({ length: 15 }, generateStaff);

  const enrolSet  = new Set();
  const enrolments = [];
  for (const s of students) {
    const n = rand(2, 4);
    const shuffled = [...exams].sort(() => Math.random() - 0.5).slice(0, n);
    for (const e of shuffled) {
      const key = `${s.id}|${e.id}`;
      if (!enrolSet.has(key)) {
        enrolSet.add(key);
        enrolments.push(generateEnrolment(s.id, e.id, e));
      }
    }
  }

  for (const r of students)  await dbPut('students',   r);
  for (const r of exams)     await dbPut('exams',      r);
  for (const r of enrolments) await dbPut('enrolments', r);
  for (const r of staffList)  await dbPut('staff',      r);
}

// ── App state ──────────────────────────────────────────────────────────────

const state = {
  activeTab: 'students',
  students:  [],
  exams:     [],
  enrolments: [],
  studentsSearch: '',
  examsSearch: '',
  enrolmentsExamFilter: '',
  apiLog: [],
  sim: { running: false, token: 0, stages: [], sample: null },
  df:  { running: false, token: 0, stages: [], sample: null },
};

// ── UI helpers ─────────────────────────────────────────────────────────────

function escHtml(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function provisionedBadge(yes) {
  return yes
    ? `<span class="badge badge-provisioned">✓ Provisioned</span>`
    : `<span class="badge badge-pending">○ Pending</span>`;
}

function statusBadge(s) {
  const cls = {
    active: 'badge-active', enrolled: 'badge-active', completed: 'badge-completed',
    graduated: 'badge-completed', archived: 'badge-archived',
    draft: 'badge-draft', inactive: 'badge-draft',
    withdrawn: 'badge-warning', suspended: 'badge-warning',
    'no-show': 'badge-error',
  }[s] || 'badge-draft';
  return `<span class="badge ${cls}">${escHtml(s)}</span>`;
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
}

function formatDatetime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
}

function syntaxHighlight(obj) {
  const str = typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2);
  return escHtml(str).replace(
    /(&quot;[^&]*&quot;\s*:)|(&quot;[^&]*&quot;)|(\b-?\d+(?:\.\d+)?\b)|\b(true|false|null)\b/g,
    (m, key, str2, num, kw) => {
      if (key)  return `<span class="jk">${m}</span>`;
      if (str2) return `<span class="js">${m}</span>`;
      if (num)  return `<span class="jn">${m}</span>`;
      if (kw)   return `<span class="jb">${m}</span>`;
      return m;
    }
  );
}

// ── Toast ──────────────────────────────────────────────────────────────────

function toast(msg, type = 'success') {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = msg;
  container.appendChild(el);
  requestAnimationFrame(() => el.classList.add('toast-show'));
  setTimeout(() => {
    el.classList.remove('toast-show');
    setTimeout(() => el.remove(), 300);
  }, 3500);
}

// ── Stats ──────────────────────────────────────────────────────────────────

async function updateStats() {
  const [s, e, en, st] = await Promise.all([
    dbCount('students'), dbCount('exams'), dbCount('enrolments'), dbCount('staff'),
  ]);
  document.getElementById('stat-students').textContent   = s;
  document.getElementById('stat-exams').textContent      = e;
  document.getElementById('stat-enrolments').textContent = en;
  document.getElementById('stat-staff').textContent      = st;
}

// ── Tabs ───────────────────────────────────────────────────────────────────

function setupTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
}

function switchTab(tab) {
  state.activeTab = tab;
  document.querySelectorAll('.tab-btn').forEach(b => {
    const selected = b.dataset.tab === tab;
    b.classList.toggle('active', selected);
    b.setAttribute('aria-selected', selected ? 'true' : 'false');
  });
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === `tab-${tab}`));
  if (tab === 'students')    renderStudentsTab();
  if (tab === 'exams')       renderExamsTab();
  if (tab === 'enrolments')  renderEnrolmentsTab();
  if (tab === 'api-console') renderApiConsole();
  if (tab === 'simulation')  renderSimulation();
  if (tab === 'dataflow')    renderDataflow();
}

// ── Drawer ─────────────────────────────────────────────────────────────────

function openDrawer(title, html) {
  document.getElementById('drawer-title').textContent = title;
  document.getElementById('drawer-body').innerHTML    = html;
  document.getElementById('drawer').classList.add('open');
  document.getElementById('drawer-overlay').classList.add('open');
}

function closeDrawer() {
  document.getElementById('drawer').classList.remove('open');
  document.getElementById('drawer-overlay').classList.remove('open');
}

// ── Modal ──────────────────────────────────────────────────────────────────

function openModal(title, html, onConfirm) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML    = html;
  document.getElementById('modal').classList.add('open');
  document.getElementById('modal-confirm').onclick = async () => {
    try { await onConfirm(); closeModal(); }
    catch (err) { toast(`Error: ${err.message}`, 'error'); }
  };
}

function closeModal() {
  document.getElementById('modal').classList.remove('open');
}

// ── STUDENTS TAB ───────────────────────────────────────────────────────────

async function renderStudentsTab() {
  state.students = await dbGetAll('students');
  let rows = [...state.students];

  if (state.studentsSearch) {
    const q = state.studentsSearch.toLowerCase();
    rows = rows.filter(s =>
      s.first_name.toLowerCase().includes(q) ||
      s.last_name.toLowerCase().includes(q)  ||
      s.email.toLowerCase().includes(q)       ||
      s.wf_id.toLowerCase().includes(q)       ||
      s.programme.toLowerCase().includes(q)
    );
  }

  rows.sort((a, b) => a.last_name.localeCompare(b.last_name) || a.first_name.localeCompare(b.first_name));

  document.getElementById('students-tbody').innerHTML = rows.length ? rows.map(s => `
    <tr>
      <td><code class="id-code">${escHtml(s.wf_id)}</code></td>
      <td>${escHtml(s.first_name)} ${escHtml(s.last_name)}</td>
      <td class="td-email">${escHtml(s.email)}</td>
      <td>${escHtml(s.programme)}</td>
      <td>${s.year_of_study}</td>
      <td>${statusBadge(s.status)}</td>
      <td>${provisionedBadge(s.wf_provisioned)}</td>
      <td class="td-actions">
        <button class="btn-sm btn-ghost" onclick="viewStudent('${s.id}')">View</button>
        <button class="btn-sm btn-ghost" onclick="editStudentModal('${s.id}')">Edit</button>
        ${!s.wf_provisioned ? `<button class="btn-sm btn-provision" onclick="provisionStudent('${s.id}')">Provision →</button>` : ''}
        <button class="btn-sm btn-danger" onclick="deleteStudent('${s.id}')">Delete</button>
      </td>
    </tr>`).join('') : '<tr><td colspan="8" class="empty-row">No students found</td></tr>';

  document.getElementById('students-count').textContent = `${rows.length} of ${state.students.length}`;
}

async function viewStudent(id) {
  const s  = await dbGet('students', id);
  const ens = await dbGetByIndex('enrolments', 'student_id', id);
  const details = await Promise.all(ens.map(async en => {
    const exam = await dbGet('exams', en.exam_id);
    return { ...en, examTitle: exam?.title ?? '—', examCode: exam?.exam_code ?? '—' };
  }));

  openDrawer(`${s.first_name} ${s.last_name}`, `
    <div class="detail-grid">
      <div class="detail-item"><label>WF-ID</label><code class="id-code">${escHtml(s.wf_id)}</code></div>
      <div class="detail-item"><label>Name</label><span>${escHtml(s.first_name)} ${escHtml(s.last_name)}</span></div>
      <div class="detail-item"><label>Email</label><span>${escHtml(s.email)}</span></div>
      <div class="detail-item"><label>Programme</label><span>${escHtml(s.programme)} (${escHtml(s.programme_code)})</span></div>
      <div class="detail-item"><label>Year</label><span>${s.year_of_study}</span></div>
      <div class="detail-item"><label>Status</label>${statusBadge(s.status)}</div>
      <div class="detail-item"><label>Group</label><span>${escHtml(s.student_group)}</span></div>
      <div class="detail-item"><label>Nationality</label><span>${escHtml(s.nationality)}</span></div>
      <div class="detail-item"><label>Language</label><span>${escHtml(s.language)}</span></div>
      <div class="detail-item"><label>Date of birth</label><span>${formatDate(s.date_of_birth)}</span></div>
      <div class="detail-item"><label>Enrolled</label><span>${formatDate(s.enrolment_date)}</span></div>
      <div class="detail-item"><label>WF Provisioned</label>${provisionedBadge(s.wf_provisioned)}</div>
      ${s.wf_provisioned_at ? `<div class="detail-item"><label>Provisioned at</label><span>${formatDatetime(s.wf_provisioned_at)}</span></div>` : ''}
    </div>
    <h3 class="drawer-section-title">Enrolments (${ens.length})</h3>
    <table class="data-table data-table-sm">
      <thead><tr><th>Code</th><th>Exam</th><th>Status</th><th>Grade</th></tr></thead>
      <tbody>${details.length ? details.map(en => `
        <tr>
          <td><code class="id-code">${escHtml(en.examCode)}</code></td>
          <td>${escHtml(en.examTitle)}</td>
          <td>${statusBadge(en.enrolment_status)}</td>
          <td>${en.grade ? `<strong>${escHtml(en.grade)}</strong>` : '—'}</td>
        </tr>`).join('') : '<tr><td colspan="4" class="empty-row">No enrolments</td></tr>'}
      </tbody>
    </table>
  `);
}

async function provisionStudent(id) {
  try {
    const s = await dbGet('students', id);
    s.wf_provisioned    = true;
    s.wf_provisioned_at = isoNow();
    await dbPut('students', s);
    // Real WISEflow: POST /license/user → { userId }
    const req = { emails: [s.email], firstName: s.first_name, lastName: s.last_name, roles: [2] };
    const res = { userId: s.wf_id };
    logApiCall('POST', '/license/user', 201, req, res);
    toast(`${s.first_name} ${s.last_name} provisioned to WISEflow`, 'success');
    await renderStudentsTab();
    await updateStats();
  } catch (err) { toast(`Error: ${err.message}`, 'error'); }
}

async function deleteStudent(id) {
  if (!confirm('Delete this student? Their enrolments will also be removed.')) return;
  try {
    const ens = await dbGetByIndex('enrolments', 'student_id', id);
    for (const en of ens) await dbDelete('enrolments', en.id);
    await dbDelete('students', id);
    toast('Student deleted', 'success');
    await renderStudentsTab();
    await updateStats();
  } catch (err) { toast(`Error: ${err.message}`, 'error'); }
}

function editStudentModal(id) {
  dbGet('students', id).then(s => {
    openModal('Edit Student', `
      <form id="edit-student-form">
        <div class="form-row"><label>First name</label><input name="first_name" value="${escHtml(s.first_name)}" required /></div>
        <div class="form-row"><label>Last name</label><input name="last_name" value="${escHtml(s.last_name)}" required /></div>
        <div class="form-row"><label>Email</label><input name="email" type="email" value="${escHtml(s.email)}" required /></div>
        <div class="form-row"><label>Status</label>
          <select name="status">${['active','inactive','graduated','suspended'].map(v =>
            `<option value="${v}"${s.status===v?' selected':''}>${v}</option>`).join('')}</select></div>
        <div class="form-row"><label>Year of study</label><input name="year_of_study" type="number" min="1" max="5" value="${s.year_of_study}" required /></div>
        <div class="form-row"><label>Language</label>
          <select name="language">
            <option value="da"${s.language==='da'?' selected':''}>Danish (da)</option>
            <option value="en"${s.language==='en'?' selected':''}>English (en)</option>
          </select></div>
      </form>`, async () => {
        const fd = new FormData(document.getElementById('edit-student-form'));
        s.first_name    = fd.get('first_name');
        s.last_name     = fd.get('last_name');
        s.email         = fd.get('email');
        s.status        = fd.get('status');
        s.year_of_study = parseInt(fd.get('year_of_study'));
        s.language      = fd.get('language');
        await dbPut('students', s);
        toast('Student updated', 'success');
        await renderStudentsTab();
      });
  });
}

function addStudentModal() {
  const emailMap = new Map(state.students.map(s => [s.email, true]));
  const ns = generateStudent(emailMap);
  openModal('Add Student', `
    <p class="form-hint">Pre-filled with random data — edit as needed.</p>
    <form id="add-student-form">
      <div class="form-row"><label>First name</label><input name="first_name" value="${escHtml(ns.first_name)}" required /></div>
      <div class="form-row"><label>Last name</label><input name="last_name" value="${escHtml(ns.last_name)}" required /></div>
      <div class="form-row"><label>Email</label><input name="email" type="email" value="${escHtml(ns.email)}" required /></div>
      <div class="form-row"><label>Programme</label>
        <select name="programme_code">${PROGRAMMES.map(p =>
          `<option value="${p.code}"${ns.programme_code===p.code?' selected':''}>${p.name}</option>`).join('')}</select></div>
      <div class="form-row"><label>Year of study</label><input name="year_of_study" type="number" min="1" max="5" value="${ns.year_of_study}" required /></div>
      <div class="form-row"><label>Status</label>
        <select name="status">${['active','inactive','graduated','suspended'].map(v =>
          `<option value="${v}"${ns.status===v?' selected':''}>${v}</option>`).join('')}</select></div>
      <div class="form-row"><label>Language</label>
        <select name="language">
          <option value="da"${ns.language==='da'?' selected':''}>Danish (da)</option>
          <option value="en"${ns.language==='en'?' selected':''}>English (en)</option>
        </select></div>
    </form>`, async () => {
      const fd = new FormData(document.getElementById('add-student-form'));
      const progCode = fd.get('programme_code');
      const prog = PROGRAMMES.find(p => p.code === progCode);
      ns.first_name       = fd.get('first_name');
      ns.last_name        = fd.get('last_name');
      ns.email            = fd.get('email');
      ns.programme        = prog.name;
      ns.programme_code   = progCode;
      ns.year_of_study    = parseInt(fd.get('year_of_study'));
      ns.status           = fd.get('status');
      ns.language         = fd.get('language');
      await dbPut('students', ns);
      toast('Student added', 'success');
      await renderStudentsTab();
      await updateStats();
    });
}

async function seedMoreStudents() {
  try {
    const emailMap = new Map(state.students.map(s => [s.email, true]));
    for (let i = 0; i < 10; i++) {
      const s = generateStudent(emailMap);
      await dbPut('students', s);
      emailMap.set(s.email, true);
    }
    toast('10 students added', 'success');
    await renderStudentsTab();
    await updateStats();
  } catch (err) { toast(`Error: ${err.message}`, 'error'); }
}

function exportStudentsJSON() {
  const blob = new Blob([JSON.stringify(state.students, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  Object.assign(document.createElement('a'), { href: url, download: 'fads-students.json' }).click();
  URL.revokeObjectURL(url);
  toast('Students exported', 'success');
}

// ── EXAMS TAB ──────────────────────────────────────────────────────────────

async function renderExamsTab() {
  state.exams = await dbGetAll('exams');
  let rows = [...state.exams];

  if (state.examsSearch) {
    const q = state.examsSearch.toLowerCase();
    rows = rows.filter(e =>
      e.exam_code.toLowerCase().includes(q) ||
      e.title.toLowerCase().includes(q)     ||
      e.faculty.toLowerCase().includes(q)   ||
      e.flow_type.toLowerCase().includes(q)
    );
  }

  rows.sort((a, b) => a.exam_code.localeCompare(b.exam_code));

  document.getElementById('exams-tbody').innerHTML = rows.length ? rows.map(e => `
    <tr>
      <td><code class="id-code">${escHtml(e.exam_code)}</code></td>
      <td class="td-title">${escHtml(e.title)}</td>
      <td><span class="badge badge-flow">${escHtml(e.flow_type)}</span></td>
      <td>${escHtml(e.exam_type)}</td>
      <td>${escHtml(e.faculty)}</td>
      <td>${statusBadge(e.status)}</td>
      <td>${formatDate(e.start_date)}</td>
      <td>${provisionedBadge(e.wf_provisioned)}</td>
      <td class="td-actions">
        <button class="btn-sm btn-ghost" onclick="viewExam('${e.id}')">View</button>
        ${!e.wf_provisioned ? `<button class="btn-sm btn-provision" onclick="provisionExam('${e.id}')">Provision →</button>` : ''}
        <button class="btn-sm btn-danger" onclick="deleteExam('${e.id}')">Delete</button>
      </td>
    </tr>`).join('') : '<tr><td colspan="9" class="empty-row">No exams found</td></tr>';

  document.getElementById('exams-count').textContent = `${rows.length} of ${state.exams.length}`;
}

async function viewExam(id) {
  const e = await dbGet('exams', id);
  const ens = await dbGetByIndex('enrolments', 'exam_id', id);
  const enrolled = ens.filter(en => en.enrolment_status === 'enrolled').length;

  openDrawer(e.title, `
    <div class="detail-grid">
      <div class="detail-item"><label>Exam code</label><code class="id-code">${escHtml(e.exam_code)}</code></div>
      <div class="detail-item"><label>Course</label><span>${escHtml(e.course_code)} — ${escHtml(e.course_name)}</span></div>
      <div class="detail-item"><label>Flow type</label><span class="badge badge-flow">${escHtml(e.flow_type)}</span></div>
      <div class="detail-item"><label>Exam type</label><span>${escHtml(e.exam_type)}</span></div>
      <div class="detail-item"><label>Faculty</label><span>${escHtml(e.faculty)}</span></div>
      <div class="detail-item"><label>Department</label><span>${escHtml(e.department)}</span></div>
      <div class="detail-item"><label>Grade scale</label><span>${escHtml(e.grade_scale)}</span></div>
      <div class="detail-item"><label>Language</label><span>${escHtml(e.language)}</span></div>
      <div class="detail-item"><label>Status</label>${statusBadge(e.status)}</div>
      <div class="detail-item"><label>Start</label><span>${formatDatetime(e.start_date)}</span></div>
      <div class="detail-item"><label>End</label><span>${formatDatetime(e.end_date)}</span></div>
      ${e.duration_minutes ? `<div class="detail-item"><label>Duration</label><span>${e.duration_minutes} min</span></div>` : ''}
      <div class="detail-item"><label>Participants</label><span>${enrolled} enrolled / ${e.max_participants} max</span></div>
      <div class="detail-item"><label>WF Flow ID</label><code class="id-code">${e.wf_flow_id || '—'}</code></div>
      <div class="detail-item"><label>WF Provisioned</label>${provisionedBadge(e.wf_provisioned)}</div>
      ${e.wf_provisioned_at ? `<div class="detail-item"><label>Provisioned at</label><span>${formatDatetime(e.wf_provisioned_at)}</span></div>` : ''}
    </div>
  `);
}

async function provisionExam(id) {
  try {
    const e = await dbGet('exams', id);
    e.wf_flow_id        = wfFlowId();
    e.wf_provisioned    = true;
    e.wf_provisioned_at = isoNow();
    await dbPut('exams', e);
    // Real WISEflow: POST /license/create/flow → { flowId }
    // followed by PATCH /flows/{id}/dates, PATCH /flows/{id}/activate (both return no data)
    const staff = await dbGetAll('staff');
    const managerId = staff[0]?.wf_id;
    logApiCall('POST', '/license/create/flow', 201,
      { title: e.title, type: FLOW_TYPE_IDS[e.flow_type] ?? 1, managers: [managerId] },
      { flowId: e.wf_flow_id });
    logApiCall('PATCH', `/flows/${e.wf_flow_id}/dates`, 200,
      { participation: { start: toUnix(e.start_date), end: toUnix(e.end_date) },
        marking: { end: toUnix(e.end_date) + 14 * 86400 } },
      null);
    logApiCall('PATCH', `/flows/${e.wf_flow_id}/activate`, 200, null, null);
    toast(`Exam ${e.exam_code} provisioned (${e.wf_flow_id})`, 'success');
    await renderExamsTab();
    await updateStats();
  } catch (err) { toast(`Error: ${err.message}`, 'error'); }
}

async function deleteExam(id) {
  if (!confirm('Delete this exam? All enrolments for it will also be removed.')) return;
  try {
    const ens = await dbGetByIndex('enrolments', 'exam_id', id);
    for (const en of ens) await dbDelete('enrolments', en.id);
    await dbDelete('exams', id);
    toast('Exam deleted', 'success');
    await renderExamsTab();
    await updateStats();
  } catch (err) { toast(`Error: ${err.message}`, 'error'); }
}

function addExamModal() {
  const t  = pick(EXAMS_TEMPLATE);
  const ne = generateExam(t);
  openModal('Add Exam', `
    <p class="form-hint">Pre-filled with random data — edit as needed.</p>
    <form id="add-exam-form">
      <div class="form-row"><label>Exam code</label><input name="exam_code" value="${escHtml(ne.exam_code)}" required /></div>
      <div class="form-row"><label>Title</label><input name="title" value="${escHtml(ne.title)}" required /></div>
      <div class="form-row"><label>Flow type</label>
        <select name="flow_type">${FLOW_TYPES.map(v => `<option value="${v}"${ne.flow_type===v?' selected':''}>${v}</option>`).join('')}</select></div>
      <div class="form-row"><label>Exam type</label>
        <select name="exam_type">${EXAM_TYPES.map(v => `<option value="${v}"${ne.exam_type===v?' selected':''}>${v}</option>`).join('')}</select></div>
      <div class="form-row"><label>Grade scale</label>
        <select name="grade_scale">${GRADE_SCALES.map(v => `<option value="${v}"${ne.grade_scale===v?' selected':''}>${v}</option>`).join('')}</select></div>
      <div class="form-row"><label>Status</label>
        <select name="status">${EXAM_STATUSES.map(v => `<option value="${v}"${ne.status===v?' selected':''}>${v}</option>`).join('')}</select></div>
      <div class="form-row"><label>Faculty</label>
        <select name="faculty">${['Faculty of Technology','Faculty of Business','Faculty of Education','Faculty of Arts & Science'].map(v =>
          `<option value="${v}"${ne.faculty===v?' selected':''}>${v}</option>`).join('')}</select></div>
      <div class="form-row"><label>Language</label>
        <select name="language">
          <option value="da"${ne.language==='da'?' selected':''}>Danish (da)</option>
          <option value="en"${ne.language==='en'?' selected':''}>English (en)</option>
        </select></div>
    </form>`, async () => {
      const fd = new FormData(document.getElementById('add-exam-form'));
      ne.exam_code   = fd.get('exam_code');
      ne.title       = fd.get('title');
      ne.flow_type   = fd.get('flow_type');
      ne.exam_type   = fd.get('exam_type');
      ne.grade_scale = fd.get('grade_scale');
      ne.status      = fd.get('status');
      ne.faculty     = fd.get('faculty');
      ne.language    = fd.get('language');
      await dbPut('exams', ne);
      toast('Exam added', 'success');
      await renderExamsTab();
      await updateStats();
    });
}

// ── ENROLMENTS TAB ─────────────────────────────────────────────────────────

async function renderEnrolmentsTab() {
  [state.enrolments, state.students, state.exams] = await Promise.all([
    dbGetAll('enrolments'), dbGetAll('students'), dbGetAll('exams'),
  ]);

  const stuMap  = Object.fromEntries(state.students.map(s => [s.id, s]));
  const examMap = Object.fromEntries(state.exams.map(e  => [e.id, e]));

  const sel = document.getElementById('enrol-exam-filter');
  if (sel) {
    const cur = sel.value;
    sel.innerHTML = '<option value="">All exams</option>' +
      state.exams.map(e => `<option value="${e.id}"${cur===e.id?' selected':''}>${escHtml(e.exam_code)} — ${escHtml(e.title)}</option>`).join('');
  }

  let rows = state.enrolments
    .map(en => ({ ...en, stu: stuMap[en.student_id], exam: examMap[en.exam_id] }))
    .filter(en => en.stu && en.exam);

  if (state.enrolmentsExamFilter) rows = rows.filter(en => en.exam_id === state.enrolmentsExamFilter);

  document.getElementById('enrolments-tbody').innerHTML = rows.length ? rows.map(en => `
    <tr>
      <td>${escHtml(en.stu.first_name)} ${escHtml(en.stu.last_name)}</td>
      <td><code class="id-code">${escHtml(en.exam.exam_code)}</code></td>
      <td class="td-title">${escHtml(en.exam.title)}</td>
      <td>${statusBadge(en.enrolment_status)}</td>
      <td>${provisionedBadge(en.wf_provisioned)}</td>
      <td>${en.grade ? `<strong>${escHtml(en.grade)}</strong>` : '—'}</td>
      <td>${en.grade_passed === true ? '<span class="badge badge-active">Pass</span>' : en.grade_passed === false ? '<span class="badge badge-error">Fail</span>' : '—'}</td>
      <td class="td-actions">
        ${!en.wf_provisioned ? `<button class="btn-sm btn-provision" onclick="syncEnrolment('${en.id}')">Sync →</button>` : ''}
        <button class="btn-sm btn-ghost" onclick="passbackGrade('${en.id}')">Grade</button>
        <button class="btn-sm btn-danger" onclick="deleteEnrolment('${en.id}')">Del</button>
      </td>
    </tr>`).join('') : '<tr><td colspan="8" class="empty-row">No enrolments found</td></tr>';

  document.getElementById('enrolments-count').textContent = `${rows.length} enrolments`;
}

async function syncEnrolment(id) {
  try {
    const en   = await dbGet('enrolments', id);
    const exam = await dbGet('exams', en.exam_id);
    const stu  = await dbGet('students', en.student_id);
    if (!exam?.wf_flow_id) { toast('Exam must be provisioned to WISEflow first', 'error'); return; }
    const participantId = wfParticipantId();
    en.wf_participant_id  = participantId;
    en.wf_provisioned     = true;
    en.wf_provisioned_at  = isoNow();
    await dbPut('enrolments', en);
    // Real WISEflow: POST /flows/{flowId}/participants with an array of { userId }
    logApiCall('POST', `/flows/${exam.wf_flow_id}/participants`, 201,
      [{ userId: stu.wf_id }],
      [{ participant: { id: participantId }, user: { id: stu.wf_id, firstName: stu.first_name, lastName: stu.last_name, emails: [stu.email] } }]);
    toast(`Enrolment synced (${participantId})`, 'success');
    await renderEnrolmentsTab();
  } catch (err) { toast(`Error: ${err.message}`, 'error'); }
}

async function syncAllUnprovisioned() {
  try {
    const ens  = await dbGetAll('enrolments');
    let count  = 0;
    for (const en of ens) {
      if (en.wf_provisioned) continue;
      const exam = await dbGet('exams', en.exam_id);
      if (!exam?.wf_flow_id) continue;
      en.wf_participant_id  = wfParticipantId();
      en.wf_provisioned     = true;
      en.wf_provisioned_at  = isoNow();
      await dbPut('enrolments', en);
      count++;
    }
    toast(`${count} enrolments synced`, 'success');
    await renderEnrolmentsTab();
  } catch (err) { toast(`Error: ${err.message}`, 'error'); }
}

function passbackGrade(id) {
  Promise.all([dbGet('enrolments', id)]).then(async ([en]) => {
    const exam = await dbGet('exams', en.exam_id);
    const opts = exam.grade_scale === '7-point'  ? ['12','10','7','4','02','00','-3'] :
                 exam.grade_scale === 'ECTS'      ? ['A','B','C','D','E','Fx','F'] :
                                                   ['Pass','Fail'];
    openModal('Passback Grade', `
      <p class="form-hint">Grade scale: <strong>${escHtml(exam.grade_scale)}</strong></p>
      <form id="grade-form">
        <div class="form-row"><label>Grade</label>
          <select name="grade">${opts.map(g => `<option value="${g}"${en.grade===g?' selected':''}>${g}</option>`).join('')}</select>
        </div>
      </form>`, async () => {
        const grade = new FormData(document.getElementById('grade-form')).get('grade');
        const gs = exam.grade_scale;
        const passed = gs==='7-point' ? !['00','-3'].includes(grade) :
                       gs==='ECTS'    ? !['Fx','F'].includes(grade) :
                                        grade === 'Pass';
        en.grade           = grade;
        en.grade_passed    = passed;
        en.grade_passback_at = isoNow();
        if (!en.submission_id) en.submission_id = wfSubmissionId();
        await dbPut('enrolments', en);
        // WISEflow has no grade-push endpoint — grades are pulled. Log the GET the SIS uses to read marks.
        const staff = await dbGetAll('staff');
        logApiCall('GET', `/flows/${exam.wf_flow_id||'unprovisioned'}/participants/${en.wf_participant_id||'par-unsynced'}/item-based-marks`, 200,
          null,
          buildItemMarks(staff[0]?.wf_id));
        toast(`Grade "${grade}" recorded in FADS`, 'success');
        await renderEnrolmentsTab();
      });
  });
}

async function passbackAllGrades() {
  try {
    const ens = await dbGetAll('enrolments');
    let count = 0;
    for (const en of ens) {
      if (en.grade || en.enrolment_status !== 'enrolled') continue;
      const exam = await dbGet('exams', en.exam_id);
      if (!exam) continue;
      const gs = exam.grade_scale;
      let grade, passed;
      if (gs === '7-point') { grade = pick(['12','10','7','4','02','00','-3']); passed = !['00','-3'].includes(grade); }
      else if (gs === 'ECTS') { grade = pick(['A','B','C','D','E','Fx','F']); passed = !['Fx','F'].includes(grade); }
      else { grade = pick(['Pass','Fail']); passed = grade === 'Pass'; }
      en.grade = grade; en.grade_passed = passed; en.grade_passback_at = isoNow();
      if (!en.submission_id) en.submission_id = wfSubmissionId();
      await dbPut('enrolments', en);
      count++;
    }
    toast(`${count} grades passed back`, 'success');
    await renderEnrolmentsTab();
  } catch (err) { toast(`Error: ${err.message}`, 'error'); }
}

async function deleteEnrolment(id) {
  try {
    await dbDelete('enrolments', id);
    toast('Enrolment deleted', 'success');
    await renderEnrolmentsTab();
    await updateStats();
  } catch (err) { toast(`Error: ${err.message}`, 'error'); }
}

function enrolStudentModal() {
  openModal('Enrol Student', `
    <form id="enrol-form">
      <div class="form-row"><label>Student</label>
        <select name="student_id" required>
          <option value="">— Select student —</option>
          ${state.students.map(s => `<option value="${s.id}">${escHtml(s.first_name)} ${escHtml(s.last_name)} · ${escHtml(s.wf_id)}</option>`).join('')}
        </select></div>
      <div class="form-row"><label>Exam</label>
        <select name="exam_id" required>
          <option value="">— Select exam —</option>
          ${state.exams.map(e => `<option value="${e.id}">${escHtml(e.exam_code)} — ${escHtml(e.title)}</option>`).join('')}
        </select></div>
    </form>`, async () => {
      const fd = new FormData(document.getElementById('enrol-form'));
      const studentId = fd.get('student_id');
      const examId    = fd.get('exam_id');
      if (!studentId || !examId) { toast('Select both student and exam', 'error'); return; }
      const existing = await dbGetByIndex('enrolments', 'student_id', studentId);
      if (existing.some(en => en.exam_id === examId)) { toast('Student already enrolled in this exam', 'error'); return; }
      const exam = await dbGet('exams', examId);
      const en = generateEnrolment(studentId, examId, exam);
      en.enrolment_status = 'enrolled'; en.wf_provisioned = false; en.wf_provisioned_at = null;
      await dbPut('enrolments', en);
      toast('Student enrolled', 'success');
      await renderEnrolmentsTab();
      await updateStats();
    });
}

// ── API LOG ────────────────────────────────────────────────────────────────

const MOCK_TOKEN = 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJ3aXNlZmxvdy5uZXQiLCJzdWIiOiJ3ZnUtYTNmOTJjMTEiLCJpYXQiOjE3NDg2OTAwMDB9...';

function logApiCall(method, endpoint, status, reqBody, resBody) {
  state.apiLog.unshift({ ts: isoNow(), method, endpoint, status, reqBody, resBody });
  if (state.apiLog.length > 10) state.apiLog.pop();
  if (state.activeTab === 'api-console') renderApiLog();
}

function renderApiLog() {
  const el = document.getElementById('api-log');
  if (!el) return;
  if (!state.apiLog.length) {
    el.innerHTML = '<div class="log-empty">No API calls yet — use the workflows above or the Provision buttons in the other tabs.</div>';
    return;
  }
  el.innerHTML = state.apiLog.map(entry => `
    <div class="log-entry">
      <span class="log-ts">${new Date(entry.ts).toLocaleTimeString('en-GB')}</span>
      <span class="method-badge method-${entry.method.toLowerCase()}">${entry.method}</span>
      <span class="log-endpoint">${escHtml(entry.endpoint)}</span>
      <span class="log-status ${entry.status < 300 ? 'log-ok' : 'log-err'}">${entry.status}</span>
    </div>`).join('');
}

// ── API CONSOLE TAB ────────────────────────────────────────────────────────

async function renderApiConsole() {
  [state.students, state.exams, state.enrolments] = await Promise.all([
    dbGetAll('students'), dbGetAll('exams'), dbGetAll('enrolments'),
  ]);

  // W1 — show unprovisioned students; auto-check first 3 and build preview
  const w1el = document.getElementById('api-w1-students');
  if (w1el) {
    const unprovisioned = state.students.filter(s => !s.wf_provisioned).slice(0, 12);
    w1el.innerHTML = unprovisioned.length ? unprovisioned.map((s, i) => `
      <label class="checkbox-row">
        <input type="checkbox" name="student" value="${s.id}" onchange="buildW1Preview()"${i < 3 ? ' checked' : ''} />
        ${escHtml(s.first_name)} ${escHtml(s.last_name)}
        <code class="id-code">${escHtml(s.wf_id)}</code>
      </label>`).join('') : '<p class="empty-note">All students already provisioned ✓</p>';
    // Auto-build preview with pre-checked students
    if (unprovisioned.length) buildW1Preview();
  }

  // WFP — unprovisioned exams for Flow Provisioning
  const wfpSel = document.getElementById('api-wfp-exam');
  if (wfpSel) {
    const unprovExams = state.exams.filter(e => !e.wf_provisioned);
    const cur = wfpSel.value || (unprovExams[0]?.id ?? '');
    wfpSel.innerHTML = '<option value="">— Select unprovisioned exam —</option>' +
      unprovExams.map(e =>
        `<option value="${e.id}"${cur===e.id?' selected':''}>${escHtml(e.exam_code)} — ${escHtml(e.title)}</option>`).join('');
    if (cur) loadWfpFlow();
  }

  // W2 — provisioned exams; auto-select first if nothing chosen yet
  const w2sel = document.getElementById('api-w2-exam');
  if (w2sel) {
    const provExams = state.exams.filter(e => e.wf_provisioned);
    const cur = w2sel.value || (provExams[0]?.id ?? '');
    w2sel.innerHTML = '<option value="">— Select provisioned exam —</option>' +
      provExams.map(e =>
        `<option value="${e.id}"${cur===e.id?' selected':''}>${escHtml(e.exam_code)} — ${escHtml(e.title)}</option>`).join('');
    if (cur) loadW2Participants();
  }

  // W3 — completed provisioned exams; auto-select first if nothing chosen yet
  const w3sel = document.getElementById('api-w3-exam');
  if (w3sel) {
    const compExams = state.exams.filter(e => e.wf_provisioned && e.status === 'completed');
    const cur = w3sel.value || (compExams[0]?.id ?? '');
    w3sel.innerHTML = '<option value="">— Select completed exam with grades —</option>' +
      compExams.map(e =>
        `<option value="${e.id}"${cur===e.id?' selected':''}>${escHtml(e.exam_code)} — ${escHtml(e.title)}</option>`).join('');
    if (cur) loadW3Grades();
  }

  renderApiLog();
}

// ── Workflow: Flow Provisioning ────────────────────────────────────────────

async function loadWfpFlow() {
  const examId = document.getElementById('api-wfp-exam')?.value;
  if (!examId) return;
  const exam = await dbGet('exams', examId);
  const staff = await dbGetAll('staff');
  const managerId = staff[0]?.wf_id;
  const flowId = exam.wf_flow_id || ('flw-' + randomHex(8));

  document.getElementById('api-wfp-info').textContent =
    `${exam.flow_type} · ${exam.language?.toUpperCase() ?? 'DA'} · ${exam.status}`;

  // Step 1: Create flow
  document.getElementById('api-wfp-create-url').textContent = 'POST /license/create/flow';
  setCode('api-wfp-create-request', { title: exam.title, type: FLOW_TYPE_IDS[exam.flow_type] ?? 1, managers: [managerId] });
  setCode('api-wfp-create-response', { flowId });

  // Step 2: Set dates (unixtime; returns no data)
  document.getElementById('api-wfp-dates-url').textContent = `PATCH /flows/${flowId}/dates`;
  setCode('api-wfp-dates-request', { participation: { start: toUnix(exam.start_date), end: toUnix(exam.end_date) },
    marking: { end: toUnix(exam.end_date) + 14 * 86400 } });
  setCode('api-wfp-dates-response', null);

  // Step 3: Activate (empty body; returns no data)
  document.getElementById('api-wfp-activate-url').textContent = `PATCH /flows/${flowId}/activate`;
  setCode('api-wfp-activate-request', null);
  setCode('api-wfp-activate-response', null);
}

async function sendWfp() {
  const examId = document.getElementById('api-wfp-exam')?.value;
  if (!examId) { toast('Select an exam to provision', 'error'); return; }
  const exam = await dbGet('exams', examId);
  if (exam.wf_provisioned) { toast('Exam already provisioned', 'warn'); return; }

  const staff = await dbGetAll('staff');
  const managerId = staff[0]?.wf_id;
  exam.wf_flow_id        = wfFlowId();
  exam.wf_provisioned    = true;
  exam.wf_provisioned_at = isoNow();
  await dbPut('exams', exam);

  logApiCall('POST', '/license/create/flow', 201,
    { title: exam.title, type: FLOW_TYPE_IDS[exam.flow_type] ?? 1, managers: [managerId] },
    { flowId: exam.wf_flow_id });
  logApiCall('PATCH', `/flows/${exam.wf_flow_id}/dates`, 200,
    { participation: { start: toUnix(exam.start_date), end: toUnix(exam.end_date) },
      marking: { end: toUnix(exam.end_date) + 14 * 86400 } },
    null);
  logApiCall('PATCH', `/flows/${exam.wf_flow_id}/activate`, 200, null, null);

  setCode('api-wfp-activate-response', null);
  toast(`"${exam.title}" provisioned in WISEflow`, 'success');
  await renderApiConsole();
  await updateStats();
}

function buildW1Preview() {
  const ids = Array.from(document.querySelectorAll('#api-w1-students input:checked')).map(cb => cb.value);
  if (!ids.length) {
    setCode('api-w1-request', '// Select students above to preview request');
    setCode('api-w1-response', '// Response will appear here');
    document.getElementById('api-w1-url').textContent = 'POST /license/user';
    return;
  }
  // Real WISEflow: one POST /license/user call per user, body = { emails, firstName, lastName, roles }
  const stus = state.students.filter(s => ids.includes(s.id));
  const first = stus[0];
  document.getElementById('api-w1-url').textContent =
    `POST /license/user  ${stus.length > 1 ? `(×${stus.length} calls, showing first)` : ''}`;
  setCode('api-w1-request', { emails: [first.email], firstName: first.first_name, lastName: first.last_name, roles: [2] });
  // Show preview response immediately (real shape: { userId })
  setCode('api-w1-response', { userId: first.wf_id });
}

async function sendW1() {
  const ids = Array.from(document.querySelectorAll('#api-w1-students input:checked')).map(cb => cb.value);
  if (!ids.length) { toast('Select at least one student', 'error'); return; }
  const stus = state.students.filter(s => ids.includes(s.id));
  // Real WISEflow: one POST /license/user call per user
  for (const s of stus) { s.wf_provisioned = true; s.wf_provisioned_at = isoNow(); await dbPut('students', s); }
  const last = stus[stus.length - 1];
  logApiCall('POST', '/license/user', 201,
    { emails: [last.email], firstName: last.first_name, lastName: last.last_name, roles: [2] },
    { userId: last.wf_id });
  setCode('api-w1-response', stus.length === 1
    ? { userId: stus[0].wf_id }
    : stus.map(s => ({ userId: s.wf_id })));
  toast(`${stus.length} user(s) provisioned to WISEflow`, 'success');
  await renderApiConsole();
  await updateStats();
}

async function loadW2Participants() {
  const examId = document.getElementById('api-w2-exam').value;
  if (!examId) return;
  const exam = await dbGet('exams', examId);
  const ens  = await dbGetByIndex('enrolments', 'exam_id', examId);
  const unsynced = ens.filter(en => !en.wf_provisioned && en.enrolment_status === 'enrolled');
  const stuMap = Object.fromEntries(state.students.map(s => [s.id, s]));
  // Real WISEflow: POST /flows/{flowId}/participants with an array of { userId }
  const first = unsynced[0];
  const firstStu = first ? stuMap[first.student_id] : null;
  document.getElementById('api-w2-url').textContent = `POST /flows/${exam.wf_flow_id}/participants`;
  document.getElementById('api-w2-info').textContent = `${unsynced.length} unsynced enrolment${unsynced.length!==1?'s':''}`;
  setCode('api-w2-request', firstStu ? [{ userId: firstStu.wf_id }] : '// No unsynced enrolments');
  // Preview response immediately with real WISEflow shape (unwrapped data array)
  setCode('api-w2-response', firstStu
    ? [{ participant: { id: 'par-' + randomHex(8) }, user: { id: firstStu.wf_id, firstName: firstStu.first_name, lastName: firstStu.last_name, emails: [firstStu.email] } }]
    : '// All enrolments already synced');
}

async function sendW2() {
  const examId = document.getElementById('api-w2-exam').value;
  if (!examId) { toast('Select an exam', 'error'); return; }
  const exam   = await dbGet('exams', examId);
  const ens    = await dbGetByIndex('enrolments', 'exam_id', examId);
  const unsynced = ens.filter(en => !en.wf_provisioned && en.enrolment_status === 'enrolled');
  const stuMap = Object.fromEntries(state.students.map(s => [s.id, s]));
  // Real WISEflow accepts an array of users in one POST and returns a matching data array.
  const resData = [];
  for (const en of unsynced) {
    en.wf_participant_id = wfParticipantId();
    en.wf_provisioned    = true;
    en.wf_provisioned_at = isoNow();
    await dbPut('enrolments', en);
    const stu = stuMap[en.student_id];
    resData.push({ participant: { id: en.wf_participant_id }, user: { id: stu?.wf_id, firstName: stu?.first_name, lastName: stu?.last_name, emails: stu ? [stu.email] : [] } });
  }
  if (resData.length) {
    logApiCall('POST', `/flows/${exam.wf_flow_id}/participants`, 201,
      unsynced.map(en => ({ userId: stuMap[en.student_id]?.wf_id })), resData);
  }
  setCode('api-w2-response', resData.length ? resData : '// All enrolments already synced');
  toast(`${unsynced.length} participants synced`, 'success');
  await renderApiConsole();
}

// Real item-based-marks returns an array of per-item scores; the SIS aggregates them.
function buildItemMarks(assessorId) {
  const n = rand(3, 5);
  return Array.from({ length: n }, (_, i) => ({
    isAutoScored: false,
    deactivated: false,
    itemNumber: i + 1,
    assessorId,
    reference: `item-${i + 1}`,
    score: rand(0, 10),
    state: 'SCORED',
  }));
}

function buildSubmission(en) {
  return {
    id: en.submission_id,
    status: { handedIn: true, handedInBlank: false, handedInDate: en.grade_passback_at || isoNow(), handedInIp: null },
    similarityReports: [],
  };
}

// W3: SIS pulls grades FROM WISEflow using GET /submissions + GET /item-based-marks
async function loadW3Grades() {
  const examId = document.getElementById('api-w3-exam').value;
  if (!examId) return;
  const exam  = await dbGet('exams', examId);
  const ens   = await dbGetByIndex('enrolments', 'exam_id', examId);
  const staff = await dbGetAll('staff');
  const assessorId = staff[0]?.wf_id;

  // Step A: GET /submissions — returns an array of { id, status:{handedIn,…}, similarityReports }
  const submissions = ens.filter(en => en.submission_id).map(buildSubmission);

  document.getElementById('api-w3-url').textContent = `GET /flows/${exam.wf_flow_id}/submissions`;
  document.getElementById('api-w3-info').textContent =
    `${submissions.length} submission${submissions.length!==1?'s':''}, ${ens.filter(e=>e.grade).length} graded`;
  setCode('api-w3-request', null); // GET — no body
  setCode('api-w3-response', submissions);

  // Step B: GET /item-based-marks for first graded participant — array of per-item scores
  const first = ens.find(en => en.grade && en.wf_participant_id);
  if (first) {
    document.getElementById('api-w3-marks-url').textContent =
      `GET /flows/${exam.wf_flow_id}/participants/${first.wf_participant_id}/item-based-marks`;
    setCode('api-w3-marks-response', buildItemMarks(assessorId));
  } else {
    document.getElementById('api-w3-marks-url').textContent = 'GET /flows/{flowId}/participants/{participantId}/item-based-marks';
    setCode('api-w3-marks-response', '// No graded participants yet — use the Grade button in Enrolments tab');
  }
}

async function sendW3() {
  const examId = document.getElementById('api-w3-exam').value;
  if (!examId) { toast('Select an exam', 'error'); return; }
  const exam  = await dbGet('exams', examId);
  const ens   = await dbGetByIndex('enrolments', 'exam_id', examId);
  const staff = await dbGetAll('staff');
  const assessorId = staff[0]?.wf_id;
  const graded = ens.filter(en => en.grade && en.wf_participant_id);

  // Simulate SIS polling WISEflow: GET submissions, then per-participant item-based marks
  const submissions = graded.map(buildSubmission);
  logApiCall('GET', `/flows/${exam.wf_flow_id}/submissions`, 200, null, submissions);

  if (graded.length) {
    const en = graded[0];
    logApiCall('GET', `/flows/${exam.wf_flow_id}/participants/${en.wf_participant_id}/item-based-marks`, 200, null,
      buildItemMarks(assessorId));
    // Mark as pulled
    for (const e of graded) {
      if (!e.grade_passback_at) { e.grade_passback_at = isoNow(); await dbPut('enrolments', e); }
    }
  }

  setCode('api-w3-response', submissions);
  toast(`Pulled ${graded.length} grade${graded.length!==1?'s':''} from WISEflow`, 'success');
  await renderApiConsole();
}

function setCode(id, content) {
  const el = document.getElementById(id);
  if (!el) return;
  if (typeof content === 'string') {
    el.innerHTML = `<span class="jc">${escHtml(content)}</span>`;
  } else {
    el.innerHTML = syntaxHighlight(content);
  }
}

function copyCode(id) {
  const el = document.getElementById(id);
  if (!el) return;
  navigator.clipboard.writeText(el.textContent)
    .then(() => toast('Copied to clipboard', 'success'))
    .catch(() => toast('Copy failed', 'error'));
}

// ── Simulation ───────────────────────────────────────────────────────────

function simGrade(scale) {
  if (scale === '7-point') return { grade: pick(['12', '10', '7', '4', '02']), passed: true };
  if (scale === 'ECTS')    return { grade: pick(['A', 'B', 'C', 'D', 'E']),    passed: true };
  return { grade: 'Pass', passed: true };
}

function buildSimSample() {
  const student = state.students[0];
  const exam = state.exams.find(e => e.wf_flow_id) || state.exams[0];
  if (!student || !exam) return null;
  const g = simGrade(exam.grade_scale);
  return {
    student, exam,
    userId: student.wf_id,
    flowId: exam.wf_flow_id || wfFlowId(),
    participantId: wfParticipantId(),
    submissionId: wfSubmissionId(),
    webhookId: rand(1000, 9999),
    grade: g.grade,
    passed: g.passed,
    hookUrl: 'https://fads.wfuni.edu/hooks/wiseflow',
  };
}

function buildSimStages(s) {
  const now = isoNow();
  return [
    {
      title: 'Provision user', sub: 'POST /license/user', system: 'SIS', kind: 'req', dir: 'SIS → WISEflow',
      method: 'POST', url: '/license/user', status: 201,
      request: { emails: [s.student.email], firstName: s.student.first_name, lastName: s.student.last_name, roles: [2] },
      response: { userId: s.userId },
      note: 'FADS creates the student on the WISEflow licence.',
      entity: 'user', updateLabel: `User provisioned · ${s.userId}`,
    },
    {
      title: 'Provision flow', sub: 'POST /license/create/flow', system: 'SIS', kind: 'req', dir: 'SIS → WISEflow',
      method: 'POST', url: '/license/create/flow', status: 201,
      request: { title: s.exam.title, type: FLOW_TYPE_IDS[s.exam.flow_type] ?? 1, managers: [s.userId] },
      response: { flowId: s.flowId, status: 'active' },
      note: 'Create → set dates → activate, collapsed into one stage.',
      entity: 'flow', updateLabel: `Flow created & activated · ${s.flowId}`,
    },
    {
      title: 'Enrol participant', sub: 'POST /flows/{id}/participants', system: 'SIS', kind: 'req', dir: 'SIS → WISEflow',
      method: 'POST', url: `/flows/${s.flowId}/participants`, status: 201,
      request: [{ userId: s.userId }],
      response: [{ participant: { id: s.participantId }, user: { id: s.userId, firstName: s.student.first_name, lastName: s.student.last_name, emails: [s.student.email] } }],
      note: 'The student becomes a participant on the active flow.',
      entity: 'user', updateLabel: `Participant enrolled · ${s.participantId}`,
    },
    {
      title: 'Register webhook', sub: 'POST /webhooks', system: 'SIS', kind: 'req', dir: 'SIS → WISEflow',
      method: 'POST', url: '/webhooks', status: 201,
      request: { title: 'FADS grade sync', url: s.hookUrl, secret: '••••••', active: true, events: ['PAPER_SUBMITTED', 'FINAL_GRADE'] },
      response: { id: s.webhookId, active: true, events: ['PAPER_SUBMITTED', 'FINAL_GRADE'] },
      note: 'FADS subscribes once — WISEflow now pushes events instead of FADS polling.',
      entity: 'hook', updateLabel: `Webhook registered · #${s.webhookId}`,
    },
    {
      title: 'Paper submitted', sub: 'webhook PAPER_SUBMITTED', system: 'WISEflow', kind: 'hook', dir: 'WISEflow → SIS',
      method: 'POST', url: s.hookUrl, status: 200, event: 'PAPER_SUBMITTED',
      request: { event: 'PAPER_SUBMITTED', webhookId: s.webhookId, flowId: s.flowId, participantId: s.participantId, occurredAt: now, data: { submissionId: s.submissionId, handedIn: true } },
      response: { received: true },
      note: 'The student hands in. WISEflow POSTs the event to the FADS endpoint.',
      entity: 'file', updateLabel: `Submission received · ${s.submissionId}`,
    },
    {
      title: 'Final grade', sub: 'webhook FINAL_GRADE', system: 'WISEflow', kind: 'hook', dir: 'WISEflow → SIS',
      method: 'POST', url: s.hookUrl, status: 200, event: 'FINAL_GRADE', updatesRecord: true,
      request: { event: 'FINAL_GRADE', webhookId: s.webhookId, flowId: s.flowId, participantId: s.participantId, occurredAt: now, data: { grade: s.grade, passed: s.passed, scale: s.exam.grade_scale } },
      response: { received: true },
      note: 'Grade is final. FADS reads the payload and updates the student record — no GET required.',
      entity: 'grade', updateLabel: `Grade stored in FADS · ${s.grade}`,
    },
  ];
}

async function renderSimulation() {
  [state.students, state.exams] = await Promise.all([dbGetAll('students'), dbGetAll('exams')]);
  const sample = buildSimSample();
  state.sim.sample = sample;
  state.sim.stages = sample ? buildSimStages(sample) : [];

  const track = document.getElementById('sim-track');
  if (!sample) {
    track.innerHTML = '<div class="sim-detail-empty">No seeded data — reset the database first.</div>';
    return;
  }

  const stages = state.sim.stages;
  track.innerHTML = '<div class="sim-rail">' + stages.map((st, i) => {
    const node = `
      <div class="sim-node sim-node-${st.kind}" data-node="${i}">
        <span class="sim-node-system sim-system-${st.system === 'SIS' ? 'sis' : 'wf'}">${st.system}</span>
        <div class="sim-node-dot"><span>${i + 1}</span></div>
        <div class="sim-node-title">${escHtml(st.title)}</div>
        <div class="sim-node-sub">${escHtml(st.sub)}</div>
      </div>`;
    const conn = i < stages.length - 1
      ? `<div class="sim-connector sim-connector-${stages[i + 1].kind}" data-conn="${i}"><span class="sim-packet"></span></div>`
      : '';
    return node + conn;
  }).join('') + '</div>';

  resetSimulation();
}

function renderSimRecord(graded) {
  const s = state.sim.sample;
  const el = document.getElementById('sim-record');
  if (!s) { el.innerHTML = ''; return; }
  const passLabel = ['Pass', 'Fail'].includes(s.grade) ? '' : ` · ${s.passed ? 'Pass' : 'Fail'}`;
  const gradeCell = graded
    ? `<span class="sim-grade is-updated">${escHtml(s.grade)}${passLabel}</span>`
    : `<span class="sim-grade sim-grade-awaiting">Awaiting…</span>`;
  el.innerHTML = `
    <div class="sim-record-head">FADS student record</div>
    <div class="sim-record-row"><label>Student</label><span>${escHtml(s.student.first_name)} ${escHtml(s.student.last_name)}</span></div>
    <div class="sim-record-row"><label>WF user id</label><code class="id-code">${escHtml(s.userId)}</code></div>
    <div class="sim-record-row"><label>Exam</label><span>${escHtml(s.exam.exam_code)} — ${escHtml(s.exam.title)}</span></div>
    <div class="sim-record-row"><label>Grade scale</label><span>${escHtml(s.exam.grade_scale)}</span></div>
    <div class="sim-record-row sim-record-grade"><label>Grade</label>${gradeCell}</div>`;
}

function renderSimDetail(i) {
  const st = state.sim.stages[i];
  const el = document.getElementById('sim-detail');
  const methodCls = `method-${st.method.toLowerCase()}`;
  const eventChip = st.event ? `<span class="sim-event-chip">${escHtml(st.event)}</span>` : '';
  const reqLabel = st.kind === 'hook' ? 'Event payload' : 'Request';
  el.innerHTML = `
    <div class="sim-detail-head">
      <span class="sim-dir-badge sim-dir-${st.kind}">${escHtml(st.dir)}</span>
      <span class="method-badge ${methodCls}">${st.method}</span>
      <span class="sim-detail-url">${escHtml(st.url)}</span>
      <span class="status-badge status-2xx">${st.status}</span>
      ${eventChip}
    </div>
    <p class="sim-detail-note">${escHtml(st.note)}</p>
    <div class="sim-detail-blocks">
      <div class="sim-detail-block">
        <div class="sim-detail-label">${reqLabel}</div>
        <pre class="api-code">${syntaxHighlight(st.request)}</pre>
      </div>
      <div class="sim-detail-block">
        <div class="sim-detail-label">Response</div>
        <pre class="api-code">${syntaxHighlight(st.response)}</pre>
      </div>
    </div>`;
}

function resetSimulation() {
  state.sim.token++;            // cancels any in-flight run
  state.sim.running = false;
  const track = document.getElementById('sim-track');
  if (track) {
    track.classList.add('sim-no-anim');
    track.querySelectorAll('.sim-node').forEach(n => n.classList.remove('is-active', 'is-done'));
    track.querySelectorAll('.sim-connector').forEach(c => c.classList.remove('is-flowing'));
    void track.offsetWidth;     // force reflow so packets snap back without animating
    track.classList.remove('sim-no-anim');
  }
  const detail = document.getElementById('sim-detail');
  if (detail) detail.innerHTML = '<div class="sim-detail-empty">Press <strong>Run simulation</strong> to send data down the line.</div>';
  renderSimRecord(false);
  const btn = document.getElementById('sim-run');
  if (btn) btn.disabled = false;
}

const simWait = ms => new Promise(r => setTimeout(r, ms));

async function runSimulation() {
  if (state.sim.running || !state.sim.stages.length) return;
  resetSimulation();
  const myToken = ++state.sim.token;
  state.sim.running = true;
  document.getElementById('sim-run').disabled = true;

  const speed = parseFloat(document.getElementById('sim-speed').value) || 1;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const flowDur = reduce ? 0 : Math.round(900 / speed);
  const dwell   = reduce ? 250 : Math.round(850 / speed);

  const track = document.getElementById('sim-track');
  track.style.setProperty('--sim-flow', flowDur + 'ms');
  const nodes = [...track.querySelectorAll('.sim-node')];
  const conns = [...track.querySelectorAll('.sim-connector')];

  for (let i = 0; i < state.sim.stages.length; i++) {
    if (i > 0) {
      conns[i - 1].classList.add('is-flowing');
      await simWait(flowDur);
      if (myToken !== state.sim.token) return;
      nodes[i - 1].classList.remove('is-active');
      nodes[i - 1].classList.add('is-done');
    }
    nodes[i].classList.add('is-active');
    renderSimDetail(i);
    if (state.sim.stages[i].updatesRecord) renderSimRecord(true);
    await simWait(dwell);
    if (myToken !== state.sim.token) return;
  }

  nodes[nodes.length - 1].classList.remove('is-active');
  nodes[nodes.length - 1].classList.add('is-done');
  state.sim.running = false;
  document.getElementById('sim-run').disabled = false;
  toast('Final grade delivered to FADS via webhook', 'success');
}

// ── Data Flow tab (sequence model) ───────────────────────────────────────────

function dfIcon(entity) {
  const paths = {
    user: '<circle cx="12" cy="8" r="3.4"/><path d="M5.5 19a6.5 6.5 0 0 1 13 0"/>',
    flow: '<circle cx="6" cy="6" r="2.2"/><circle cx="18" cy="6" r="2.2"/><circle cx="12" cy="18" r="2.2"/><path d="M7.6 7.4 10.8 16M16.4 7.4 13.2 16M8 6h8"/>',
    hook: '<path d="M9.5 14.5 7 17a3.2 3.2 0 0 1-4.5-4.5l3-3a3.2 3.2 0 0 1 4.5 0"/><path d="M14.5 9.5 17 7a3.2 3.2 0 0 1 4.5 4.5l-3 3a3.2 3.2 0 0 1-4.5 0"/>',
    file: '<path d="M7 3.5h6l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z"/><path d="M13 3.5V8h4"/>',
    grade: '<circle cx="12" cy="9" r="5.2"/><path d="M9 13.5 7.5 21l4.5-2.6L16.5 21 15 13.5"/>',
  };
  return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths[entity] || paths.file}</svg>`;
}

async function renderDataflow() {
  [state.students, state.exams] = await Promise.all([dbGetAll('students'), dbGetAll('exams')]);
  const sample = buildSimSample();
  state.df.sample = sample;
  state.df.stages = sample ? buildSimStages(sample) : [];

  const diagram = document.getElementById('df-diagram');
  if (!sample) {
    diagram.innerHTML = '<div class="sim-detail-empty">No seeded data — reset the database first.</div>';
    document.getElementById('df-checklist').innerHTML = '';
    return;
  }

  diagram.innerHTML = `
    <div class="df-lifelines">
      <span class="df-life df-life-sis">FADS<small>SIS</small></span>
      <span class="df-life df-life-wf">WISEflow</span>
    </div>
    <div class="df-spine df-spine-left"></div>
    <div class="df-spine df-spine-right"></div>
    <div class="df-stages">
      ${state.df.stages.map((st, i) => dfStageRow(st, i)).join('')}
    </div>`;

  resetDataflow();
}

function dfStageRow(st, i) {
  const methodCls = `method-${st.method.toLowerCase()}`;
  const rev = st.kind === 'hook';              // webhook travels WISEflow → SIS (right → left)
  const eventChip = st.event ? `<span class="sim-event-chip">${escHtml(st.event)}</span>` : '';
  return `
    <div class="df-stage df-stage-${st.kind}" data-stage="${i}">
      <div class="df-stage-head">
        <span class="df-num">${i + 1}</span>
        <span class="df-stage-title">${escHtml(st.title)}</span>
        <span class="method-badge ${methodCls}">${st.method}</span>
        <code class="df-endpoint">${escHtml(st.url)}</code>
        <span class="status-badge status-2xx">${st.status}</span>
        ${eventChip}
      </div>
      <div class="df-wire ${rev ? 'df-wire-rev' : ''}">
        <span class="df-dir-label">${escHtml(st.dir)}</span>
        <span class="df-token df-token-${st.kind}" data-entity="${st.entity}">${dfIcon(st.entity)}</span>
      </div>
      <div class="df-payloads">
        <div class="df-payload">
          <div class="df-payload-label">${st.kind === 'hook' ? 'Event payload' : 'Posted'}</div>
          <pre class="api-code">${syntaxHighlight(st.request)}</pre>
        </div>
        <div class="df-payload">
          <div class="df-payload-label">Returned</div>
          <pre class="api-code">${syntaxHighlight(st.response)}</pre>
        </div>
      </div>
      <p class="df-stage-note">${escHtml(st.note)}</p>
    </div>`;
}

function renderDfChecklist(doneCount, nextIdx) {
  const el = document.getElementById('df-checklist');
  if (!el) return;
  const stages = state.df.stages;
  const items = stages.map((st, i) => {
    const done = i < doneCount;
    const isNext = i === nextIdx;
    const stateCls = done ? 'is-done' : (isNext ? 'is-next' : '');
    const box = done ? '&#10003;' : (i + 1);
    const detail = done
      ? `<div class="df-check-update">${escHtml(st.updateLabel)}</div>`
      : (isNext ? '<div class="df-check-next">Next &rarr;</div>' : '');
    return `
      <div class="df-check ${stateCls}">
        <span class="df-check-box">${box}</span>
        <div class="df-check-body">
          <div class="df-check-title">${escHtml(st.title)}</div>
          ${detail}
        </div>
      </div>`;
  }).join('');
  const done = doneCount >= stages.length;
  const summary = done
    ? '<div class="df-check-summary is-complete">All stages complete — grade landed in FADS via webhook.</div>'
    : `<div class="df-check-summary">${doneCount} of ${stages.length} stages complete.</div>`;
  el.innerHTML = `<div class="df-check-head">Run checklist</div>${items}${summary}`;
}

function resetDataflow() {
  state.df.token++;
  state.df.running = false;
  const diagram = document.getElementById('df-diagram');
  if (diagram) {
    diagram.classList.add('df-no-anim');
    diagram.querySelectorAll('.df-stage').forEach(s => s.classList.remove('is-active', 'is-done'));
    void diagram.offsetWidth;
    diagram.classList.remove('df-no-anim');
  }
  renderDfChecklist(0, 0);
  const btn = document.getElementById('df-run');
  if (btn) btn.disabled = false;
}

async function runDataflow() {
  if (state.df.running || !state.df.stages.length) return;
  resetDataflow();
  const myToken = ++state.df.token;
  state.df.running = true;
  document.getElementById('df-run').disabled = true;

  const speed = parseFloat(document.getElementById('df-speed').value) || 1;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const flowDur = reduce ? 0 : Math.round(1000 / speed);
  const dwell   = reduce ? 250 : Math.round(700 / speed);

  const diagram = document.getElementById('df-diagram');
  diagram.style.setProperty('--df-flow', flowDur + 'ms');
  const rows = [...diagram.querySelectorAll('.df-stage')];

  for (let i = 0; i < state.df.stages.length; i++) {
    if (myToken !== state.df.token) return;
    renderDfChecklist(i, i);
    const row = rows[i];
    row.classList.add('is-active');
    row.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' });
    await simWait(flowDur);
    if (myToken !== state.df.token) return;
    row.classList.remove('is-active');
    row.classList.add('is-done');
    renderDfChecklist(i + 1, i + 1);
    await simWait(dwell);
    if (myToken !== state.df.token) return;
  }

  state.df.running = false;
  document.getElementById('df-run').disabled = false;
  toast('Walkthrough complete — grade stored in FADS', 'success');
}

// ── Reset ──────────────────────────────────────────────────────────────────

async function resetDatabase() {
  if (!confirm('Reset the FADS database? All data will be deleted and re-seeded.')) return;
  try {
    document.getElementById('seed-status').textContent = 'Resetting…';
    await Promise.all(['students','exams','enrolments','staff'].map(s => dbClear(s)));
    await seedDatabase();
    state.apiLog = [];
    document.getElementById('seed-status').textContent = '';
    toast('Database reset and re-seeded', 'success');
    await updateStats();
    switchTab(state.activeTab);
  } catch (err) {
    document.getElementById('seed-status').textContent = '';
    toast(`Error: ${err.message}`, 'error');
  }
}

// ── Init ───────────────────────────────────────────────────────────────────

async function init() {
  try {
    await openDB();

    const count = await dbCount('students');
    if (count === 0) {
      document.getElementById('seed-status').textContent = 'Seeding database…';
      await seedDatabase();
      document.getElementById('seed-status').textContent = '';
    }

    await updateStats();
    setupTabs();

    document.getElementById('students-search').addEventListener('input', e => {
      state.studentsSearch = e.target.value;
      renderStudentsTab();
    });

    document.getElementById('exams-search').addEventListener('input', e => {
      state.examsSearch = e.target.value;
      renderExamsTab();
    });

    document.getElementById('enrol-exam-filter').addEventListener('change', e => {
      state.enrolmentsExamFilter = e.target.value;
      renderEnrolmentsTab();
    });

    document.getElementById('drawer-close').addEventListener('click', closeDrawer);
    document.getElementById('drawer-overlay').addEventListener('click', closeDrawer);
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('modal-cancel').addEventListener('click', closeModal);

    // Set mock token in all auth header displays
    document.querySelectorAll('.api-auth-header').forEach(el => {
      el.textContent = `Authorization: ${MOCK_TOKEN}`;
    });

    switchTab('students');
  } catch (err) {
    console.error('FADS init error:', err);
    document.body.innerHTML = `<div style="padding:2rem;font-family:monospace;color:red">Failed to initialise FADS: ${err.message}</div>`;
  }
}

document.addEventListener('DOMContentLoaded', init);
