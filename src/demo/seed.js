/**
 * Seed data for the public demo.
 *
 * Everything here is fictional. No real leads, recruiters, companies or emails
 * appear in this build — it exists only to show what the CRM does. Dates are
 * generated relative to "now" at seed time so the pipeline always looks current.
 */

const now = Date.now();
const DAY = 24 * 60 * 60 * 1000;

const iso = (offsetDays = 0, hour = 10) => {
  const d = new Date(now - offsetDays * DAY);
  d.setHours(hour, Math.floor(Math.random() * 55), 0, 0);
  return d.toISOString();
};
const isoAhead = (inDays, hour = 10) => iso(-inDays, hour);
const dateOnly = (offsetDays = 0) =>
  new Date(now - offsetDays * DAY).toISOString().slice(0, 10);

// --- Public portfolio content --------------------------------------------- //

const profile = {
  id: 1,
  full_name: 'Prateek Sahu',
  tagline: 'Backend & Applied-ML Engineer',
  bio:
    'Final-year CS undergraduate building backend systems and applied-ML tools. ' +
    'I like turning a messy real-world workflow into one clean system. This CRM ' +
    'is one of them — a portfolio that is also instrumented outreach software.',
  email: 'hello@example.com',
  phone: '',
  location: 'India',
  github_url: 'https://github.com/Prateeks16',
  linkedin_url: 'https://www.linkedin.com/in/',
  resume_pdf: null,
  profile_picture: null,
};

const projects = [
  {
    id: 1,
    title: 'Portfolio CRM',
    short_description: 'A portfolio that is also a private outreach CRM.',
    description:
      'One Django + React system with two faces over a single content store: a ' +
      'public portfolio and a private CRM that runs the outbound campaign driving ' +
      'traffic to it. Leads, a seven-stage pipeline, templated outreach, mail sync ' +
      'and privacy-preserving analytics. (This demo is that CRM, with sample data.)',
    tech_stack: 'Django, DRF, React, PostgreSQL',
    github_url: 'https://github.com/Prateeks16',
    live_demo_url: '',
    image: null,
    created_at: iso(40),
  },
  {
    id: 2,
    title: 'Obsidian RAG Email Sender',
    short_description: 'Ask your notes, then draft grounded emails from them.',
    description:
      'A retrieval-augmented app over an Obsidian vault: chunk and embed notes, ' +
      'retrieve by similarity, and generate answers or emails grounded in the ' +
      'retrieved context with source citations.',
    tech_stack: 'Python, Streamlit, Gemini, NumPy',
    github_url: 'https://github.com/Prateeks16/obsidian-rag-email-sender',
    live_demo_url: '',
    image: null,
    created_at: iso(30),
  },
  {
    id: 3,
    title: 'Job Scan Ingest Pipeline',
    short_description: 'Scheduled scan that files new roles straight into the pipeline.',
    description:
      'A tokenised ingest endpoint that turns scraped job postings into scored ' +
      'leads, picking the right resume variant from the role text.',
    tech_stack: 'Python, Django, Cron',
    github_url: 'https://github.com/Prateeks16',
    live_demo_url: '',
    image: null,
    created_at: iso(22),
  },
];

const experiences = [
  {
    id: 1,
    company_name: 'Sample Labs (demo)',
    position: 'Backend Engineering Intern',
    location: 'Remote',
    start_date: dateOnly(320),
    end_date: dateOnly(140),
    description:
      'Sample entry for the demo. Built and shipped internal APIs, improved ' +
      'query performance and added test coverage.',
    technologies_used: 'Python, Django, PostgreSQL, Redis',
    company_logo: null,
  },
  {
    id: 2,
    company_name: 'Open Source (demo)',
    position: 'Contributor',
    location: 'Remote',
    start_date: dateOnly(120),
    end_date: null,
    description: 'Sample entry for the demo. Contributions to developer tooling.',
    technologies_used: 'Python, React',
    company_logo: null,
  },
];

