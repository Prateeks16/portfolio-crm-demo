/**
 * Axios adapter that answers every API call from the in-browser demo database.
 *
 * The whole point of the demo build: the React app is byte-for-byte the real
 * dashboard, but instead of reaching a Django backend, requests are served from
 * seeded local state. No network, no real data, no credentials.
 *
 * It reproduces the shapes the real DRF API returns — including the computed
 * fields (stage_display, activity_count, tag_list, …) the UI reads.
 */

import { clone, getDb, nextId, save } from './store';

const LATENCY_MS = 90;

// --- label maps (mirror the Django model choices) ------------------------- //

const STAGES = [
  ['new', 'New'], ['contacted', 'Contacted'], ['applied', 'Applied'],
  ['replied', 'Replied'], ['interviewing', 'Interviewing'], ['offer', 'Offer'],
  ['won', 'Won'], ['lost', 'Lost'],
];
const STAGE_LABEL = Object.fromEntries(STAGES);
const SOURCE_LABEL = {
  portfolio: 'Portfolio Contact Form', linkedin: 'LinkedIn', referral: 'Referral',
  job_board: 'Job Board', application_form: 'Application Form', github: 'GitHub',
  job_scan: 'Automated Job Scan', email: 'Inbound Email', manual: 'Manually Added',
  other: 'Other',
};
const KIND_LABEL = {
  note: 'Note', email_sent: 'Email Sent', email_received: 'Reply Received',
  email_draft: 'Email Drafted', stage_change: 'Stage Change', call: 'Call',
  meeting: 'Meeting', created: 'Created',
};
const AI_SIGNALS = [
  'ml', 'ai', 'llm', 'rag', 'nlp', 'genai', 'generative', 'vector', 'embedding',
  'embeddings', 'agent', 'agents', 'agentic', 'data scientist', 'pytorch',
  'tensorflow', 'huggingface', 'transformers', 'qdrant', 'machine learning',
  'deep learning', 'computer vision', 'applied scientist',
];

const suggestResume = (role = '', tags = '') => {
  const hay = `${role} ${tags}`.toLowerCase();
  return AI_SIGNALS.some((s) => hay.includes(s)) ? 'ai_ml' : 'backend';
};

class HttpError extends Error {
  constructor(status, data) {
    super(data?.detail || 'error');
    this.__http = true;
    this.status = status;
    this.data = data;
  }
}

const nowIso = () => new Date().toISOString();

// --- serializers ---------------------------------------------------------- //

const serializeLead = (lead) => {
  const db = getDb();
  const activity_count = db.activities.filter((a) => a.lead === lead.id).length;
  const email_count = db.emails.filter((e) => e.lead === lead.id).length;
  return {
    ...lead,
    tag_list: (lead.tags || '').split(',').map((t) => t.trim()).filter(Boolean),
    resume_for_role: lead.resume_variant || suggestResume(lead.role, lead.tags),
    is_follow_up_due: Boolean(
      lead.next_follow_up_at && new Date(lead.next_follow_up_at) <= new Date()
    ),
    stage_display: STAGE_LABEL[lead.stage] || lead.stage,
    source_display: SOURCE_LABEL[lead.source] || lead.source,
    activity_count,
    email_count,
  };
};

