/* ==========================================================================
   WISEflow API Integration Packages — Web App
   Animated sequence diagram + package explorer
   ========================================================================== */

'use strict';

// ── Package workflow data ────────────────────────────────────────────────────

const REPO = 'https://github.com/AlexMeiling/wiseflow-api-integration-packages';

const PACKAGES = [
  {
    id: 'users',
    num: '01',
    title: 'User Management',
    subtitle: 'Adding & updating users',
    color: '#6366F1',
    description:
      'Automate user account synchronisation between your institution\'s system and WISEflow. ' +
      'This package demonstrates creating a user, assigning a licence role, updating profile details, ' +
      'and patching custom institutional data fields.',
    steps: [
      {
        label: 'Create user',
        method: 'POST',
        endpoint: '/license/user',
        description: 'Create a new user account on the WISEflow licence.',
        req: { email: 'jane.doe@institution.edu', firstname: 'Jane', lastname: 'Doe', eduPrincipalName: 'jdoe@institution.edu' },
        res: { id: 'usr_a1b2c3d4', email: 'jane.doe@institution.edu', firstname: 'Jane', lastname: 'Doe' },
      },
      {
        label: 'Verify user',
        method: 'GET',
        endpoint: '/users/{userId}',
        description: 'Confirm the user was created and retrieve their full profile.',
        req: null,
        res: { id: 'usr_a1b2c3d4', email: 'jane.doe@institution.edu', firstname: 'Jane', lastname: 'Doe', roles: [] },
      },
      {
        label: 'Discover roles',
        method: 'GET',
        endpoint: '/license/roles',
        description: 'Retrieve all roles available on your institution\'s WISEflow licence.',
        req: null,
        res: [{ id: 'role_participant', name: 'Participant' }, { id: 'role_staff', name: 'Staff' }],
      },
      {
        label: 'Assign role',
        method: 'POST',
        endpoint: '/users/{userId}/roles',
        description: 'Grant the user a role so they can take part in exam flows.',
        req: { roleId: 'role_participant' },
        res: { roleId: 'role_participant', roleName: 'Participant' },
      },
      {
        label: 'Update user',
        method: 'PUT',
        endpoint: '/users/{userId}',
        description: 'Update the user\'s name (e.g. after a surname change in the SIS).',
        req: { firstname: 'Jane', lastname: 'Smith' },
        res: { id: 'usr_a1b2c3d4', firstname: 'Jane', lastname: 'Smith' },
      },
      {
        label: 'Patch user-data',
        method: 'PATCH',
        endpoint: '/users/{userId}/user-data',
        description: 'Attach a custom institutional data value (e.g. student number).',
        req: [{ userDataTypeId: 'udt_student_no', value: 'STU-2026-0042' }],
        res: [{ id: 'ud_9z', userDataTypeId: 'udt_student_no', value: 'STU-2026-0042' }],
      },
    ],
  },
  {
    id: 'flows',
    num: '02',
    title: 'Flow Management',
    subtitle: 'Creating & managing flows',
    color: '#0EA5E9',
    description:
      'Automate the creation and configuration of exam flows in WISEflow. ' +
      'This package walks through discovering available flow types, creating a flow, ' +
      'setting dates, adding a participant-facing description, and activating it.',
    steps: [
      {
        label: 'Get flow types',
        method: 'GET',
        endpoint: '/license/flow-types',
        description: 'Retrieve exam types available on the licence (written, oral, submission …).',
        req: null,
        res: [{ id: 'ft_written', name: 'Written Exam' }, { id: 'ft_submission', name: 'Assignment Submission' }],
      },
      {
        label: 'Create flow',
        method: 'POST',
        endpoint: '/license/create/flow',
        description: 'Create a new exam flow in draft state.',
        req: { title: 'CS101 — Final Exam', flowTypeId: 'ft_written' },
        res: { id: 'flow_d4e5f6', title: 'CS101 — Final Exam', status: 'draft' },
      },
      {
        label: 'Set exam dates',
        method: 'PATCH',
        endpoint: '/flows/{flowId}/dates',
        description: 'Set the start and end date/time for the exam.',
        req: { startDate: '2026-05-15T09:00:00Z', endDate: '2026-05-15T12:00:00Z' },
        res: { startDate: '2026-05-15T09:00:00Z', endDate: '2026-05-15T12:00:00Z' },
      },
      {
        label: 'Set description',
        method: 'PUT',
        endpoint: '/flows/{flowId}/description',
        description: 'Add instructions visible to participants when they open the exam.',
        req: { description: 'Closed book examination. 3 hours. All answers must be submitted before end time.' },
        res: { description: 'Closed book examination. 3 hours…' },
      },
      {
        label: 'Activate flow',
        method: 'PATCH',
        endpoint: '/flows/{flowId}/activate',
        description: 'Publish the flow so participants can see and access it.',
        req: {},
        res: { id: 'flow_d4e5f6', status: 'active' },
      },
    ],
  },
  {
    id: 'participants',
    num: '03',
    title: 'Participants & Assessors',
    subtitle: 'Enrolment, assessors & allocation',
    color: '#10B981',
    description:
      'Enrol students and examiners into an active exam flow, create assessor groups, ' +
      'and allocate assessors to specific participants. ' +
      'This is the key setup workflow for a live exam session.',
    steps: [
      {
        label: 'Add participant',
        method: 'POST',
        endpoint: '/flows/{flowId}/participants',
        description: 'Enrol a user as a participant (student) in the exam.',
        req: { userId: 'usr_a1b2c3d4' },
        res: { id: 'part_p1p2p3', userId: 'usr_a1b2c3d4', flowId: 'flow_d4e5f6' },
      },
      {
        label: 'List participants',
        method: 'GET',
        endpoint: '/flows/{flowId}/participants',
        description: 'Verify the participant roster and retrieve participant ids.',
        req: null,
        res: { participants: [{ id: 'part_p1p2p3', userId: 'usr_a1b2c3d4', firstname: 'Jane', lastname: 'Doe' }], total: 1 },
      },
      {
        label: 'Add assessor',
        method: 'POST',
        endpoint: '/flows/{flowId}/assessors',
        description: 'Add a grader / examiner to the flow.',
        req: { userId: 'usr_examiner_001' },
        res: { id: 'assr_q1q2q3', userId: 'usr_examiner_001' },
      },
      {
        label: 'Create assessor group',
        method: 'POST',
        endpoint: '/flows/{flowId}/assessor-groups',
        description: 'Group assessors for structured allocation management.',
        req: { name: 'Main Examiner Group' },
        res: { id: 'agrp_r1r2r3', name: 'Main Examiner Group' },
      },
      {
        label: 'Allocate assessor',
        method: 'POST',
        endpoint: '/flows/{flowId}/assessors/{aId}/allocations/participants/{pId}',
        description: 'Assign the assessor to mark a specific participant\'s submission.',
        req: {},
        res: { assessorId: 'assr_q1q2q3', participantId: 'part_p1p2p3' },
      },
      {
        label: 'Verify allocations',
        method: 'GET',
        endpoint: '/flows/{flowId}/assessors/{aId}/allocations',
        description: 'Confirm the allocation was recorded correctly.',
        req: null,
        res: { allocations: [{ participantId: 'part_p1p2p3', firstname: 'Jane', lastname: 'Doe' }] },
      },
    ],
  },
  {
    id: 'grades',
    num: '04',
    title: 'Grade Passback',
    subtitle: 'Passing grades to LMS / SIS',
    color: '#F59E0B',
    description:
      'Retrieve final assessment results from WISEflow and transmit them to your Student Information System (SIS) or LMS. ' +
      'Covers fetching submissions, extracting item-based marks, transforming to the target schema, ' +
      'and simulating a push to an external endpoint.',
    steps: [
      {
        label: 'Fetch submissions',
        method: 'GET',
        endpoint: '/flows/{flowId}/submissions',
        description: 'Retrieve all submitted work for the flow.',
        req: null,
        res: { submissions: [{ id: 'sub_s1s2s3', participantId: 'part_p1p2p3', status: 'marked' }] },
      },
      {
        label: 'Fetch marks',
        method: 'GET',
        endpoint: '/flows/{flowId}/participants/{pId}/item-based-marks',
        description: 'Retrieve the detailed grade and score for a specific participant.',
        req: null,
        res: { participantId: 'part_p1p2p3', grade: 'B', score: 74, maxScore: 100, passedAt: '2026-04-16T14:30:00Z' },
      },
      {
        label: 'Transform to SIS format',
        method: null,
        endpoint: '(local transform)',
        description: 'Map WISEflow grade fields to the target SIS/LMS schema. Customise this step in the script.',
        req: { participantId: 'part_p1p2p3', grade: 'B', score: 74 },
        res: { studentId: 'STU-2026-0042', courseCode: 'CS101', grade: 'B', credits: 7.5 },
      },
      {
        label: 'POST grades to SIS',
        method: 'POST',
        endpoint: '/api/v1/grades (SIS endpoint)',
        description: 'Push the transformed grade record to the LMS/SIS endpoint defined in SIS_ENDPOINT.',
        req: { studentId: 'STU-2026-0042', courseCode: 'CS101', grade: 'B', credits: 7.5 },
        res: { status: 'accepted', recordId: 'sis_rec_999' },
      },
    ],
  },
];