const achievements = [
  {
    id: 1,
    title: 'Hackathon Finalist (demo)',
    description: 'Sample achievement used to populate the demo.',
    organization: 'Sample University',
    date: dateOnly(90),
    achievement_type: 'Competition',
    badge_image: null,
    certificate_url: '',
  },
  {
    id: 2,
    title: '500 DSA problems solved (demo)',
    description: 'Sample achievement used to populate the demo.',
    organization: 'Self',
    date: dateOnly(200),
    achievement_type: 'Milestone',
    badge_image: null,
    certificate_url: '',
  },
];

const skillCategories = [
  { id: 1, name: 'Languages', order: 1 },
  { id: 2, name: 'Backend', order: 2 },
  { id: 3, name: 'Frontend', order: 3 },
  { id: 4, name: 'Data & ML', order: 4 },
];

const skills = [
  { id: 1, category: 1, name: 'Python', proficiency: 'Advanced', order: 1 },
  { id: 2, category: 1, name: 'Java', proficiency: 'Intermediate', order: 2 },
  { id: 3, category: 1, name: 'Go', proficiency: 'Intermediate', order: 3 },
  { id: 4, category: 2, name: 'Django / DRF', proficiency: 'Advanced', order: 1 },
  { id: 5, category: 2, name: 'PostgreSQL', proficiency: 'Advanced', order: 2 },
  { id: 6, category: 2, name: 'REST APIs', proficiency: 'Advanced', order: 3 },
  { id: 7, category: 3, name: 'React', proficiency: 'Advanced', order: 1 },
  { id: 8, category: 3, name: 'Tailwind CSS', proficiency: 'Advanced', order: 2 },
  { id: 9, category: 4, name: 'RAG / Embeddings', proficiency: 'Intermediate', order: 1 },
  { id: 10, category: 4, name: 'NumPy / Pandas', proficiency: 'Intermediate', order: 2 },
];

// --- CRM: leads, activities, outreach ------------------------------------- //

// stage, source values must match the backend choices.
const leadSpecs = [
  ['Aisha Verma', 'Northwind Labs', 'Senior Backend Engineer', 'interviewing', 'linkedin', 82, 'backend,priority', 2, 1],
  ['Daniel Okafor', 'BrightPay', 'Platform Engineer', 'replied', 'portfolio', 74, 'backend', 5, 3],
  ['TalentBridge Recruiting', 'TalentBridge', 'AI/ML Engineer', 'contacted', 'referral', 68, 'ai_ml,recruiter', 9, null],
  ['Meera Nair', 'Cloudpeak', 'Software Engineer II', 'offer', 'linkedin', 91, 'backend,priority', 1, 0.5],
  ['James Whitfield', 'Datastride', 'Backend Developer', 'new', 'job_board', 55, 'backend', 0, null],
  ['Sofia Ramos', 'Nimbus AI', 'ML Engineer', 'interviewing', 'referral', 79, 'ai_ml', 3, 2],
  ['Rahul Kapoor', 'Finlytics', 'Golang Engineer', 'won', 'linkedin', 88, 'backend', 12, null],
  ['GreenByte HR', 'GreenByte', 'Full-Stack Engineer', 'lost', 'job_board', 40, 'fullstack', 20, null],
  ['Emily Carter', 'Vantage', 'Data Engineer', 'applied', 'application_form', 63, 'data', 7, null],
  ['Hiro Tanaka', 'Skylark', 'Backend Engineer (Python)', 'contacted', 'github', 70, 'backend,python', 4, 6],
  ['Priya Menon', 'Corewave', 'Applied Scientist', 'replied', 'linkedin', 77, 'ai_ml,priority', 6, 1],
  ['Automated: SDE Intern', 'Zephyr Systems', 'Software Engineer Intern', 'new', 'job_scan', 58, 'backend,intern', 0, null],
  ['Marcus Lee', 'Ledgerline', 'Backend Engineer', 'new', 'portfolio', 60, 'backend', 0, null],
  ['Nadia Hassan', 'Orbital', 'Platform / Infra Engineer', 'interviewing', 'linkedin', 84, 'backend,priority', 3, 3],
];