const serializeLeadDetail = (lead) => {
  const db = getDb();
  const acts = db.activities
    .filter((a) => a.lead === lead.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return { ...serializeLead(lead), activities: acts };
};

const serializeEmail = (e) => {
  const db = getDb();
  const lead = db.leads.find((l) => l.id === e.lead);
  return {
    ...e,
    lead_name: lead ? lead.name : null,
    status_display: (e.status || '').charAt(0).toUpperCase() + (e.status || '').slice(1),
  };
};

const serializeTask = (t) => {
  const db = getDb();
  const lead = t.lead ? db.leads.find((l) => l.id === t.lead) : null;
  return { ...t, lead_name: lead ? lead.name : null };
};

const serializeExperience = (x) => ({
  ...x,
  tech_stack: (x.technologies_used || '').split(',').map((s) => s.trim()).filter(Boolean),
});

const serializeSkill = (s) => {
  const db = getDb();
  const cat = db.skillCategories.find((c) => c.id === s.category);
  return { ...s, category_name: cat ? cat.name : null };
};

const serializeMail = (m) => {
  const db = getDb();
  const lead = m.lead ? db.leads.find((l) => l.id === m.lead) : null;
  return { ...m, lead_name: lead ? lead.name : null };
};

// --- aggregates ----------------------------------------------------------- //

const pipelineSummary = () => {
  const db = getDb();
  const counts = {};
  db.leads.forEach((l) => { counts[l.stage] = (counts[l.stage] || 0) + 1; });
  const now = new Date();
  return {
    stages: STAGES.map(([stage, label]) => ({ stage, label, count: counts[stage] || 0 })),
    total_leads: db.leads.length,
    due_follow_ups: db.leads.filter(
      (l) => l.next_follow_up_at && new Date(l.next_follow_up_at) <= now &&
        !['won', 'lost'].includes(l.stage)
    ).length,
    drafts: db.emails.filter((e) => e.status === 'draft').length,
    sent: db.emails.filter((e) => e.status === 'sent').length,
  };
};

// Deterministic pseudo-random so the charts stay stable across reloads.
const hashDay = (s) => {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) % 100000;
  return h;
};

const analyticsOverview = (days = 30) => {
  const timeseries = [];
  let total = 0;
  const today = new Date();
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const d = new Date(today.getTime() - offset * 86400000);
    const key = d.toISOString().slice(0, 10);
    const weekend = [0, 6].includes(d.getDay());
    const base = 18 + (hashDay(key) % 34);
    const views = Math.max(0, Math.round(base * (weekend ? 0.55 : 1)));
    total += views;
    timeseries.push({ date: key, views });
  }
  return {
    days,
    total_views: total,
    unique_visitors: Math.round(total * 0.62),
    timeseries,
    top_pages: [
      { path: '/', count: Math.round(total * 0.44) },
      { path: '/projects', count: Math.round(total * 0.21) },
      { path: '/experience', count: Math.round(total * 0.14) },
      { path: '/contact', count: Math.round(total * 0.11) },
      { path: '/about', count: Math.round(total * 0.1) },
    ],
    referrers: [
      { referrer: 'https://www.linkedin.com/', count: Math.round(total * 0.3) },
      { referrer: 'https://github.com/', count: Math.round(total * 0.18) },
      { referrer: 'https://www.google.com/', count: Math.round(total * 0.15) },
    ],
    devices: [
      { device: 'desktop', count: Math.round(total * 0.64) },
      { device: 'mobile', count: Math.round(total * 0.31) },
      { device: 'tablet', count: Math.round(total * 0.05) },
    ],
    events: [
      { name: 'resume_download', count: Math.round(total * 0.08) },
      { name: 'project_open', count: Math.round(total * 0.19) },
      { name: 'contact_submit', count: Math.round(total * 0.03) },
      { name: 'cta_click', count: Math.round(total * 0.12) },
    ],
  };
};

const githubStats = () => ({
  error: null,
  totals: { public_repos: 18, owned_repos: 15, forks: 3, stars: 47 },
  languages: [
    { name: 'Python', count: 7 },
    { name: 'JavaScript', count: 4 },
    { name: 'Go', count: 2 },
    { name: 'HTML', count: 2 },
  ],
  repos: [
    { name: 'my-portfolio-project', description: 'Portfolio + instrumented outreach CRM', language: 'Python', stars: 12, forks: 1, pushed_at: nowIso(), html_url: 'https://github.com/Prateeks16', topics: ['django', 'react', 'crm'] },
    { name: 'obsidian-rag-email-sender', description: 'RAG over an Obsidian vault + email drafting', language: 'Python', stars: 9, forks: 0, pushed_at: nowIso(), html_url: 'https://github.com/Prateeks16/obsidian-rag-email-sender', topics: ['rag', 'gemini', 'streamlit'] },
    { name: 'algorithms', description: 'DSA practice', language: 'Java', stars: 5, forks: 1, pushed_at: nowIso(), html_url: 'https://github.com/Prateeks16', topics: ['dsa'] },
    { name: 'go-microservices', description: 'Microservice experiments in Go', language: 'Go', stars: 8, forks: 1, pushed_at: nowIso(), html_url: 'https://github.com/Prateeks16', topics: ['go', 'grpc'] },
  ],
});