// ── Method badge colours ─────────────────────────────────────────────────────

const METHOD_COLORS = {
  GET:    '#10B981',
  POST:   '#3B82F6',
  PUT:    '#F97316',
  PATCH:  '#8B5CF6',
  DELETE: '#EF4444',
};

// ── Per-package animation state ───────────────────────────────────────────────

const _state = {};   // keyed by package id; { currentStep, isPlaying, timer }

function getState(id) {
  if (!_state[id]) _state[id] = { currentStep: -1, isPlaying: false, timer: null };
  return _state[id];
}

// ── SVG sequence diagram ──────────────────────────────────────────────────────

function buildSVG(pkg, currentStepIndex) {
  const W           = 600;
  const LEFT_CX     = 130;
  const RIGHT_CX    = 470;
  const ACTOR_W     = 140;
  const ACTOR_H     = 42;
  const HEADER_H    = 72;
  const STEP_H      = 88;
  const H           = HEADER_H + pkg.steps.length * STEP_H + 24;
  const mid         = (LEFT_CX + RIGHT_CX) / 2;
  const pkgColor    = pkg.color;

  // State helpers
  const isActive    = i => i === currentStepIndex;
  const isDone      = i => i < currentStepIndex;
  const arrowColor  = i => isActive(i) ? pkgColor : (isDone(i) ? '#6B7280' : '#D1D5DB');
  const textColor   = i => isActive(i) ? pkgColor : (isDone(i) ? '#374151' : '#B0B7C3');
  const opacity     = i => i <= currentStepIndex ? '1' : '0.25';

  const parts = [];
  parts.push(`<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" class="seq-diagram">`);

  // ── defs ──
  parts.push(`<defs>`);
  // Arrow markers — one per state
  [['active', pkgColor], ['done', '#6B7280'], ['future', '#D1D5DB']].forEach(([name, fill]) => {
    parts.push(`<marker id="arr-${pkg.id}-${name}-r" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto">
      <polygon points="0 0,9 3.5,0 7" fill="${fill}"/></marker>`);
    parts.push(`<marker id="arr-${pkg.id}-${name}-l" markerWidth="9" markerHeight="7" refX="1" refY="3.5" orient="auto">
      <polygon points="9 0,0 3.5,9 7" fill="${fill}"/></marker>`);
  });
  parts.push(`</defs>`);

  // ── actor boxes ──
  [[LEFT_CX, 'Your System'], [RIGHT_CX, 'WISEflow API']].forEach(([cx, label]) => {
    parts.push(`<rect x="${cx - ACTOR_W / 2}" y="8" width="${ACTOR_W}" height="${ACTOR_H}" rx="7"
      fill="white" stroke="#E5E7EB" stroke-width="1.5"/>`);
    parts.push(`<text x="${cx}" y="${8 + ACTOR_H / 2 + 5}" text-anchor="middle"
      font-family="Inter,system-ui,sans-serif" font-size="12.5" font-weight="600" fill="#111827">${label}</text>`);
  });

  // ── lifelines ──
  const lifeTop = 8 + ACTOR_H;
  parts.push(`<line x1="${LEFT_CX}"  y1="${lifeTop}" x2="${LEFT_CX}"  y2="${H - 8}" stroke="#E5E7EB" stroke-width="1.5" stroke-dasharray="5,5"/>`);
  parts.push(`<line x1="${RIGHT_CX}" y1="${lifeTop}" x2="${RIGHT_CX}" y2="${H - 8}" stroke="#E5E7EB" stroke-width="1.5" stroke-dasharray="5,5"/>`);

  // ── steps ──
  pkg.steps.forEach((step, i) => {
    const arrowY   = HEADER_H + i * STEP_H + 28;
    const state    = isActive(i) ? 'active' : (isDone(i) ? 'done' : 'future');
    const col      = arrowColor(i);
    const txtCol   = textColor(i);
    const op       = opacity(i);
    const isSelf   = !step.method;

    parts.push(`<g opacity="${op}">`);

    // Step number badge (left side)
    const badgeFill = isActive(i) ? pkgColor : (isDone(i) ? '#9CA3AF' : '#E5E7EB');
    const badgeTxt  = isDone(i)   ? '✓'     : String(i + 1);
    const badgeTxtColor = (isDone(i) || isActive(i)) ? 'white' : '#9CA3AF';
    parts.push(`<circle cx="22" cy="${arrowY}" r="11" fill="${badgeFill}"/>`);
    parts.push(`<text x="22" y="${arrowY + 4}" text-anchor="middle"
      font-family="Inter,sans-serif" font-size="${isDone(i) ? 10 : 10}" font-weight="700" fill="${badgeTxtColor}">${badgeTxt}</text>`);

    if (isSelf) {
      // Local transform — self-loop on left  
      const lx = LEFT_CX;
      const loopR = 32;
      parts.push(`<path d="M ${lx} ${arrowY - 6} C ${lx - loopR * 2} ${arrowY - 6}, ${lx - loopR * 2} ${arrowY + 22}, ${lx} ${arrowY + 22}"
        fill="none" stroke="${col}" stroke-width="1.5" stroke-dasharray="5,3"
        marker-end="url(#arr-${pkg.id}-${state}-r)"/>`);
      parts.push(`<text x="${lx - loopR - 8}" y="${arrowY + 10}" text-anchor="end"
        font-family="Inter,sans-serif" font-size="10" font-weight="600" fill="${txtCol}">${step.label}</text>`);
      // "local" badge
      parts.push(`<rect x="${lx - loopR * 2 - 2}" y="${arrowY - 14}" width="36" height="14" rx="3" fill="${col}"/>`);
      parts.push(`<text x="${lx - loopR * 2 + 16}" y="${arrowY - 4}" text-anchor="middle"
        font-family="Inter,sans-serif" font-size="9" font-weight="700" fill="white">local</text>`);
    } else {
      // Standard arrow
      const fromX = LEFT_CX + 6;
      const toX   = RIGHT_CX - 6;
      const mCol  = METHOD_COLORS[step.method] || col;

      parts.push(`<line x1="${fromX}" y1="${arrowY}" x2="${toX}" y2="${arrowY}"
        stroke="${col}" stroke-width="1.5"
        marker-end="url(#arr-${pkg.id}-${state}-r)"/>`);

      // Method badge above arrow
      const badgeW = step.method.length * 7 + 12;
      parts.push(`<rect x="${mid - badgeW / 2}" y="${arrowY - 17}" width="${badgeW}" height="15" rx="3"
        fill="${isActive(i) ? mCol : (isDone(i) ? '#9CA3AF' : '#E5E7EB')}"/>`);
      parts.push(`<text x="${mid}" y="${arrowY - 6}" text-anchor="middle"
        font-family="Inter,sans-serif" font-size="9" font-weight="700"
        fill="${(isActive(i) || isDone(i)) ? 'white' : '#B0B7C3'}">${step.method}</text>`);

      // Endpoint label below arrow
      const ep = step.endpoint.length > 42 ? step.endpoint.substring(0, 39) + '…' : step.endpoint;
      parts.push(`<text x="${mid}" y="${arrowY + 16}" text-anchor="middle"
        font-family="Inter,monospace,sans-serif" font-size="10" fill="${txtCol}">${ep}</text>`);
    }

    parts.push(`</g>`);
  });

  parts.push(`</svg>`);
  return parts.join('\n');
}