const leads = leadSpecs.map((s, i) => {
  const [name, company, role, stage, source, score, tags, contactedDaysAgo, followUpInDays] = s;
  const id = i + 1;
  const created = 8 + i * 2;
  const emailSlug = name.toLowerCase().replace(/[^a-z]+/g, '.').replace(/^\.|\.$/g, '');
  return {
    id,
    name,
    email: source === 'job_scan' ? '' : `${emailSlug}@example.com`,
    company,
    role,
    linkedin_url: source === 'linkedin' ? 'https://www.linkedin.com/in/' : '',
    website: '',
    location: ['Bengaluru', 'Remote', 'Pune', 'Hyderabad', 'Delhi NCR'][i % 5],
    stage,
    source,
    score,
    tags,
    notes: '',
    apply_url: source === 'job_scan' ? 'https://example.com/jobs/sde-intern' : '',
    resume_variant: '',
    posted_at: source === 'job_scan' ? dateOnly(2) : null,
    external_id: source === 'job_scan' ? `scan-${id}` : '',
    last_contacted_at: contactedDaysAgo ? iso(contactedDaysAgo) : null,
    replied_at: ['replied', 'interviewing', 'offer', 'won'].includes(stage) ? iso(Math.max(1, contactedDaysAgo - 1)) : null,
    next_follow_up_at: followUpInDays != null ? isoAhead(followUpInDays) : null,
    created_at: iso(created),
    updated_at: iso(Math.max(0, contactedDaysAgo - 1)),
  };
});

// A few overdue follow-ups so the "due" badge has something to show.
leads[1].next_follow_up_at = iso(2); // Daniel — overdue
leads[9].next_follow_up_at = iso(1); // Hiro — overdue

let activityId = 0;
const activities = [];
const addActivity = (lead, kind, summary, body, daysAgo) => {
  activityId += 1;
  activities.push({
    id: activityId,
    lead: lead.id,
    kind,
    kind_display: {
      note: 'Note', email_sent: 'Email Sent', email_received: 'Reply Received',
      email_draft: 'Email Drafted', stage_change: 'Stage Change', call: 'Call',
      meeting: 'Meeting', created: 'Created',
    }[kind] || 'Note',
    summary,
    body: body || '',
    created_at: iso(daysAgo),
  });
};

leads.forEach((lead, i) => {
  const base = 8 + i * 2;
  addActivity(lead, 'created', `Lead created (${sourceLabel(lead.source)})`, '', base);
  if (lead.last_contacted_at) {
    addActivity(lead, 'email_sent', `Sent: Intro — ${lead.role}`, '', Math.max(1, base - 3));
  }
  if (['replied', 'interviewing', 'offer', 'won'].includes(lead.stage)) {
    addActivity(lead, 'email_received', 'Reply Received', 'Thanks for reaching out — happy to chat.', Math.max(1, base - 4));
  }
  if (['interviewing', 'offer', 'won'].includes(lead.stage)) {
    addActivity(lead, 'stage_change', `Stage: contacted -> ${lead.stage}`, '', Math.max(0, base - 5));
  }
});

// Reverse so newest activity is first (matches backend ordering).
activities.reverse();