// --- request helpers ------------------------------------------------------ //

const parse = (config) => {
  let raw = config.url || '';
  raw = raw.replace(/^https?:\/\/[^/]+/, '');
  const [pathPart, queryPart = ''] = raw.split('?');
  let path = pathPart.replace(/^\/api/, '');
  if (!path.startsWith('/')) path = `/${path}`;
  const query = {};
  new URLSearchParams(queryPart).forEach((v, k) => { query[k] = v; });
  if (config.params) Object.assign(query, config.params);
  let body = config.data;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  return { method: (config.method || 'get').toLowerCase(), path, query, body: body || {} };
};

const buildContext = (data) => {
  const db = getDb();
  const ctx = {
    my_name: db.profile.full_name, my_email: db.profile.email,
    my_github: db.profile.github_url, my_linkedin: db.profile.linkedin_url,
    my_portfolio: 'https://prateeks16.in', name: '', company: '', role: '',
  };
  const lead = data.lead ? db.leads.find((l) => l.id === Number(data.lead)) : null;
  if (lead) {
    const isPerson = lead.name && lead.name.trim().toLowerCase() !== lead.company.trim().toLowerCase();
    Object.assign(ctx, {
      name: lead.name, company: lead.company, role: lead.role,
      first_name: isPerson ? lead.name.split(' ')[0] : 'there',
    });
  }
  ['name', 'company', 'role', 'first_name'].forEach((k) => { if (data[k]) ctx[k] = data[k]; });
  if (ctx.first_name == null) ctx.first_name = ctx.name ? ctx.name.split(' ')[0] : '';
  return ctx;
};

const render = (tpl, ctx) => {
  let { subject, body } = tpl;
  Object.entries(ctx).forEach(([k, v]) => {
    const token = `{{${k}}}`;
    subject = subject.split(token).join(v ?? '');
    body = body.split(token).join(v ?? '');
  });
  return { subject, body };
};

// --- generic collection CRUD --------------------------------------------- //

function collection(db, key, seq, serialize) {
  return {
    list: () => db[key].map(serialize),
    retrieve: (id) => {
      const item = db[key].find((x) => x.id === id);
      if (!item) throw new HttpError(404, { detail: 'Not found.' });
      return serialize(item);
    },
    create: (data, defaults = {}) => {
      const item = { id: nextId(seq), created_at: nowIso(), updated_at: nowIso(), ...defaults, ...data };
      item.id = item.id || nextId(seq);
      db[key].unshift(item);
      save();
      return serialize(item);
    },
    update: (id, data) => {
      const item = db[key].find((x) => x.id === id);
      if (!item) throw new HttpError(404, { detail: 'Not found.' });
      Object.assign(item, data, { id, updated_at: nowIso() });
      save();
      return serialize(item);
    },
    remove: (id) => {
      const idx = db[key].findIndex((x) => x.id === id);
      if (idx === -1) throw new HttpError(404, { detail: 'Not found.' });
      db[key].splice(idx, 1);
      save();
    },
  };
}

// --- the router ----------------------------------------------------------- //