// ── Side panel: request / response preview ───────────────────────────────────

function renderPanel(containerId, pkg, stepIndex) {
  const panel = document.getElementById(containerId);
  if (!panel) return;

  if (stepIndex < 0) {
    panel.innerHTML = `<div class="panel-idle">
      <p>Press <strong>Play</strong> to step through the workflow, or use the arrows.</p>
    </div>`;
    return;
  }

  const step = pkg.steps[stepIndex];
  const reqHtml = step.req !== null
    ? `<div class="panel-block">
        <div class="panel-label req">Request body</div>
        <pre>${JSON.stringify(step.req, null, 2)}</pre>
       </div>`
    : '';

  panel.innerHTML = `
    <div class="panel-step-info">
      <span class="step-num" style="background:${pkg.color}">Step ${stepIndex + 1}</span>
      <strong>${step.label}</strong>
    </div>
    <p class="panel-desc">${step.description}</p>
    ${reqHtml}
    <div class="panel-block">
      <div class="panel-label res">Response</div>
      <pre>${JSON.stringify(step.res, null, 2)}</pre>
    </div>`;
}

// ── Animation controls ────────────────────────────────────────────────────────

function advance(pkg, svgId, panelId, ctrlId) {
  const st = getState(pkg.id);
  if (st.currentStep < pkg.steps.length - 1) {
    st.currentStep++;
  } else {
    stopPlay(pkg, ctrlId);
    return;
  }
  redraw(pkg, svgId, panelId, ctrlId);
}