const templates = [
  {
    id: 1,
    name: 'Cold intro — Backend',
    category: 'Outreach',
    subject: 'Backend engineer interested in {{company}}',
    body:
      'Hi {{first_name}},\n\nI came across the {{role}} role at {{company}} and wanted to reach out. ' +
      'I build backend systems in Python/Django and Go — recent work is on my portfolio: {{my_portfolio}}.\n\n' +
      'Would you be open to a quick chat?\n\nBest,\n{{my_name}}',
    description: 'First-touch email for backend roles.',
    times_used: 14,
    created_at: iso(45),
    updated_at: iso(10),
  },
  {
    id: 2,
    name: 'Cold intro — AI/ML',
    category: 'Outreach',
    subject: 'Applied-ML engineer — {{role}} at {{company}}',
    body:
      'Hi {{first_name}},\n\nThe {{role}} opening at {{company}} looks like a great fit. ' +
      'I work on RAG and vector search; you can see a live demo and code on my portfolio: {{my_portfolio}}.\n\n' +
      'Open to connecting?\n\nBest,\n{{my_name}}',
    description: 'First-touch email for AI/ML roles.',
    times_used: 8,
    created_at: iso(44),
    updated_at: iso(12),
  },
  {
    id: 3,
    name: 'Follow-up (no reply)',
    category: 'Follow-up',
    subject: 'Re: {{role}} at {{company}}',
    body:
      'Hi {{first_name}},\n\nJust floating this back to the top of your inbox. ' +
      'Still very interested in the {{role}} role — happy to share more whenever useful.\n\nThanks,\n{{my_name}}',
    description: 'Gentle nudge after a few days of silence.',
    times_used: 21,
    created_at: iso(43),
    updated_at: iso(6),
  },
  {
    id: 4,
    name: 'Thank you — post interview',
    category: 'Follow-up',
    subject: 'Thank you — {{role}} conversation',
    body:
      'Hi {{first_name}},\n\nThanks for the conversation about the {{role}} role today. ' +
      'It was great to learn more about the team at {{company}}. Looking forward to next steps.\n\nBest,\n{{my_name}}',
    description: 'Sent within a day of an interview.',
    times_used: 5,
    created_at: iso(20),
    updated_at: iso(3),
  },
];

const emails = [
  mkEmail(1, 1, 1, 'sent', 3),
  mkEmail(2, 2, 1, 'sent', 5),
  mkEmail(3, 4, 1, 'sent', 1),
  mkEmail(4, 6, 2, 'sent', 3),
  mkEmail(5, 5, 1, 'draft', 0),
  mkEmail(6, 13, 1, 'draft', 0),
  mkEmail(7, 3, 2, 'draft', 0),
  mkEmail(8, 11, 4, 'sent', 2),
];

const tasks = [
  mkTask(1, 'Follow up with Daniel (BrightPay)', 2, 'high', false, -2, 'Overdue — no reply since intro.'),
  mkTask(2, 'Prep for Aisha Verma interview', 1, 'high', false, 2, 'Round 2, system design.'),
  mkTask(3, 'Send thank-you to Priya (Corewave)', 11, 'medium', false, 1, ''),
  mkTask(4, 'Review Cloudpeak offer', 4, 'high', false, 0.5, 'Compare comp + team.'),
  mkTask(5, 'Chase Hiro at Skylark', 10, 'medium', false, -1, 'Overdue nudge.'),
  mkTask(6, 'Update AI/ML resume variant', null, 'low', true, -3, ''),
  mkTask(7, 'Weekly pipeline review', null, 'medium', true, -1, ''),
];

const contactSubmissions = [
  mkContact(1, 'Olivia Bennett', 'Quick question about your CRM project', 'Loved the portfolio — is the CRM open source?', 1),
  mkContact(2, 'Recruiter @ Skylark', 'Backend role — are you open?', 'We have a Python backend role that might fit. Reply if interested.', 2),
  mkContact(3, 'Arjun Deshpande', 'Collaboration', 'Building a side project, would love a backend hand.', 4),
  mkContact(4, 'Grace Liu', 'Great analytics section', 'How did you build the privacy-preserving analytics?', 6),
];

const inboundEmails = [
  mkMail(1, 'Aisha Verma', 'aisha.verma@example.com', 'Re: Backend engineer interested in Northwind Labs', "Thanks Prateek — let's set up a call this week.", 2, false, 1),
  mkMail(2, 'Meera Nair', 'meera.nair@example.com', 'Re: Software Engineer II at Cloudpeak', 'Good news — we would like to move ahead with an offer.', 1, false, 4),
  mkMail(3, 'Sofia Ramos', 'sofia.ramos@example.com', 'Re: ML Engineer at Nimbus AI', 'Scheduling the next round now, stand by.', 3, true, 6),
  mkMail(4, 'noreply', 'jobs@zephyr.example.com', 'Your application was received', 'We have received your application for SDE Intern.', 2, true, null),
  mkMail(5, 'Priya Menon', 'priya.menon@example.com', 'Re: Applied Scientist at Corewave', 'Appreciate the note — reviewing internally.', 1, false, 11),
];