function route(config) {
  const { method, path, query, body } = parse(config);
  const db = getDb();
  const seg = path.replace(/^\/|\/$/g, '').split('/'); // e.g. ['crm','leads','3','note']

  // ---- auth ----
  if (path.startsWith('/crm/auth/token')) {
    if (!body.username || !body.password) {
      throw new HttpError(401, { detail: 'No active account found with the given credentials' });
    }
    return { data: { access: 'demo-access-token', refresh: 'demo-refresh-token' } };
  }
  if (path.startsWith('/crm/auth/refresh')) {
    return { data: { access: 'demo-access-token', refresh: 'demo-refresh-token' } };
  }

  if (path.startsWith('/crm/health')) return { data: { status: 'ok' } };
  if (path.startsWith('/crm/track')) return { data: { ok: true }, status: 201 };

  // ---- dashboard aggregates ----
  if (path.startsWith('/crm/summary')) {
    return {
      data: {
        pipeline: pipelineSummary(),
        analytics: analyticsOverview(30),
        content: {
          projects: db.projects.length, experiences: db.experiences.length,
          achievements: db.achievements.length, skills: db.skills.length,
        },
        inbox: {
          total: db.contactSubmissions.length,
          recent: db.contactSubmissions.slice(0, 5).map((c) => ({
            id: c.id, name: c.name, email: c.email, subject: c.subject, submitted_at: c.submitted_at,
          })),
        },
        tasks: {
          open: db.tasks.filter((t) => !t.is_done).length,
          done: db.tasks.filter((t) => t.is_done).length,
        },
        mail_configured: true,
      },
    };
  }
  if (path.startsWith('/crm/analytics')) return { data: analyticsOverview(Number(query.days) || 30) };
  if (path.startsWith('/crm/github')) return { data: githubStats() };
  if (path.startsWith('/crm/ingest-status')) {
    const scanned = db.leads.filter((l) => l.source === 'job_scan');
    return { data: { configured: true, scanned_leads: scanned.length, last_ingest_at: scanned[0]?.created_at || null } };
  }

  // ---- leads ----
  if (seg[0] === 'crm' && seg[1] === 'leads') {
    const id = Number(seg[2]);
    const leads = collection(db, 'leads', 'lead', serializeLead);

    if (seg[2] === 'pipeline') return { data: pipelineSummary() };

    if (seg[3] === 'note' && method === 'post') {
      const lead = db.leads.find((l) => l.id === id);
      if (!lead) throw new HttpError(404, { detail: 'Not found.' });
      const text = (body.body || '').trim();
      if (!text) throw new HttpError(400, { detail: 'A note body is required.' });
      const activity = {
        id: nextId('activity'), lead: id, kind: body.kind || 'note',
        kind_display: KIND_LABEL[body.kind || 'note'], summary: body.summary || text.slice(0, 120),
        body: text, created_at: nowIso(),
      };
      db.activities.unshift(activity);
      save();
      return { data: activity, status: 201 };
    }

    if (!seg[2]) {
      if (method === 'get') {
        let rows = db.leads.slice();
        if (query.stage) rows = rows.filter((l) => l.stage === query.stage);
        if (query.source) rows = rows.filter((l) => l.source === query.source);
        if (query.search) {
          const q = query.search.toLowerCase();
          rows = rows.filter((l) => [l.name, l.email, l.company, l.role, l.tags]
            .some((f) => (f || '').toLowerCase().includes(q)));
        }
        return { data: rows.map(serializeLead) };
      }
      if (method === 'post') {
        const created = leads.create(body, {
          stage: body.stage || 'new', source: body.source || 'manual', score: body.score ?? 50,
        });
        db.activities.unshift({
          id: nextId('activity'), lead: created.id, kind: 'created',
          kind_display: 'Created', summary: `Lead created (${SOURCE_LABEL[created.source]})`,
          body: '', created_at: nowIso(),
        });
        save();
        return { data: created, status: 201 };
      }
    }
    if (id) {
      if (method === 'get') return { data: serializeLeadDetail(db.leads.find((l) => l.id === id) || leads.retrieve(id)) };
      if (method === 'patch' || method === 'put') {
        const prev = db.leads.find((l) => l.id === id);
        const prevStage = prev?.stage;
        const updated = leads.update(id, body);
        if (prevStage && updated.stage !== prevStage) {
          db.activities.unshift({
            id: nextId('activity'), lead: id, kind: 'stage_change', kind_display: 'Stage Change',
            summary: `Stage: ${prevStage} -> ${updated.stage}`, body: '', created_at: nowIso(),
          });
          save();
        }
        return { data: updated };
      }
      if (method === 'delete') { leads.remove(id); return { data: null, status: 204 }; }
    }
  }

  // ---- templates ----
  if (seg[0] === 'crm' && seg[1] === 'templates') {
    const id = Number(seg[2]);
    const tpls = collection(db, 'templates', 'template', (x) => x);
    if (seg[3] === 'preview' && method === 'post') {
      const tpl = db.templates.find((t) => t.id === id);
      if (!tpl) throw new HttpError(404, { detail: 'Not found.' });
      return { data: render(tpl, buildContext(body)) };
    }
    if (!seg[2]) {
      if (method === 'get') return { data: tpls.list() };
      if (method === 'post') return { data: tpls.create(body, { times_used: 0 }), status: 201 };
    }
    if (id) {
      if (method === 'get') return { data: tpls.retrieve(id) };
      if (method === 'patch' || method === 'put') return { data: tpls.update(id, body) };
      if (method === 'delete') { tpls.remove(id); return { data: null, status: 204 }; }
    }
  }

  // ---- outreach emails ----
  if (seg[0] === 'crm' && seg[1] === 'emails') {
    const id = Number(seg[2]);
    if (seg[2] === 'mail_status') return { data: { configured: true, receiving: true } };
    if (seg[2] === 'draft' && method === 'post') {
      const ctx = buildContext(body);
      let subject = body.subject || '';
      let bodyText = body.body || '';
      let template = null;
      if (body.template) {
        template = db.templates.find((t) => t.id === Number(body.template));
        if (template) ({ subject, body: bodyText } = render(template, ctx));
      }
      const lead = body.lead ? db.leads.find((l) => l.id === Number(body.lead)) : null;
      const toEmail = body.to_email || (lead ? lead.email : '');
      if (!toEmail) throw new HttpError(400, { detail: 'A recipient address is required.' });
      const email = {
        id: nextId('email'), lead: lead ? lead.id : null, template: template ? template.id : null,
        to_email: toEmail, to_name: body.to_name || (lead ? lead.name : ''), subject, body: bodyText,
        status: 'draft', scheduled_for: null, sent_at: null, error_message: '',
        message_id: '', in_reply_to: '', references: '', created_at: nowIso(), updated_at: nowIso(),
      };
      db.emails.unshift(email);
      if (template) template.times_used += 1;
      if (lead) db.activities.unshift({
        id: nextId('activity'), lead: lead.id, kind: 'email_draft', kind_display: 'Email Drafted',
        summary: `Drafted: ${subject}`, body: bodyText, created_at: nowIso(),
      });
      save();
      return { data: serializeEmail(email), status: 201 };
    }
    if (seg[3] === 'send' && method === 'post') {
      const email = db.emails.find((e) => e.id === id);
      if (!email) throw new HttpError(404, { detail: 'Not found.' });
      if (email.status === 'sent') throw new HttpError(400, { detail: 'This email was already sent.' });
      email.status = 'sent';
      email.sent_at = nowIso();
      email.error_message = '';
      if (!email.message_id) email.message_id = `<demo-${email.id}@example.com>`;
      const lead = email.lead ? db.leads.find((l) => l.id === email.lead) : null;
      if (lead) {
        lead.last_contacted_at = email.sent_at;
        if (lead.stage === 'new') lead.stage = 'contacted';
        db.activities.unshift({
          id: nextId('activity'), lead: lead.id, kind: 'email_sent', kind_display: 'Email Sent',
          summary: `Sent: ${email.subject}`, body: email.body, created_at: nowIso(),
        });
      }
      save();
      return { data: serializeEmail(email) };
    }
    if (!seg[2]) {
      if (method === 'get') {
        let rows = db.emails.slice();
        if (query.status) rows = rows.filter((e) => e.status === query.status);
        return { data: rows.map(serializeEmail) };
      }
      if (method === 'post') {
        const email = {
          id: nextId('email'), lead: body.lead || null, template: body.template || null,
          to_email: body.to_email || '', to_name: body.to_name || '', subject: body.subject || '',
          body: body.body || '', status: body.status || 'draft', scheduled_for: body.scheduled_for || null,
          sent_at: null, error_message: '', message_id: '', in_reply_to: '', references: '',
          created_at: nowIso(), updated_at: nowIso(),
        };
        db.emails.unshift(email);
        if (email.template) {
          const tpl = db.templates.find((t) => t.id === Number(email.template));
          if (tpl) tpl.times_used += 1;
        }
        save();
        return { data: serializeEmail(email), status: 201 };
      }
    }
    if (id) {
      const email = db.emails.find((e) => e.id === id);
      if (method === 'get') { if (!email) throw new HttpError(404, { detail: 'Not found.' }); return { data: serializeEmail(email) }; }
      if (method === 'patch' || method === 'put') {
        if (!email) throw new HttpError(404, { detail: 'Not found.' });
        Object.assign(email, body, { id, updated_at: nowIso() });
        save();
        return { data: serializeEmail(email) };
      }
      if (method === 'delete') {
        const idx = db.emails.findIndex((e) => e.id === id);
        if (idx === -1) throw new HttpError(404, { detail: 'Not found.' });
        db.emails.splice(idx, 1); save();
        return { data: null, status: 204 };
      }
    }
  }

  // ---- tasks ----
  if (seg[0] === 'crm' && seg[1] === 'tasks') {
    const id = Number(seg[2]);
    const tasks = collection(db, 'tasks', 'task', serializeTask);
    if (!seg[2]) {
      if (method === 'get') return { data: tasks.list() };
      if (method === 'post') return { data: tasks.create(body, { is_done: body.is_done || false, priority: body.priority || 'medium' }), status: 201 };
    }
    if (id) {
      const task = db.tasks.find((t) => t.id === id);
      if (method === 'get') return { data: tasks.retrieve(id) };
      if (method === 'patch' || method === 'put') {
        if (!task) throw new HttpError(404, { detail: 'Not found.' });
        Object.assign(task, body, { id });
        if (task.is_done && !task.completed_at) task.completed_at = nowIso();
        if (!task.is_done && task.completed_at) task.completed_at = null;
        save();
        return { data: serializeTask(task) };
      }
      if (method === 'delete') { tasks.remove(id); return { data: null, status: 204 }; }
    }
  }

  // ---- inbox (contact submissions) ----
  if (seg[0] === 'crm' && seg[1] === 'inbox') {
    const id = Number(seg[2]);
    if (seg[3] === 'convert' && method === 'post') {
      const sub = db.contactSubmissions.find((c) => c.id === id);
      if (!sub) throw new HttpError(404, { detail: 'Not found.' });
      return { data: convertToLead(db, sub.email, sub.name, 'portfolio', 'new', sub.subject, sub.message) };
    }
    if (!seg[2] && method === 'get') return { data: db.contactSubmissions.slice() };
    if (id) {
      const sub = db.contactSubmissions.find((c) => c.id === id);
      if (method === 'get') { if (!sub) throw new HttpError(404, { detail: 'Not found.' }); return { data: sub }; }
      if (method === 'delete') {
        const idx = db.contactSubmissions.findIndex((c) => c.id === id);
        if (idx === -1) throw new HttpError(404, { detail: 'Not found.' });
        db.contactSubmissions.splice(idx, 1); save();
        return { data: null, status: 204 };
      }
    }
  }

  // ---- mail (inbound emails) ----
  if (seg[0] === 'crm' && seg[1] === 'mail') {
    const id = Number(seg[2]);
    if (seg[2] === 'sync' && method === 'post') {
      const log = { id: nextId('activity'), started_at: nowIso(), finished_at: nowIso(), fetched: 0, created: 0, matched_leads: 0, ok: true, error_message: '' };
      return { data: log };
    }
    if (seg[2] === 'sync_status') {
      return {
        data: {
          configured: true,
          unread: db.inboundEmails.filter((m) => !m.is_read && !m.is_archived).length,
          total: db.inboundEmails.length,
          last_sync: { id: 1, started_at: nowIso(), finished_at: nowIso(), fetched: 5, created: 0, matched_leads: 3, ok: true, error_message: '' },
        },
      };
    }
    if (seg[3] === 'read' && method === 'post') {
      const m = db.inboundEmails.find((x) => x.id === id);
      if (!m) throw new HttpError(404, { detail: 'Not found.' });
      m.is_read = body.is_read !== false; save();
      return { data: serializeMail(m) };
    }
    if (seg[3] === 'archive' && method === 'post') {
      const m = db.inboundEmails.find((x) => x.id === id);
      if (!m) throw new HttpError(404, { detail: 'Not found.' });
      m.is_archived = body.is_archived !== false; save();
      return { data: serializeMail(m) };
    }
    if (seg[3] === 'convert' && method === 'post') {
      const m = db.inboundEmails.find((x) => x.id === id);
      if (!m) throw new HttpError(404, { detail: 'Not found.' });
      const result = convertToLead(db, m.from_email, m.from_name || m.from_email, 'email', 'replied', m.subject, m.snippet);
      db.inboundEmails.filter((x) => x.from_email.toLowerCase() === m.from_email.toLowerCase() && !x.lead)
        .forEach((x) => { x.lead = result.lead.id; });
      save();
      return { data: result };
    }
    if (seg[3] === 'reply' && method === 'post') {
      const m = db.inboundEmails.find((x) => x.id === id);
      if (!m) throw new HttpError(404, { detail: 'Not found.' });
      const text = (body.body || '').trim();
      if (!text) throw new HttpError(400, { detail: 'A reply needs a body.' });
      const subject = body.subject || (m.subject.toLowerCase().startsWith('re:') ? m.subject : `Re: ${m.subject}`);
      const email = {
        id: nextId('email'), lead: m.lead || null, template: null, to_email: m.from_email,
        to_name: m.from_name, subject: subject.slice(0, 300), body: text,
        status: body.send ? 'sent' : 'draft', scheduled_for: null,
        sent_at: body.send ? nowIso() : null, error_message: '',
        message_id: body.send ? `<demo-reply-${nextId('activity')}@example.com>` : '',
        in_reply_to: m.message_id, references: [m.references, m.message_id].filter(Boolean).join(' '),
        created_at: nowIso(), updated_at: nowIso(),
      };
      db.emails.unshift(email);
      if (body.send && !m.is_read) m.is_read = true;
      save();
      return { data: serializeEmail(email), status: 201 };
    }
    if (!seg[2] && method === 'get') {
      let rows = db.inboundEmails.slice();
      rows = rows.filter((m) => (query.archived === 'true' ? m.is_archived : !m.is_archived));
      if (query.unread === 'true') rows = rows.filter((m) => !m.is_read);
      if (query.lead) rows = rows.filter((m) => m.lead === Number(query.lead));
      if (query.search) {
        const q = query.search.toLowerCase();
        rows = rows.filter((m) => [m.subject, m.from_email, m.from_name, m.body_text].some((f) => (f || '').toLowerCase().includes(q)));
      }
      return { data: rows.map(serializeMail) };
    }
    if (id && method === 'get') {
      const m = db.inboundEmails.find((x) => x.id === id);
      if (!m) throw new HttpError(404, { detail: 'Not found.' });
      return { data: serializeMail(m) };
    }
  }

  // ---- managed content + public content ----
  if (seg[0] === 'crm' && seg[1] === 'manage') {
    return contentRoute(db, seg[2], Number(seg[3]), method, body);
  }
  if (['profile', 'projects', 'experiences', 'achievements', 'skills', 'skill-categories', 'contact'].includes(seg[0]) && !seg.includes('crm')) {
    if (seg[0] === 'contact' && method === 'post') {
      const sub = { id: nextId('contact'), name: body.name || '', email: body.email || '', subject: body.subject || '', message: body.message || '', submitted_at: nowIso() };
      db.contactSubmissions.unshift(sub); save();
      return { data: sub, status: 201 };
    }
    return contentRoute(db, seg[0], Number(seg[1]), method, body);
  }

  throw new HttpError(404, { detail: `No demo handler for ${method.toUpperCase()} ${path}` });
}