function retreat(pkg, svgId, panelId, ctrlId) {
  const st = getState(pkg.id);
  if (st.currentStep > -1) st.currentStep--;
  redraw(pkg, svgId, panelId, ctrlId);
}

function redraw(pkg, svgId, panelId, ctrlId) {
  const st = getState(pkg.id);
  const svgEl = document.getElementById(svgId);
  if (svgEl) svgEl.innerHTML = buildSVG(pkg, st.currentStep);

  renderPanel(panelId, pkg, st.currentStep);
  updateControls(pkg, ctrlId);
  updateProgressBar(pkg);
}

function startPlay(pkg, svgId, panelId, ctrlId) {
  const st = getState(pkg.id);
  if (st.isPlaying) return;
  st.isPlaying = true;

  // If already at the end, restart
  if (st.currentStep >= pkg.steps.length - 1) {
    st.currentStep = -1;
    redraw(pkg, svgId, panelId, ctrlId);
  }

  // First immediate step
  advance(pkg, svgId, panelId, ctrlId);

  st.timer = setInterval(() => {
    advance(pkg, svgId, panelId, ctrlId);
    if (getState(pkg.id).currentStep >= pkg.steps.length - 1) {
      stopPlay(pkg, ctrlId);
    }
  }, 1600);

  updateControls(pkg, ctrlId);
}