// --- helpers -------------------------------------------------------------- //

function sourceLabel(source) {
  return {
    portfolio: 'Portfolio Contact Form', linkedin: 'LinkedIn', referral: 'Referral',
    job_board: 'Job Board', application_form: 'Application Form', github: 'GitHub',
    job_scan: 'Automated Job Scan', email: 'Inbound Email', manual: 'Manually Added',
    other: 'Other',
  }[source] || 'Other';
}

function mkEmail(id, leadId, templateId, status, daysAgo) {
  const lead = leads[leadId - 1];
  const subject =
    status === 'draft'
      ? `Backend engineer interested in ${lead.company}`
      : `Re: ${lead.role} at ${lead.company}`;
  return {
    id,
    lead: lead.id,
    lead_name: lead.name,
    template: templateId,
    to_email: lead.email || `${lead.company.toLowerCase().replace(/\W+/g, '')}@example.com`,
    to_name: lead.name,
    subject,
    body:
      `Hi ${lead.name.split(' ')[0]},\n\nReaching out about the ${lead.role} role at ` +
      `${lead.company}. I build backend systems and would love to connect.\n\nBest,\nPrateek`,
    status,
    status_display: status.charAt(0).toUpperCase() + status.slice(1),
    scheduled_for: null,
    sent_at: status === 'sent' ? iso(daysAgo) : null,
    error_message: '',
    message_id: status === 'sent' ? `<demo-${id}@example.com>` : '',
    in_reply_to: '',
    references: '',
    created_at: iso(daysAgo + 1),
    updated_at: iso(daysAgo),
  };
}

function mkTask(id, title, leadId, priority, done, dueInDays, description) {
  return {
    id,
    title,
    description: description || '',
    lead: leadId,
    lead_name: leadId ? leads[leadId - 1].name : null,
    due_date: dueInDays == null ? null : new Date(now + dueInDays * DAY).toISOString().slice(0, 10),
    priority,
    is_done: done,
    completed_at: done ? iso(1) : null,
    created_at: iso(id + 2),
  };
}

function mkContact(id, name, subject, message, daysAgo) {
  return {
    id,
    name,
    email: `${name.toLowerCase().replace(/[^a-z]+/g, '.').replace(/^\.|\.$/g, '')}@example.com`,
    subject,
    message,
    submitted_at: iso(daysAgo),
  };
}

function mkMail(id, fromName, fromEmail, subject, snippet, daysAgo, read, leadId) {
  return {
    id,
    message_id: `<in-${id}@example.com>`,
    in_reply_to: '',
    references: '',
    thread_key: `thread-${id}`,
    from_email: fromEmail,
    from_name: fromName,
    to_email: 'hello@example.com',
    cc_email: '',
    subject,
    body_text: snippet + '\n\nBest regards.',
    body_html: '',
    snippet,
    has_attachments: false,
    lead: leadId,
    lead_name: leadId ? leads[leadId - 1].name : null,
    replies_to: null,
    replies_to_subject: null,
    is_read: read,
    is_archived: false,
    sent_at: iso(daysAgo),
    synced_at: iso(daysAgo),
  };
}

export function buildSeed() {
  return {
    // public content
    profile,
    projects,
    experiences,
    achievements,
    skillCategories,
    skills,
    // crm
    leads,
    activities,
    templates,
    emails,
    tasks,
    contactSubmissions,
    inboundEmails,
    // counters for new rows
    _seq: {
      lead: leads.length,
      activity: activities.length,
      template: templates.length,
      email: emails.length,
      task: tasks.length,
      contact: contactSubmissions.length,
      mail: inboundEmails.length,
      project: projects.length,
      experience: experiences.length,
      achievement: achievements.length,
      skill: skills.length,
      skillCategory: skillCategories.length,
    },
    _seededAt: new Date(now).toISOString(),
  };
}