function convertToLead(db, email, name, source, stage, subject, message) {
  let lead = db.leads.find((l) => (l.email || '').toLowerCase() === (email || '').toLowerCase());
  let created = false;
  if (!lead) {
    created = true;
    lead = {
      id: nextId('lead'), name: name || email, email, company: '', role: '', linkedin_url: '',
      website: '', location: '', stage, source, score: 50, tags: '',
      notes: `${subject}\n\n${message}`, apply_url: '', resume_variant: '', posted_at: null,
      external_id: '', last_contacted_at: null, replied_at: null, next_follow_up_at: null,
      created_at: nowIso(), updated_at: nowIso(),
    };
    db.leads.unshift(lead);
    db.activities.unshift({
      id: nextId('activity'), lead: lead.id, kind: 'created', kind_display: 'Created',
      summary: `Converted from ${source === 'email' ? 'inbound email' : 'contact form'}: ${subject}`,
      body: message, created_at: nowIso(),
    });
    save();
  }
  return { lead: serializeLead(lead), created };
}

function contentRoute(db, resource, id, method, body) {
  const map = {
    profile: ['profile', 'project', serializeProfileList, true],
    projects: ['projects', 'project', (x) => x, false],
    experiences: ['experiences', 'experience', serializeExperience, false],
    achievements: ['achievements', 'achievement', (x) => x, false],
    skills: ['skills', 'skill', serializeSkill, false],
    'skill-categories': ['skillCategories', 'skillCategory', (x) => x, false],
  };
  const entry = map[resource];
  if (!entry) throw new HttpError(404, { detail: 'Not found.' });
  const [key, seq, serialize, isSingleton] = entry;

  if (isSingleton) {
    if (method === 'get') return { data: [db.profile] };
    if ((method === 'patch' || method === 'put') && id) {
      Object.assign(db.profile, body, { id: db.profile.id });
      save();
      return { data: db.profile };
    }
  }

  const col = collection(db, key, seq, serialize);
  if (!id) {
    if (method === 'get') return { data: col.list() };
    if (method === 'post') return { data: col.create(body), status: 201 };
  }
  if (id) {
    if (method === 'get') return { data: col.retrieve(id) };
    if (method === 'patch' || method === 'put') return { data: col.update(id, body) };
    if (method === 'delete') { col.remove(id); return { data: null, status: 204 }; }
  }
  throw new HttpError(405, { detail: 'Method not allowed in demo.' });
}

function serializeProfileList(x) { return x; }

// --- the adapter ---------------------------------------------------------- //

export default function mockAdapter(config) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        const result = route(config);
        resolve({
          data: clone(result.data),
          status: result.status || 200,
          statusText: 'OK',
          headers: {},
          config,
          request: {},
        });
      } catch (err) {
        if (err && err.__http) {
          reject({
            response: { data: err.data, status: err.status, statusText: 'Error', headers: {}, config },
            config,
            isAxiosError: true,
            message: err.data?.detail || 'Request failed',
          });
        } else {
          reject(err);
        }
      }
    }, LATENCY_MS);
  });
}