function stopPlay(pkg, ctrlId) {
  const st = getState(pkg.id);
  st.isPlaying = false;
  if (st.timer) { clearInterval(st.timer); st.timer = null; }
  updateControls(pkg, ctrlId);
}

function togglePlay(pkg, svgId, panelId, ctrlId) {
  const st = getState(pkg.id);
  if (st.isPlaying) {
    stopPlay(pkg, ctrlId);
  } else {
    startPlay(pkg, svgId, panelId, ctrlId);
  }
}

function resetAnim(pkg, svgId, panelId, ctrlId) {
  stopPlay(pkg, ctrlId);
  getState(pkg.id).currentStep = -1;
  redraw(pkg, svgId, panelId, ctrlId);
}

function updateControls(pkg, ctrlId) {
  const st    = getState(pkg.id);
  const ctrl  = document.getElementById(ctrlId);
  if (!ctrl) return;

  const playBtn  = ctrl.querySelector('.btn-play');
  const prevBtn  = ctrl.querySelector('.btn-prev');
  const nextBtn  = ctrl.querySelector('.btn-next');
  const counter  = ctrl.querySelector('.step-counter');

  if (playBtn) {
    playBtn.textContent   = st.isPlaying ? '⏸ Pause' : '▶ Play';
    playBtn.classList.toggle('playing', st.isPlaying);
  }
  if (prevBtn) prevBtn.disabled = st.currentStep <= -1;
  if (nextBtn) nextBtn.disabled = st.currentStep >= pkg.steps.length - 1;
  if (counter) {
    counter.textContent = st.currentStep < 0
      ? `0 / ${pkg.steps.length}`
      : `${st.currentStep + 1} / ${pkg.steps.length}`;
  }
}

function updateProgressBar(pkg) {
  const st  = getState(pkg.id);
  const bar = document.querySelector(`[data-progress="${pkg.id}"]`);
  if (!bar) return;
  const pct = Math.round(((st.currentStep + 1) / pkg.steps.length) * 100);
  bar.style.width = `${Math.max(0, pct)}%`;
}

// ── Build package card HTML ───────────────────────────────────────────────────

function buildCard(pkg) {
  const svgId   = `svg-${pkg.id}`;
  const panelId = `panel-${pkg.id}`;
  const ctrlId  = `ctrl-${pkg.id}`;

  const stepsHtml = pkg.steps.map((s, i) => {
    const mc = METHOD_COLORS[s.method] || '#9CA3AF';
    const badge = s.method
      ? `<span class="method-badge" style="background:${mc}">${s.method}</span>`
      : `<span class="method-badge local">local</span>`;
    return `<li class="step-row">
      <span class="step-idx">${i + 1}</span>
      ${badge}
      <code>${s.endpoint}</code>
      <span class="step-lbl">${s.label}</span>
    </li>`;
  }).join('');

  return `
<section class="pkg-card" id="pkg-${pkg.id}">
  <div class="pkg-header" style="border-color:${pkg.color}">
    <div class="pkg-meta">
      <span class="pkg-num" style="background:${pkg.color}">${pkg.num}</span>
      <div>
        <h2 class="pkg-title">${pkg.title}</h2>
        <p class="pkg-subtitle">${pkg.subtitle}</p>
      </div>
    </div>
    <div class="pkg-actions">
      <a class="btn btn-outline" href="${REPO}/tree/main/packages/${pkg.num}-${pkg.id}" target="_blank" rel="noopener">
        View on GitHub
      </a>
      <a class="btn btn-solid" href="${REPO}/releases/latest/download/${pkg.num}-${pkg.id}.zip" download>
        ↓ Download
      </a>
      <a class="btn btn-postman"
        href="https://app.getpostman.com/run-collection?url=${encodeURIComponent(
          `${REPO}/raw/main/packages/${pkg.num}-${pkg.id}/postman/${pkg.id.replace('-','_')}.postman_collection.json`
        )}"
        target="_blank" rel="noopener">
        Open in Postman
      </a>
    </div>
  </div>

  <p class="pkg-desc">${pkg.description}</p>

  <div class="pkg-body">
    <!-- Left: steps list + controls -->
    <div class="pkg-left">
      <h3 class="section-label">Workflow steps</h3>
      <ol class="steps-list">${stepsHtml}</ol>
    </div>

    <!-- Right: diagram + panel -->
    <div class="pkg-right">
      <h3 class="section-label">
        Preview
        <span class="api-version">API 1.34.0</span>
      </h3>

      <!-- Progress bar -->
      <div class="progress-track">
        <div class="progress-fill" data-progress="${pkg.id}" style="background:${pkg.color};width:0%"></div>
      </div>

      <!-- Controls -->
      <div class="diagram-controls" id="${ctrlId}">
        <button class="btn-icon btn-prev" onclick="retreat(PACKAGES.find(p=>p.id==='${pkg.id}'),'${svgId}','${panelId}','${ctrlId}')" disabled>‹</button>
        <button class="btn-play" onclick="togglePlay(PACKAGES.find(p=>p.id==='${pkg.id}'),'${svgId}','${panelId}','${ctrlId}')">▶ Play</button>
        <button class="btn-icon btn-next" onclick="advance(PACKAGES.find(p=>p.id==='${pkg.id}'),'${svgId}','${panelId}','${ctrlId}')">›</button>
        <button class="btn-reset" onclick="resetAnim(PACKAGES.find(p=>p.id==='${pkg.id}'),'${svgId}','${panelId}','${ctrlId}')">↺ Reset</button>
        <span class="step-counter">0 / ${pkg.steps.length}</span>
      </div>

      <div class="diagram-area">
        <!-- SVG diagram -->
        <div class="svg-wrap" id="${svgId}">
          ${buildSVG(pkg, -1)}
        </div>
        <!-- Side panel -->
        <div class="detail-panel" id="${panelId}">
          <div class="panel-idle">
            <p>Press <strong>Play</strong> to step through the workflow.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>`;
}

// ── Initialise page ───────────────────────────────────────────────────────────

function init() {
  const grid = document.getElementById('packages-grid');
  if (!grid) return;
  grid.innerHTML = PACKAGES.map(buildCard).join('');
}

document.addEventListener('DOMContentLoaded', init);
