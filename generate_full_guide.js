const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  VerticalAlign, PageBreak, LevelFormat, Header, Footer, PageNumber,
  NumberFormat
} = require('docx');
const fs = require('fs');

// ─── COLOUR PALETTE ────────────────────────────────────────────────────────
const C = {
  brand:     '1F4E79', // deep navy
  accent:    '2E75B6', // medium blue
  accent2:   '4472C4', // lighter blue
  gold:      'C7960C', // warm gold for tips
  red:       'C00000', // warnings
  green:     '375623', // success / checklists
  lightBlue: 'D6E4F0', // table header fill
  lightGold: 'FFF2CC', // tip box fill
  lightRed:  'FFE0E0', // warning fill
  lightGreen:'E2EFDA', // checklist fill
  white:     'FFFFFF',
  dark:      '1A1A1A',
  mid:       '404040',
  light:     '767676',
  rule:      'ADB9CA',
};

// ─── HELPERS ───────────────────────────────────────────────────────────────
const border1 = (color = C.rule) => ({ style: BorderStyle.SINGLE, size: 1, color });
const noBorder = () => ({ style: BorderStyle.NONE, size: 0, color: 'FFFFFF' });
const allBorders = (color = C.rule) => ({ top: border1(color), bottom: border1(color), left: border1(color), right: border1(color) });
const noBorders = () => ({ top: noBorder(), bottom: noBorder(), left: noBorder(), right: noBorder() });

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 120 },
    children: [new TextRun({ text, bold: true, color: C.brand, size: 36, font: 'Arial' })]
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 100 },
    children: [new TextRun({ text, bold: true, color: C.accent, size: 28, font: 'Arial' })]
  });
}
function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 80 },
    children: [new TextRun({ text, bold: true, color: C.accent2, size: 24, font: 'Arial' })]
  });
}
function h4(text) {
  return new Paragraph({
    spacing: { before: 160, after: 60 },
    children: [new TextRun({ text, bold: true, color: C.mid, size: 22, font: 'Arial' })]
  });
}
function p(text, opts = {}) {
  return new Paragraph({
    spacing: { before: 60, after: 80 },
    children: [new TextRun({ text, color: C.dark, size: 22, font: 'Arial', ...opts })]
  });
}
function pMixed(runs) {
  return new Paragraph({
    spacing: { before: 60, after: 80 },
    children: runs.map(r => new TextRun({ color: C.dark, size: 22, font: 'Arial', ...r }))
  });
}
function bullet(text, level = 0, numbering_ref = 'bullets') {
  return new Paragraph({
    numbering: { reference: numbering_ref, level },
    spacing: { before: 40, after: 40 },
    children: [new TextRun({ text, color: C.dark, size: 22, font: 'Arial' })]
  });
}
function bulletMixed(runs, level = 0) {
  return new Paragraph({
    numbering: { reference: 'bullets', level },
    spacing: { before: 40, after: 40 },
    children: runs.map(r => new TextRun({ color: C.dark, size: 22, font: 'Arial', ...r }))
  });
}
function numbered(text, level = 0) {
  return bullet(text, level, 'numbers');
}
function spacer(pts = 120) {
  return new Paragraph({ spacing: { before: 0, after: pts }, children: [new TextRun('')] });
}
function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}
function rule(color = C.accent) {
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color, space: 1 } },
    children: [new TextRun('')]
  });
}

function callout(type, text) {
  const configs = {
    tip:      { fill: C.lightGold, color: C.gold,  icon: '💡 PRO TIP' },
    warning:  { fill: C.lightRed,  color: C.red,   icon: '⚠️ WARNING' },
    critical: { fill: C.lightRed,  color: C.red,   icon: '🔴 CRITICAL' },
    info:     { fill: C.lightBlue, color: C.accent, icon: '📘 NOTE' },
    new:      { fill: C.lightGreen, color: C.green, icon: '✅ JOB-READY ADDITION' },
    dayOne:   { fill: 'E8F4FD',    color: C.brand,  icon: '🎯 DAY 1 INSIGHT' },
  };
  const cfg = configs[type] || configs.info;
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [new TableRow({
      children: [new TableCell({
        borders: allBorders(cfg.color),
        shading: { fill: cfg.fill, type: ShadingType.CLEAR },
        margins: { top: 100, bottom: 100, left: 160, right: 160 },
        width: { size: 9360, type: WidthType.DXA },
        children: [
          new Paragraph({
            spacing: { before: 0, after: 40 },
            children: [new TextRun({ text: cfg.icon, bold: true, color: cfg.color, size: 20, font: 'Arial' })]
          }),
          new Paragraph({
            spacing: { before: 0, after: 0 },
            children: [new TextRun({ text, color: C.mid, size: 20, font: 'Arial' })]
          })
        ]
      })]
    })]
  });
}

function dataTable(headers, rows, colWidths) {
  const totalW = colWidths.reduce((a, b) => a + b, 0);
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) => new TableCell({
      borders: allBorders(C.accent),
      shading: { fill: C.lightBlue, type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      width: { size: colWidths[i], type: WidthType.DXA },
      children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: C.brand, size: 20, font: 'Arial' })] })]
    }))
  });
  const dataRows = rows.map((row, ri) => new TableRow({
    children: row.map((cell, ci) => new TableCell({
      borders: allBorders(C.rule),
      shading: { fill: ri % 2 === 0 ? C.white : 'F5F8FA', type: ShadingType.CLEAR },
      margins: { top: 60, bottom: 60, left: 120, right: 120 },
      width: { size: colWidths[ci], type: WidthType.DXA },
      children: [new Paragraph({ children: [new TextRun({ text: cell, color: C.dark, size: 19, font: 'Arial' })] })]
    }))
  }));
  return new Table({
    width: { size: totalW, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [headerRow, ...dataRows]
  });
}

function sectionBanner(secNum, title, subtitle) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [new TableRow({
      children: [new TableCell({
        borders: noBorders(),
        shading: { fill: C.brand, type: ShadingType.CLEAR },
        margins: { top: 200, bottom: 200, left: 300, right: 300 },
        width: { size: 9360, type: WidthType.DXA },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: secNum ? `SECTION ${secNum}` : '', color: C.lightBlue, size: 20, font: 'Arial', allCaps: true, spacing: { character: 120 } })]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: title, color: C.white, bold: true, size: 36, font: 'Arial' })]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: subtitle, color: 'BDD7EE', size: 22, font: 'Arial', italics: true })]
          }),
        ]
      })]
    })]
  });
}

function checklistTable(title, items) {
  const rows = items.map((item, i) => new TableRow({
    children: [
      new TableCell({
        borders: allBorders(C.green),
        shading: { fill: i % 2 === 0 ? C.white : C.lightGreen, type: ShadingType.CLEAR },
        margins: { top: 60, bottom: 60, left: 120, right: 60 },
        width: { size: 600, type: WidthType.DXA },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '☐', color: C.green, size: 22, font: 'Arial' })] })]
      }),
      new TableCell({
        borders: allBorders(C.green),
        shading: { fill: i % 2 === 0 ? C.white : C.lightGreen, type: ShadingType.CLEAR },
        margins: { top: 60, bottom: 60, left: 120, right: 120 },
        width: { size: 8760, type: WidthType.DXA },
        children: [new Paragraph({ children: [new TextRun({ text: item, color: C.dark, size: 20, font: 'Arial' })] })]
      })
    ]
  }));
  return [
    new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [600, 8760],
      rows: [
        new TableRow({
          children: [new TableCell({
            columnSpan: 2,
            borders: allBorders(C.green),
            shading: { fill: C.green, type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            width: { size: 9360, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: title, bold: true, color: C.white, size: 22, font: 'Arial' })] })]
          })]
        }),
        ...rows
      ]
    })
  ];
}

// ─── COVER PAGE (from first script) ─────────────────────────────────────────
function makeCoverPage() {
  return [
    spacer(800),
    new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [9360],
      rows: [new TableRow({
        children: [new TableCell({
          borders: noBorders(),
          shading: { fill: C.brand, type: ShadingType.CLEAR },
          margins: { top: 500, bottom: 500, left: 500, right: 500 },
          width: { size: 9360, type: WidthType.DXA },
          children: [
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'IBM STERLING B2B INTEGRATOR', color: 'BDD7EE', size: 28, font: 'Arial', allCaps: true, spacing: { character: 80 } })] }),
            spacer(60),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Complete Job-Ready Training Guide', color: C.white, bold: true, size: 52, font: 'Arial' })] }),
            spacer(40),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Production Environment Mastery  •  2026 Edition', color: 'BDD7EE', size: 26, font: 'Arial', italics: true })] }),
            spacer(200),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'ENHANCED BY A SENIOR BUSINESS ANALYST & EDI EXPERT', color: C.gold, size: 22, font: 'Arial', bold: true, allCaps: true })] }),
          ]
        })]
      })]
    }),
    spacer(300),
    new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [2340, 2340, 2340, 2340],
      rows: [new TableRow({
        children: [
          ['SECTION 0', 'Day 1 Survival Guide'],
          ['SECTION 1', 'Core Architecture'],
          ['SECTION 2', '10 Real Scenarios'],
          ['SECTION 3', '25 Lab Exercises'],
        ].map(([sec, lbl]) => new TableCell({
          borders: allBorders(C.accent),
          shading: { fill: C.lightBlue, type: ShadingType.CLEAR },
          margins: { top: 100, bottom: 100, left: 100, right: 100 },
          width: { size: 2340, type: WidthType.DXA },
          children: [
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: sec, bold: true, color: C.brand, size: 18, font: 'Arial' })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: lbl, color: C.accent, size: 18, font: 'Arial' })] }),
          ]
        }))
      }),
      new TableRow({
        children: [
          ['SECTION 4', '25 Interview Q&As'],
          ['SECTION 5', 'Troubleshooting'],
          ['SECTION 6', 'Alternative Tools'],
          ['SECTIONS 7-10', 'New: BA Excellence'],
        ].map(([sec, lbl]) => new TableCell({
          borders: allBorders(C.accent),
          shading: { fill: 'F0F4F8', type: ShadingType.CLEAR },
          margins: { top: 100, bottom: 100, left: 100, right: 100 },
          width: { size: 2340, type: WidthType.DXA },
          children: [
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: sec, bold: true, color: C.brand, size: 18, font: 'Arial' })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: lbl, color: C.accent, size: 18, font: 'Arial' })] }),
          ]
        }))
      })]
    }),
    pageBreak()
  ];
}

// ─── SECTION 0: DAY 1 SURVIVAL GUIDE (full from first script) ───────────────
function makeSection0() {
  return [
    sectionBanner('0', 'Your First 30 Days', 'The Day-1 Survival Guide Every EDI BA Needs'),
    spacer(120),
    callout('new', 'This entire section is a job-readiness addition. It does not exist in most training guides — and that is exactly why new EDI BAs feel lost on Day 1. Study this before your first day.'),
    spacer(120),

    h2('0.1  What Nobody Tells You Before You Start'),
    p('Most training guides teach you how a platform works. Very few tell you what your first week actually feels like. Here is the honest reality: on Day 1 as an EDI BA, you will likely be handed a pile of existing integrations you did not build, a list of "urgent" issues from partners you have never spoken to, and a codebase with no documentation. This is normal. This section prepares you for exactly that.'),
    spacer(80),
    callout('dayOne', 'The most important mindset on Day 1: your job is to ask great questions, listen more than you talk, and document everything you learn. Expertise comes within weeks. Credibility starts on Day 1.'),
    spacer(120),

    h2('0.2  Your First Week — Day-by-Day Action Plan'),
    h3('Day 1: Orient, Access, Listen'),
    ...checklistTable('Day 1 Actions', [
      'Request access to Sterling dashboard (Operations view, read-only first). Never make changes on Day 1.',
      'Request the Trading Partner inventory: a list of all active partners, their protocols (AS2/SFTP), and transaction types.',
      'Ask for the existing S2T (Source-to-Target) mapping documentation — it may be a spreadsheet, a Word doc, or a SharePoint folder.',
      'Identify who the "go-to" person is for each system: Sterling admin, ERP team lead, QA lead, network/firewall team.',
      'Locate the monitoring email alias or ticketing system where EDI alerts land.',
      'Ask your manager: "What is the #1 pain point with EDI right now?" — their answer tells you everything.',
      'Set up VPN access. Confirm you can reach the Sterling Operations console from home.',
      'Find out the on-call rotation for EDI — are you expected to be on call? From when?',
    ]),
    spacer(120),

    h3('Day 2-3: Map the Landscape'),
    ...checklistTable('Days 2-3 Actions', [
      'Browse Operations > Business Processes in Sterling. Note which BPs run most frequently — those are your critical paths.',
      'Go to Operations > Business Processes > Status=Halted. Are there any chronic failures? Ask why they exist.',
      'Pull the last 30 days of failure reports. Identify the top 3 recurring errors by frequency.',
      'Find and read the companion guides for your top 5 trading partners. Start with the highest-volume partner.',
      'Ask to shadow a colleague on a real issue or partner call if one arises.',
      'Locate the deployment and change management process: how are maps and BPs promoted from DEV to PROD?',
      'Identify which partners have SLA agreements and what the penalties are for non-compliance.',
    ]),
    spacer(120),

    h3('Days 4-5: Build Your First Mental Model'),
    ...checklistTable('Days 4-5 Actions', [
      'Draw a simple diagram: inbound data flow for your highest-volume partner from partner system → adapter → BP → map → ERP.',
      'Identify 1 "safe" map you can open in Map Editor and study (do not edit yet). Trace every mapping line.',
      'Review 1 recent successful and 1 failed BP execution side by side. Find what differed.',
      'Join any EDI-related stand-up, sprint review, or operations call as a silent observer.',
      'Begin a personal "EDI runbook" document where you note everything you learn — this becomes invaluable within 90 days.',
    ]),
    spacer(120),

    h2('0.3  The People You MUST Know on Day 1'),
    dataTable(
      ['Stakeholder', 'Their Role in EDI', 'What You Need From Them'],
      [
        ['Sterling System Admin', 'Manages platform config, patches, server health', 'Login credentials, server access, change window schedules'],
        ['ERP Integration Lead', 'Owns the ERP side (SAP, Oracle, etc.) of the integration', 'ERP field mapping, flat file/XML schemas, contact for data issues'],
        ['Trading Partner EDI Contacts', 'External — partner\'s EDI team', 'Companion guides, test contacts, protocol configs, escalation path'],
        ['Business Analyst Lead / PM', 'Owns project scope and timelines', 'Prioritization, scope decisions, partner onboarding queue'],
        ['Network / Firewall Team', 'Controls ports, IPs, certificates at infrastructure level', 'IP whitelisting, AS2 port 443 openings, certificate renewal process'],
        ['QA / Testing Team', 'Owns test plans and UAT sign-off', 'Test data, UAT scripts, go/no-go criteria'],
        ['Finance / AP Team', 'Consumes EDI output (820 remittance, 810 invoices)', 'Business validation rules, reconciliation requirements'],
        ['Procurement / Buyers', 'Issues 850 POs, expects 855 and 856 responses', 'PO workflow, urgency thresholds, exception handling'],
      ],
      [2200, 3000, 4160]
    ),
    spacer(120),

    h2('0.4  Common Day-1 Pain Points and How to Handle Them'),
    h3('Pain Point 1: "We have no documentation."'),
    p('This is the most common situation. The previous EDI BA may have left no docs, or the docs are outdated. Your first action: do not panic. Open Map Editor, open the existing maps, and start reverse-engineering. For each map, create a basic S2T document listing: input segment → output field → transformation rule. This creates documentation value immediately and demonstrates your competence.'),
    spacer(80),

    h3('Pain Point 2: "A partner is escalating and you know nothing about them."'),
    p('Before the call: pull their profile from Administration > Trading Partners. Note their protocol, IDs, and document types. Go to Operations > Business Processes, filter by their trading partner name, and look at the last 10 transactions. Scan Operations > Documents for their recent inbound files. You will know more than you think by the time the call starts. On the call: listen first, ask clarifying questions, commit only to investigation timelines — never to fix timelines you cannot control.'),
    spacer(80),

    h3('Pain Point 3: "I don\'t know if this is a Sterling issue or an ERP issue."'),
    p('Use the layer isolation framework: if the raw EDI in Operations > Documents is correct, the problem is downstream (ERP, network, partner). If the raw EDI is malformed or empty, the problem is upstream (map, adapter, partner data). If there is no document at all, the transport layer failed (AS2 MDN missing, SFTP connection refused). This framework narrows any issue to a single layer within 5 minutes.'),
    spacer(80),

    h3('Pain Point 4: "I deployed something and it broke production."'),
    p('Step 1: stay calm. Step 2: roll back immediately — do not investigate while things are broken. In Sterling: Deployment > Maps > find old version > Set as Default. Then Operations > Business Processes > halted instances > Restart at Failed Step. Only after the rollback is confirmed and production is stable do you investigate the root cause. Communicate proactively: notify your manager and affected stakeholders within 15 minutes of the rollback, even if the fix is complete.'),
    spacer(120),

    h2('0.5  Your 30-Day Learning Roadmap'),
    dataTable(
      ['Week', 'Focus Area', 'Success Milestone'],
      [
        ['Week 1', 'Orientation: people, systems, access, landscape mapping', 'Can describe every active trading partner and their protocol'],
        ['Week 2', 'Map deep-dive: read and understand all existing production maps', 'Can explain what every existing map does and trace a document through it'],
        ['Week 3', 'Build and test: create a new map in DEV, deploy to TEST, validate', 'Successfully built and tested at least one map without help'],
        ['Week 4', 'Live partner support: handle a real issue or onboarding task end-to-end', 'Resolved at least one partner issue independently; documented the outcome'],
        ['Day 30', 'Self-assessment: what do I still not know? Build a learning backlog', 'Presented your personal EDI runbook to your manager'],
      ],
      [1200, 4000, 4160]
    ),
    spacer(120),
    callout('tip', 'The difference between a BA who thrives in Week 1 and one who struggles is documentation discipline. Every action you take, every call you join, every issue you solve — write it down in your personal runbook. By Week 4, this runbook is your superpower.'),
    spacer(120),
    pageBreak(),
  ];
}

// ─── SECTION 1: CORE ARCHITECTURE (full from first script) ──────────────────
function makeSection1() {
  return [
    sectionBanner('1', 'Core Architecture & Key Concepts', 'A deep dive into Business Processes, Adapters, Maps, Document Flow, and EDI Standards'),
    spacer(120),

    h2('1.1  The Sterling Engine — How It All Connects'),
    p('IBM Sterling B2B Integrator (SBI) is not simply an EDI tool — it is a full B2B integration platform. Understanding how its internal components interact is the foundation for becoming effective in any production environment. Every file that enters or leaves Sterling travels through a deterministic pipeline:'),
    spacer(80),
    new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [9360],
      rows: [new TableRow({ children: [new TableCell({
        borders: allBorders(C.accent),
        shading: { fill: '1A1A2E', type: ShadingType.CLEAR },
        margins: { top: 160, bottom: 160, left: 200, right: 200 },
        width: { size: 9360, type: WidthType.DXA },
        children: [
          ['INBOUND FILE  →  [ADAPTER]  →  [MAILBOX / BP TRIGGER]  →  [BUSINESS PROCESS]',
           '           →  [DE-ENVELOPE]  →  [TRANSLATION MAP]  →  [ERP / SFTP / API]',
           '           →  [GENERATE 997/MDN]  →  [OUTBOUND ADAPTER]  →  PARTNER'
          ].map(line => new Paragraph({ children: [new TextRun({ text: line, color: '00BFFF', size: 20, font: 'Courier New' })] }))
        ].flat()
      })] })]
    }),
    spacer(120),
    p('Each arrow above represents a discrete Sterling service. Understanding that services are reusable, configurable units — and that business processes simply orchestrate them — is the single most important mental model you need.'),
    spacer(120),

    h2('1.2  Business Processes (BPs) — The Orchestration Layer'),
    p('A Business Process (BP) is an XML document written in BPML (Business Process Markup Language) that describes a sequence of service calls, conditional branches, loops, and fault handlers. In practice, BAs design BPs graphically using the Graphical Process Modeler (GPM), which generates the BPML XML underneath.'),
    spacer(80),
    h3('BP Lifecycle States'),
    dataTable(
      ['State', 'Meaning', 'BA Action'],
      [
        ['Waiting', 'BP is queued; resources not yet allocated', 'Normal — no action'],
        ['Running', 'BP is actively executing a step', 'Monitor — note how long'],
        ['Waiting on I/O', 'Adapter waiting for remote response (AS2 MDN, SFTP ack)', 'Normal — check timeout config if stuck'],
        ['Interrupted', 'BP paused waiting for manual intervention', 'Check why; restart or terminate'],
        ['Halted', 'BP stopped due to error; human review required', 'Read Status Report; diagnose; restart'],
        ['Terminated', 'BP was manually stopped or timed out', 'Investigate root cause'],
        ['Completed', 'BP ran successfully end-to-end', 'Verify output; confirm delivery'],
      ],
      [2000, 3680, 3680]
    ),
    spacer(120),

    h3('Key BP Design Patterns'),
    dataTable(
      ['Pattern', 'When to Use', 'Implementation'],
      [
        ['Sequential', 'Default — steps run one after another', '<sequence> with operations in order'],
        ['Parallel', 'Multiple independent tasks (e.g., send file AND send notification)', '<choice> or multiple sequences with fork'],
        ['onFault', 'Error handling — trigger alert or fallback on any step failure', '<onFault> inside <sequence>'],
        ['Sub-Process', 'Reuse a common BP inside another (e.g., reusable error-alerter)', '<operation> calling InvokeBusinessProcessService'],
        ['Correlation', 'Link inbound 850 to its 997 response using ISA control number', 'Correlation Set using ISA13 as key'],
        ['Wait/Timer', 'Hold a document for a time window or until a condition is met', 'WaitService with timeout configuration'],
        ['Loop', 'Iterate over a set of documents or trading partners', 'BPML <repeat> with counter condition'],
      ],
      [2000, 3680, 3680]
    ),
    spacer(120),
    callout('tip', 'GPM generates BPML for you. But always read the raw BPML in Operations > Business Processes when debugging — the XML shows exactly which step failed and what the error was.'),
    spacer(120),

    h2('1.3  Adapters — The Connection Layer'),
    p('Adapters are pluggable connectors that handle the physical transport of data to and from external systems. Each adapter is a registered Sterling service configured with host, authentication, and protocol parameters. A BA must understand how to configure, test, and troubleshoot each adapter type.'),
    spacer(80),

    h3('AS2 Adapter — Deep Dive'),
    p('AS2 (Applicability Statement 2) is an HTTP-based protocol with non-repudiation through digital signatures and MDN receipts. It is mandatory for most major retailers.'),
    spacer(80),
    dataTable(
      ['AS2 Component', 'Purpose', 'Where Configured'],
      [
        ['AS2 Profile', 'Stores partner AS2 ID, certificate, MDN settings', 'Admin > Trading Partners > AS2'],
        ['Certificate Store', 'Holds your keypair and partner public certs', 'Admin > Certificates'],
        ['Inbound Port', 'Your Sterling listens for partner\'s AS2 POST', 'Perimeter Server config'],
        ['MDN (Sync)', 'Partner returns MDN on same HTTP connection immediately', 'AS2 Profile > MDN Type = Synchronous'],
        ['MDN (Async)', 'Partner POSTs MDN back to a URL you provide later', 'AS2 Profile > MDN Type = Asynchronous'],
        ['AS2 Server Adapter', 'Receives inbound AS2 messages from partners', 'Adapter config > AS2ServerAdapter'],
        ['AS2 Client Adapter', 'Sends outbound AS2 messages to partner URL', 'Adapter config > AS2ClientAdapter'],
      ],
      [2500, 3700, 3160]
    ),
    spacer(100),
    callout('critical', 'You need BOTH the MDN (transport confirmation) AND the 997 (EDI content validation). The MDN tells you the file was received; the 997 tells you it was understood. A successful MDN with a rejected 997 means your EDI content is wrong.'),
    spacer(120),

    h3('Adapter Comparison Matrix'),
    dataTable(
      ['Adapter', 'Security', 'Real-time?', 'Non-Repudiation', 'Typical Use'],
      [
        ['AS2', 'HTTPS + Certs + MDN', 'Yes', 'Yes — MDN', 'Retail partners, pharma'],
        ['SFTP', 'SSH keys', 'Near-real-time', 'No', 'Finance, logistics, healthcare'],
        ['FTP/FTPS', 'TLS (FTPS only)', 'Near-real-time', 'No', 'Legacy partners'],
        ['HTTP/REST', 'TLS + OAuth/APIkey', 'Yes', 'No', 'Modern SaaS APIs'],
        ['File System', 'OS filesystem perms', 'Polling interval', 'No', 'Internal ERP handoffs'],
        ['MQ/JMS', 'TLS + auth', 'Yes', 'No', 'ERP message queues (SAP)'],
        ['VAN', 'VAN-managed', 'Polling', 'VAN-managed', 'Partners requiring mailbox'],
      ],
      [1500, 2100, 1400, 1800, 2560]
    ),
    spacer(120),

    h2('1.4  Maps — The Transformation Layer'),
    p('Maps transform documents from one format to another. Sterling\'s Map Editor is a standalone Java tool that produces compiled .map files deployed to Sterling. The BA is primarily responsible for designing, building, testing, and deploying maps.'),
    spacer(80),
    h3('Map Types Supported'),
    dataTable(
      ['Input Format', 'Output Format', 'Use Case'],
      [
        ['X12 EDI', 'XML', 'Inbound 850 PO to ERP XML format'],
        ['XML', 'X12 EDI', 'ERP invoice XML to outbound 810'],
        ['Flat File (fixed-width)', 'X12 EDI', 'Legacy mainframe data to EDI 837 claim'],
        ['X12 EDI', 'Flat File', 'EDI 835 remittance to legacy payment system'],
        ['XML', 'XML', 'XSLT-style transformation (ERP schema to partner schema)'],
        ['EDIFACT', 'X12', 'Standard conversion (EU partner to US buyer)'],
        ['X12', 'JSON', 'EDI to REST API payload'],
        ['HL7', 'X12', 'Healthcare interoperability (hospital to payer)'],
      ],
      [2500, 2500, 4360]
    ),
    spacer(120),

    h2('1.5  Document Flow — End-to-End Lifecycle'),
    p('Every document in Sterling has a tracked lifecycle. Understanding this flow is essential for both daily operations and interview discussions.'),
    spacer(80),
    h3('Inbound EDI Document Flow'),
    dataTable(
      ['Step', 'Action', 'Key Check'],
      [
        ['1', 'PARTNER sends file to your AS2 URL or drops on your SFTP inbound path', 'Is the MDN returned without error?'],
        ['2', 'AS2ServerAdapter / SFTP adapter receives the file; queues it in Sterling', 'Does Operations > Documents show the raw payload?'],
        ['3', 'Routing Rule fires: routes to correct Business Process', 'Did the correct BP trigger?'],
        ['4', 'EDIDeenvelope: unwraps ISA→GS→ST; validates envelope structure', 'Are ISA/GS control numbers valid?'],
        ['5', 'Sterling auto-generates 997 Functional Acknowledgment', 'Is 997 AK5=A (accepted) or AK5=R (rejected)?'],
        ['6', 'Translation service runs your compiled map; transforms 850 → XML', 'Does the output XML match expected schema?'],
        ['7', 'SFTPClientAdapter PUTs the XML to your ERP server', 'Did the ERP pick up the file?'],
        ['8', '997 is enveloped and sent back to partner', 'Did partner confirm receipt of 997?'],
        ['9', 'Operations > Documents retains raw EDI payload for audit', 'Is retention period configured correctly?'],
      ],
      [600, 5400, 3360]
    ),
    spacer(120),
    callout('tip', 'Operations > Documents is your best friend. When a partner says "we received garbage", pull the raw payload from this screen and compare it byte-by-byte with what your map produced. The answer is almost always visible in the raw file.'),
    spacer(120),

    // NEW SUBSECTION: EDI Standards Deep Dive
    h2('1.6  EDI Standards Deep Dive — X12, EDIFACT, HL7, and TRADACOMS'),
    callout('new', 'This section augments the original training guide with a comprehensive comparison of all major EDI standards. Understanding these standards makes you effective across industries and geographies — critical for interviews and Day 1 production work.'),
    spacer(120),

    h3('X12 — The US Standard'),
    p('ANSI ASC X12 is the dominant EDI standard in North America. Maintained by the Accredited Standards Committee X12, it defines transaction sets (200s–800s) covering procurement, logistics, healthcare, finance, and more.'),
    spacer(80),
    dataTable(
      ['Transaction', 'Name', 'Industry', 'Common Users'],
      [
        ['850', 'Purchase Order', 'Retail / Supply Chain', 'Walmart, Target, Amazon, Home Depot'],
        ['855', 'PO Acknowledgment', 'Retail / Supply Chain', 'All retail trading partners'],
        ['856', 'Ship Notice / Manifest (ASN)', 'Retail / Logistics', 'Retail — required for RFID/barcode compliance'],
        ['810', 'Invoice', 'All industries', 'Universal — sent by every supplier'],
        ['820', 'Payment Remittance', 'Finance / Retail', 'Buyers paying invoices electronically'],
        ['997', 'Functional Acknowledgment', 'All', 'Every X12 interchange — confirms receipt'],
        ['999', 'Implementation Acknowledgment', 'Healthcare', 'Replaces 997 in 5010 HIPAA transactions'],
        ['837P/I/D', 'Healthcare Claim (Prof/Inst/Dental)', 'Healthcare', 'Hospitals, clinics, providers → payers'],
        ['835', 'Healthcare Payment / Remittance', 'Healthcare', 'Payers → providers (EOB data)'],
        ['834', 'Benefit Enrollment', 'Healthcare / HR', 'Employers → insurance carriers'],
        ['940', 'Warehouse Shipping Order', 'Logistics / 3PL', 'Shippers → 3PL warehouses'],
        ['945', 'Warehouse Shipping Advice', 'Logistics / 3PL', '3PL → shipper confirming shipment'],
        ['204', 'Motor Carrier Shipment Info', 'Transportation', 'Shippers → carriers (truckload)'],
        ['214', 'Transportation Carrier Status', 'Transportation', 'Carriers → shippers (tracking updates)'],
      ],
      [900, 2500, 2000, 3960]
    ),
    spacer(120),

    h3('X12 Envelope Structure — The Three Layers'),
    p('Every X12 interchange has three nested envelope layers. Understanding this structure is essential for decoding 997 errors and configuring Sterling.'),
    spacer(80),
    new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [9360],
      rows: [new TableRow({ children: [new TableCell({
        borders: allBorders(C.accent),
        shading: { fill: '0D1B2A', type: ShadingType.CLEAR },
        margins: { top: 160, bottom: 160, left: 200, right: 200 },
        width: { size: 9360, type: WidthType.DXA },
        children: [
          'ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *240115*1430*^*00501*000001234*0*P*>~',
          '  GS*PO*SENDER*RECEIVER*20240115*1430*1*X*005010~',
          '    ST*850*0001~',
          '    BEG*00*SA*PO123456**20240115~',
          '    [... transaction body ...]',
          '    SE*15*0001~',
          '  GE*1*1~',
          'IEA*1*000001234~',
        ].map((line, i) => new Paragraph({
          spacing: { before: 20, after: 20 },
          children: [new TextRun({ text: line, color: i === 0 || i === 7 ? 'FFD700' : i === 1 || i === 6 ? '00E5FF' : i === 2 || i === 5 ? '98FF98' : 'FFFFFF', size: 18, font: 'Courier New' })]
        }))
      })] })]
    }),
    spacer(80),
    dataTable(
      ['Envelope Layer', 'Opening Segment', 'Closing Segment', 'Controls', 'Contains'],
      [
        ['Interchange', 'ISA (16 elements)', 'IEA', 'ISA13 = Interchange Control Number (9 digits)', 'One or more Functional Groups'],
        ['Functional Group', 'GS (8 elements)', 'GE', 'GS06 = Group Control Number', 'One or more Transaction Sets of same type'],
        ['Transaction Set', 'ST (2 elements)', 'SE', 'ST02 = Transaction Control Number', 'The actual business document (PO, Invoice, etc.)'],
      ],
      [2000, 1800, 1600, 2800, 1160]
    ),
    spacer(120),

    h3('EDIFACT — The International Standard'),
    p('UN/EDIFACT (United Nations Electronic Data Interchange for Administration, Commerce and Transport) is the dominant standard outside North America — particularly in Europe, Asia-Pacific, and for maritime/air freight globally. If you work with European trading partners or global supply chains, you will encounter EDIFACT.'),
    spacer(80),
    callout('dayOne', 'EDIFACT is often seen as "X12 with different names." The concepts are identical: envelope → functional group → message. The syntax uses different delimiters and the segment/element names differ, but your Sterling mapping skills transfer directly.'),
    spacer(80),
    dataTable(
      ['EDIFACT Concept', 'Equivalent X12 Concept', 'EDIFACT Name', 'Notes'],
      [
        ['Interchange Envelope', 'ISA/IEA', 'UNB/UNZ', 'Interchange Control Reference instead of ISA13'],
        ['Functional Group', 'GS/GE', 'UNG/UNE', 'Optional in EDIFACT — often omitted'],
        ['Message', 'Transaction Set (ST/SE)', 'UNH/UNT', 'Each UNH starts a message'],
        ['Segment', 'Segment (e.g., BEG)', 'Named segments (e.g., BGM, DTM)', 'EDIFACT segments are 2-3 char uppercase'],
        ['Element separator', '*  (asterisk)', '+  (plus sign)', 'Configured in UNB header'],
        ['Component separator', '>  (in ISA)', ':  (colon)', 'Sub-elements within EDIFACT elements'],
        ['Segment terminator', '~  (tilde)', '\'  (apostrophe)', 'Defined in UNA service string'],
      ],
      [2400, 2000, 2000, 2960]
    ),
    spacer(80),
    h4('Key EDIFACT Transaction Types'),
    dataTable(
      ['EDIFACT Message', 'Equivalent X12', 'Common Name', 'Used By'],
      [
        ['ORDERS', '850', 'Purchase Order', 'European retailers, auto manufacturers'],
        ['ORDRSP', '855', 'Order Response', 'All EDIFACT trading partners'],
        ['DESADV', '856', 'Despatch Advice (ASN)', 'European retail, pharma, auto'],
        ['INVOIC', '810', 'Invoice', 'Universal across all EDIFACT users'],
        ['REMADV', '820', 'Remittance Advice', 'Financial settlements'],
        ['CONTRL', '997/999', 'Interchange Acknowledgment', 'Receipt confirmation'],
        ['IFTMIN', '204', 'Transportation Order', 'Freight/logistics'],
        ['IFTSTA', '214', 'Transport Status', 'Freight tracking'],
      ],
      [2000, 1500, 2200, 3660]
    ),
    spacer(120),

    h3('HL7 — The Healthcare Standard'),
    p('Health Level 7 (HL7) is the standard for clinical and administrative healthcare data exchange. If you work in healthcare IT — hospitals, insurance payers, labs, pharmacies — HL7 is your primary language alongside X12.'),
    spacer(80),
    dataTable(
      ['HL7 Version', 'Format', 'Use Case', 'Sterling Support'],
      [
        ['HL7 v2.x', 'Pipe-delimited messages (MSH, PID, OBR segments)', 'Clinical messaging: ADT, lab results, orders', 'Native Sterling HL7 parser — fully supported'],
        ['HL7 v3', 'XML-based CDA documents', 'Clinical documents (discharge summaries)', 'XML map in Sterling — less common'],
        ['FHIR R4', 'JSON/XML REST resources', 'Modern interoperability (APIs)', 'HTTP adapter + JSON map in Sterling'],
        ['X12 (HIPAA)', 'X12 transactions (837, 835, 834, 270/271)', 'Administrative healthcare transactions', 'Native Sterling X12 with HIPAA validation'],
      ],
      [1800, 2800, 2500, 2260]
    ),
    spacer(80),
    callout('critical', 'HIPAA (Health Insurance Portability and Accountability Act) mandates specific X12 transaction sets for healthcare administrative data — 837 for claims, 835 for remittance, 834 for enrollment, 270/271 for eligibility. Non-compliance results in claim rejections and regulatory penalties. Sterling\'s HIPAA validation mode enforces these rules automatically.'),
    spacer(80),
    h4('HL7 v2.x Message Structure — Key Segments'),
    dataTable(
      ['Segment', 'Full Name', 'Contains', 'Always Present?'],
      [
        ['MSH', 'Message Header', 'Sender, receiver, message type, version, encoding', 'Yes — every HL7 message starts here'],
        ['PID', 'Patient Identification', 'Patient name, DOB, SSN, MRN, address', 'Yes — in patient-related messages'],
        ['PV1', 'Patient Visit', 'Admission date, discharge, attending physician, facility', 'Inpatient/outpatient visits'],
        ['OBR', 'Observation Request', 'Lab test ordered, ordering provider, date', 'Lab order and results messages'],
        ['OBX', 'Observation Result', 'Test result value, units, reference range, status', 'Repeating — one per result value'],
        ['DG1', 'Diagnosis', 'ICD-10 diagnosis codes', 'Inpatient/billing messages'],
        ['IN1', 'Insurance', 'Patient insurance information', 'Billing and eligibility messages'],
        ['EVN', 'Event Type', 'Event reason (admission, discharge, transfer)', 'ADT (Admit-Discharge-Transfer) messages'],
      ],
      [900, 2100, 3500, 2860]
    ),
    spacer(120),

    h3('TRADACOMS — The UK Retail Standard'),
    p('TRADACOMS (Trading Data Communications Standards) is a legacy standard used primarily in UK retail. It predates EDIFACT and is maintained by GS1 UK. While it is being phased out in favour of EDIFACT, many UK retailers (Tesco, Sainsbury\'s, Marks & Spencer) still use it for some transaction types.'),
    spacer(80),
    dataTable(
      ['TRADACOMS Feature', 'Details', 'Sterling Consideration'],
      [
        ['File structure', 'STX/END envelope; MHD/MTR message headers', 'Sterling has a TRADACOMS parser — enable in the map definition'],
        ['Common messages', 'ORDERS (PO), ORDHDR (order header), INVFIL (invoice file)', 'Separate message types from EDIFACT — do not confuse'],
        ['Delimiters', '= (equals) for element; + for component; \' (apostrophe) for segment end', 'Configured in the map editor under Input > TRADACOMS'],
        ['Status', 'Legacy — most UK partners migrating to EDIFACT D01B or later', 'Build new integrations in EDIFACT; maintain existing TRADACOMS for legacy partners'],
      ],
      [2400, 3800, 3160]
    ),
    spacer(120),

    h2('1.7  VANs — Value Added Networks'),
    callout('new', 'VANs are a critical connectivity option often missing from technical training guides. Understanding when and why to use a VAN vs. direct AS2/SFTP is a key BA competency.'),
    spacer(80),
    p('A Value Added Network (VAN) is a third-party intermediary that acts as a postal service for EDI. Instead of connecting directly to each trading partner, you connect once to the VAN. The VAN manages mailboxes for each trading partner and routes documents between them.'),
    spacer(80),
    h3('How a VAN Works'),
    dataTable(
      ['Step', 'Action', 'Your Responsibility'],
      [
        ['1', 'You establish a single connection to your VAN (AS2, SFTP, or FTP)', 'Configure the VAN connection in Sterling'],
        ['2', 'You transmit your outbound EDI files to your VAN mailbox', 'Address files with partner\'s VAN ID (e.g., ISA08)'],
        ['3', 'The VAN routes the file to the partner\'s VAN mailbox', 'Confirm partner is enrolled on the same VAN'],
        ['4', 'Partner picks up files from their VAN mailbox on their schedule', 'SLA depends on VAN pickup frequency, not direct connection'],
        ['5', 'Inbound files from partners arrive in your VAN mailbox', 'Sterling polls the VAN mailbox on a schedule'],
        ['6', 'You pick up inbound files on your polling schedule (e.g., every 15 minutes)', 'Configure polling adapter and schedule in Sterling'],
      ],
      [600, 4500, 4260]
    ),
    spacer(80),
    h3('Major EDI VANs'),
    dataTable(
      ['VAN Provider', 'Market Position', 'Key Customers', 'Sterling Integration'],
      [
        ['SPS Commerce', 'Largest US retail VAN', 'Walmart, Target, Kroger, Home Depot suppliers', 'SFTP or AS2 to SPS — one connection; they route to all retailers'],
        ['TrueCommerce', 'Mid-market focused', 'SMB suppliers to major retailers', 'SFTP gateway; pre-built maps for major retailers'],
        ['1 EDI Source (now Crossroads)', 'Strong in healthcare', 'Hospitals, payers, healthcare suppliers', 'AS2 or SFTP; HL7 and X12 routing'],
        ['OpenText (formerly GXS/GE VAN)', 'Enterprise global VAN', 'Fortune 500 manufacturers, auto, aerospace', 'AS2 / SFTP; global routing across 600,000 partners'],
        ['Kleinschmidt', 'Transportation focused', 'Carriers, 3PLs, shippers', 'SFTP; 204, 214, 940, 945 EDI transactions'],
        ['DiCentral', 'Retail-focused cloud VAN', 'Specialty retailers, fashion, housewares', 'Cloud portal + SFTP; managed mapping services'],
      ],
      [2000, 2000, 2500, 2860]
    ),
    spacer(80),
    h3('VAN vs. Direct Connection — Decision Matrix'),
    dataTable(
      ['Factor', 'Use VAN When...', 'Use Direct (AS2/SFTP) When...'],
      [
        ['Partner Volume', 'Many partners (50+) across different VANs', 'Few partners with high transaction volumes'],
        ['Partner Requirement', 'Partner mandates VAN (many SMB suppliers require it)', 'Partner supports AS2/SFTP directly (most large retailers)'],
        ['Technical Overhead', 'You want reduced connectivity management', 'You want full control and lower per-transaction cost'],
        ['Cost', 'Per-transaction VAN fees acceptable vs. IT overhead', 'Volume high enough that VAN fees exceed direct IT cost'],
        ['Audit Trail', 'VAN-managed delivery confirmation acceptable', 'You need MDN-level non-repudiation (AS2 advantage)'],
        ['Speed', 'Near-real-time acceptable (VAN polling delay OK)', 'True real-time required (AS2 delivers in seconds)'],
        ['Geography', 'Domestic US retail supply chain', 'International partners; complex routing needs'],
      ],
      [2000, 3680, 3680]
    ),
    spacer(120),

    h2('1.8  API vs. EDI — Critical Comparison for the Modern BA'),
    callout('new', 'One of the most common interview questions in 2025-2026: "When would you recommend EDI vs. an API integration?" This section gives you a nuanced, business-driven answer that will impress any interviewer.'),
    spacer(80),
    dataTable(
      ['Dimension', 'EDI (X12/EDIFACT)', 'REST API / JSON', 'Recommendation'],
      [
        ['Data Format', 'Structured segments; human-readable with training', 'JSON/XML; developer-friendly; human-readable', 'Neither is inherently better — both describe the same data differently'],
        ['Real-Time', 'Batch-oriented; delays of minutes to hours typical', 'Synchronous request-response; sub-second latency', 'APIs for real-time; EDI for batch processing windows'],
        ['Trading Partner Requirement', 'Required by Walmart, Target, major retailers; no choice', 'Preferred by Shopify, Amazon Marketplace, modern SaaS', 'Follow partner requirements — you rarely choose'],
        ['Setup Complexity', 'High — companion guides, testing, certification', 'Moderate — REST docs, OAuth setup, API keys', 'EDI requires more upfront investment; APIs faster to prototype'],
        ['Error Handling', 'Built-in: 997/999 ACK; explicit accept/reject per transaction', 'HTTP status codes; retry logic is custom per integration', 'EDI\'s acknowledgment framework is a significant advantage'],
        ['Standards Compliance', 'HIPAA mandates X12; retail compliance requires specific versions', 'No industry mandates; schemas vary by partner', 'EDI is required for HIPAA; APIs for non-mandated integrations'],
        ['Volume', 'Designed for high-volume batch (millions of records)', 'Best for transactional (individual records)', 'EDI for bulk; APIs for individual transactions'],
        ['Cost at Scale', 'License + VAN fees; high setup; low per-transaction', 'API call costs; infrastructure; potentially cheaper at scale', 'TCO analysis required — depends heavily on volume'],
        ['Partner Ecosystem', '600,000+ partners globally support EDI', 'Growing rapidly; most modern platforms have APIs', 'EDI wins on breadth; APIs win on modernity'],
        ['Non-Repudiation', 'AS2 MDN provides legal proof of receipt', 'No native equivalent; requires custom logging', 'EDI/AS2 critical for legal and compliance use cases'],
      ],
      [2000, 2600, 2600, 2160]
    ),
    spacer(80),
    callout('tip', 'In interviews, never say "EDI is old" or "APIs are better." The correct answer is: "EDI and APIs solve different problems. For mandated retail and healthcare data exchange, EDI is non-negotiable. For modern SaaS integrations and real-time use cases, APIs are superior. The BA\'s job is to identify which standard the business context requires — and often the answer is both."'),
    spacer(120),

    h3('Hybrid EDI + API Architectures (The Modern Reality)'),
    p('In practice, most enterprise environments use both EDI and APIs simultaneously. Understanding hybrid patterns makes you invaluable:'),
    spacer(60),
    ...['EDI Inbound → API Outbound: Receive X12 850 PO from a retailer via AS2, translate to XML in Sterling, then POST the XML to an ERP REST API. The retailer gets EDI compliance; your ERP gets modern API integration.',
      'API Inbound → EDI Outbound: An order management system creates an order via REST API. Sterling receives it as XML, maps it to X12 856 ASN, and sends it to the retailer via AS2. The internal systems use APIs; the external partner gets EDI.',
      'API as a VAN Replacement: Modern platforms like SPS Commerce offer REST APIs that abstract the EDI layer. You POST JSON to SPS; they handle the X12 generation and AS2 delivery. Understand this model — it is growing rapidly.',
      'Event-Driven EDI: An event bus (Kafka, Azure Service Bus) triggers Sterling when new orders arrive. Sterling processes EDI in response to events rather than polling. This combines EDI reliability with API-style real-time triggers.',
    ].map(t => bullet(t)),
    spacer(120),
    pageBreak(),
  ];
}

// ─── SECTION 2: REAL-WORLD SCENARIOS (full from second script) ──────────────
function makeSection2() {
  const scenarios = [
    { n: 1, title: 'Failed 997 — Partner Rejects Your Outbound 850', trigger: 'Monday morning. Walmart\'s EDI team calls: "We received your 850 purchase order but our system rejected it. We sent you a 997." Your job: diagnose and fix within 2 hours.', steps: ['Go to Operations > Business Processes > EDI_850_Outbound. Find the outbound 850 BP. Locate the EDI Correlation report to find the inbound 997.', 'Go to Operations > Reports > EDI Correlation. Search by partner=WALMART and date range. Find the 997 entry linked to your 850 interchange.', 'Pull the raw 997 from Operations > Documents. Read AK1 (group acknowledgment), AK2 (transaction set), AK3 (segment error), AK4 (element error), AK5 (disposition: R=Rejected).', 'AK4 tells you: element position, error code (1=mandatory missing, 5=too long, 7=invalid code, 8=invalid date), and the bad value. Note all of these.', 'Go to Operations > Documents. Pull the original outbound 850. Navigate to the segment and element position AK3/AK4 identified.', 'Cross-reference the bad value against the Walmart companion guide allowed values. Common issues: wrong GS01 functional ID, invalid PO type in BEG02, wrong unit of measure in PO1-03.', 'Open the map in Map Editor. Find the rule producing the bad value. Fix it. Check for similar issues in adjacent elements. Recompile. Deploy to DEV. Test.', 'Promote to PROD. Resend the 850 to Walmart. Monitor for the new 997. Confirm AK5=A (Accepted). Notify Walmart EDI team.'], tip: 'A 997 with AK5=R is your most valuable debugging tool. Read it from the bottom up: AK4 (element error) → AK3 (segment) → AK2 (transaction) → AK5 (disposition). The error codes are your roadmap.' },
    { n: 2, title: 'Missing Inbound 850 — Partner Claims They Sent It', trigger: 'Procurement team escalates: "Target sent us a purchase order yesterday and it never arrived in our ERP. Target\'s EDI team says they sent it." You have 1 hour to locate or declare data loss.', steps: ['Check Operations > Business Processes > Status=All for the past 48 hours. Filter by trading partner = TARGET. Look for any 850 inbound BPs — completed, failed, or otherwise.', 'Check Operations > Documents > search by trading partner = TARGET and transaction type = 850. Look for raw payloads.', 'Check the AS2 inbox: Operations > Business Processes > AS2InboundServerAdapter. Look for any messages from Target\'s AS2 ID in the time window.', 'If no documents found: contact Target\'s EDI team: "We have no record of receiving your AS2 transmission. Can you confirm the AS2 Message ID and timestamp of your send? Did you receive an MDN from us?"', 'If Target has an MDN confirming delivery to your AS2 endpoint: Sterling received it. Check whether the routing rule fired correctly. Check if the mailbox the AS2 adapter deposits to has the correct routing rule attached.', 'If Target has no MDN: the transmission never reached your AS2 listener. Check your AS2 inbound port and perimeter server — were they operational at the time?', 'Common cause: a routing rule was incorrectly scoped (filter by filename pattern excluded the file) or mailbox was full.', 'Once found, reprocess. If truly lost: work with Target to resend. Implement AS2 monitoring alert for future gaps.'], tip: 'Always ask for the AS2 Message-ID header from the partner when they claim a file was sent. This unique identifier lets you search AS2 logs precisely, even if the file never made it into Sterling\'s document store.' },
    { n: 3, title: 'Duplicate 850 Orders — ERP Complaining of Double Orders', trigger: 'ERP team reports: "We are receiving duplicate purchase orders from Home Depot. Two POs with the same number hit our system this morning." Purchasing is panicking.', steps: ['Pull both 850 transactions from Operations > Documents. Compare the ISA13 (interchange control numbers) and GS06 (group control numbers).', 'If ISA13 values differ: these are two legitimately different interchanges — possibly a legitimate resend by Home Depot, or a routing rule that triggered twice.', 'If ISA13 values are identical: Sterling received the same interchange twice and your deduplication is not working or not configured.', 'Check if your inbound BP has deduplication logic. If not: you lack duplicate protection. This is the root gap.', 'Immediate fix: contact Home Depot EDI team — ask why they transmitted twice. Was it a legitimate resend? Did they receive a 997 the first time?', 'For the ERP: coordinate with ERP team to cancel one of the duplicate POs. The PO number and partner should uniquely identify them.', 'Permanent fix: implement ISA13-based deduplication in the inbound BP (Lab 17). Store ISA13 + SenderID in a DB table with a 7-day window. Reject duplicates with a 997 Accepted (to stop partner retransmission) but route to a quarantine folder instead of ERP.', 'Root cause is usually: partner\'s system retransmits when no 997 is received within their timeout — your 997 was delayed. Fix 997 SLA compliance to prevent future duplicates.'], tip: 'Duplicate handling is a critical EDI BA competency. In interviews, always mention ISA13-based deduplication as part of your inbound BP design. Many junior BAs skip this, and partners who retry aggressively will create ERP chaos.' },
    { n: 4, title: 'Business Process Hangs — Stuck Thread', trigger: 'It is 10 AM. The EDI_856_Inbound BP for Home Depot has been in "Running" state for 4 hours. Normally it completes in 30 seconds. Documents are backing up.', steps: ['Go to Operations > Business Processes > EDI_856_Inbound. Find the stuck instance. Hover over the step in the BPML viewer — note which service/step it is stuck on.', 'Common culprits: (a) Translation service waiting on a database lock, (b) SFTP adapter waiting for a TCP connection that never completes, (c) HTTP adapter call to ERP hanging on response.', 'SSH into the Sterling server. Run: tail -200f /opt/IBM/SterlingIntegrator/logs/adapter.log | grep -i "HOME_DEPOT|error|timeout". Look for "connection timed out" or "read timed out".', 'Also check: tail -200f logs/noapp.log | grep -i "thread|deadlock|waiting". Look for thread pool exhaustion.', 'If SFTP adapter hanging: ERP SFTP server may be down. Verify: sftp -i /path/to/key user@erp-server from Sterling server CLI.', 'If translation hanging: check for database locks. Run SQL: SELECT * FROM BPEXECUTION WHERE STATUS=\'WAITING\' AND MODIFIED < SYSDATE-1/24.', 'For immediate relief: increase SFTP adapter Data Timeout from 60s to 300s in Administration > Adapter > SFTPClientAdapter_ERP.', 'Terminate stuck BP without data loss: Operations > Business Processes > stuck instance > Terminate. Document in Operations > Documents is retained. After root cause fixed: right-click document > Execute Business Process > EDI_856_Inbound.'], tip: 'Never terminate a stuck BP without first pulling the document ID from Operations > Documents. That document is your recovery path. Always confirm it exists before terminating the BP.' },
    { n: 5, title: 'HL7 837 Claim — Map Failure After Payer System Upgrade', trigger: 'A healthcare client sends HL7 837P (Professional Claims) to a payer. After the payer upgraded their clearinghouse, your inbound 837 → flat file map started failing with "mandatory element missing: NM109". 200+ patient claims halted.', steps: ['Go to Operations > Business Processes > HL7_837_Inbound. Find failed instances. Status Report: "Translation failed — mandatory element missing at NM1 loop, element NM109 (Member ID)."', 'Pull one of the failed 837 files from Operations > Documents. Navigate to the NM1*QC (patient) segment. Check if NM109 (member ID number) is present.', 'Identify the issue: the payer\'s new system may send NM108 (ID qualifier) as empty, causing NM109 to shift position, or sends a different NM108 qualifier (e.g., MI instead of HN).', 'Open the 837 map in Map Editor. Navigate to the NM1 loop. Find the NM109 element mapping. Check if "Mandatory" is set. If the payer\'s new file legitimately omits NM109, this validation is too strict.', 'Decision: if NM109 is sometimes legitimately absent, change element property from Mandatory (M) to Optional (O). Add a null-check extended rule: if NM109 is blank, use NM108 value or flag the record.', 'If NM109 is present but map can\'t find it due to qualifier change: add a conditional rule to read NM109 only when NM108 matches expected qualifier (MI, HN, etc.).', 'Recompile and deploy map. Test with failing 837 file using Map Editor\'s Test function. Confirm output correct.', 'Bulk reprocess 200+ failed claims: Operations > Business Processes > Status=Halted > Filter by HL7_837_Inbound > Select all > Restart at Failed Step.'], tip: 'HL7 837 issues after a payer system upgrade are one of the most common healthcare EDI emergencies. Always get the payer\'s updated companion guide before their upgrade date — this scenario is almost entirely preventable with advance coordination.' },
  ];

  const result = [
    sectionBanner('2', 'Real-World End-to-End Scenarios', '10 Complex Use Cases with Step-by-Step Resolution + BA Soft Skills'),
    spacer(120),
    callout('dayOne', 'These scenarios are not hypothetical — they represent the exact situations you will face in your first 90 days as an EDI BA. Study the resolution steps AND the "BA Soft Skills" notes — your technical answer is only half of what makes you effective.'),
    spacer(120),
  ];

  scenarios.forEach(s => {
    result.push(
      h2(`Scenario ${s.n}: ${s.title}`),
      new Table({
        width: { size: 9360, type: WidthType.DXA }, columnWidths: [9360],
        rows: [new TableRow({ children: [new TableCell({
          borders: allBorders(C.brand), shading: { fill: C.lightBlue, type: ShadingType.CLEAR },
          margins: { top: 100, bottom: 100, left: 160, right: 160 }, width: { size: 9360, type: WidthType.DXA },
          children: [
            new Paragraph({ children: [new TextRun({ text: '🎯 SCENARIO: ', bold: true, color: C.brand, size: 21, font: 'Arial' }), new TextRun({ text: s.trigger, color: C.mid, size: 21, font: 'Arial' })] })
          ]
        })] })]
      }),
      spacer(80),
      h3('Step-by-Step Resolution'),
      ...s.steps.map((step, i) => numbered(`${i + 1}. ${step}`)),
      spacer(80),
      callout('tip', s.tip),
      spacer(120),
    );
  });

  // Scenarios 6-10 condensed
  const scenarios2 = [
    { n: 6, title: 'New AS2 Partner Onboarding — Full Configuration (Kroger)', summary: 'A new retail client (Kroger) requires EDI integration via AS2. They send 850 POs and expect 997, 855, and 856 responses. You have 2 weeks to go live.', keySteps: ['Day 1 — Gather requirements: EDI IDs (ISA06/ISA08), AS2 URL, partner public certificate (.cer), MDN type, document list, test contact, and companion guide.', 'Days 2-3 — Import partner certificate; configure AS2 profile (encrypt=Yes, sign=Yes, MDN=Synchronous); create Trading Partner profile with document exchange definitions.', 'Days 5-8 — Build inbound 850 → XML map; build outbound XML → 855 and XML → 856 maps; build BPs for each; create mailboxes and routing rules.', 'Days 9-10 — Unit test all maps; conduct end-to-end test in ISA15=T (test) mode; confirm 997, 855, 856 all flow correctly.', 'Days 11-12 — Live partner test: Kroger sends test 850; you confirm receipt and return 997, 855, 856; get written sign-off; promote to production.'] },
    { n: 7, title: 'SFTP Key Rotation — Partner Changed SSH Keys', summary: 'A logistics partner rotated their SSH server key during a security compliance exercise. Outbound 940 Warehouse Orders failing with "host key verification failed". No orders reaching the warehouse for 6 hours.', keySteps: ['Confirm error: Operations > Business Processes > EDI_940_Outbound. Status Report: "SFTP connection failed: com.jcraft.jsch.JSchException: reject HostKey".', 'Contact 3PL IT team: "Your SSH server host key appears to have changed. Please provide your new SSH host public key or fingerprint."', 'Once new key received: Administration > Trading Partners > SSH Known Host Keys. Delete old entry for the 3PL\'s hostname. Import new host key.', 'Update SFTP adapter configuration to reference new known host entry. Test connection: Administration > Adapter > SFTPClientAdapter_3PL > Test Connection.', 'Re-queue failed 940 documents: Operations > Business Processes > EDI_940_Outbound > Status=Halted > Select all > Restart at Failed Step. Confirm delivery.'] },
    { n: 8, title: 'Map Works in DEV, Fails in PROD — Loop Limit Issue', summary: 'New 850 → XML map worked perfectly in DEV for 3 weeks. In PROD, every 850 with more than 50 line items fails with "loop limit exceeded: PO1". DEV test files all had fewer than 20 items.', keySteps: ['Read error: "EDI Translation failed: Maximum loop count exceeded at segment PO1. Maximum=50, Actual=67." DEV test files never had more than 20 lines — the limit was never hit.', 'Open the map in Map Editor. Find the PO1 loop. Right-click > Properties. Check "Maximum Use" — it is set to 50. This is the default; someone forgot to set it for production scale.', 'Set Maximum Use to 9999 (X12 allows 999999 for PO1; always check companion guide for partner\'s stated maximum). Check output XML schema for matching maxOccurs limit.', 'Recompile map. Test with 100, 500, 999 line-item files in DEV and TEST. Deploy to PROD. Reprocess failed BPs.', 'Post-mortem: add "Loop Limit Verification" to map review checklist. Always test with maximum expected file sizes before PROD deployment.'] },
    { n: 9, title: '820 Remittance — Reconciliation Dispute (Amazon)', summary: 'Finance team escalates: "We received an 820 remittance from Amazon but amounts don\'t match. 820 shows payment of $47,230 but we expected $52,105."', keySteps: ['Go to Operations > Business Processes > EDI_820_Inbound. Find the 820 BP from the disputed payment date. Confirm it completed successfully.', 'Pull the raw 820 from Operations > Documents. Read BPR02 (payment amount), TRN (trace number), ENT loop (one per invoice), RMR segments (RMR02=invoice#, RMR04=original amount, RMR05=paid amount).', 'Extract all RMR segments. Create a reconciliation table: invoice number, original amount, paid amount. Sum RMR04 (expected $52,105) and RMR05 (paid $47,230). Difference = $4,875 deducted.', 'Check for ADX segments (adjustment/deduction): ADX01=reason code (e.g., AD=advertising allowance), ADX02=amount. This explains the deduction.', 'Produce a reconciliation report for Finance: Invoice, Expected, Paid, Deduction, Reason Code. Share with Finance and Amazon account team for dispute resolution.'] },
    { n: 10, title: 'Emergency Production Rollback — Target ASN Map Failure', summary: 'New 856 ASN map deployed at 3 PM. By 4 PM, 300 ASNs have failed. Target is calling — their receiving system rejects your ASNs because the HL loops are malformed.', keySteps: ['IMMEDIATE ACTION: Do not panic. Go to Deployment > Maps. Find previous map version (856_to_ASN_v1). Click "Set as Default". This immediately reverts all translations.', 'Confirm rollback active: trigger a test 856. Check Operations > Business Processes to confirm the old map version is used. MDN should return clean.', 'For the 300 failed BPs: Operations > Business Processes > Status=Halted > Filter by EDI_856_Outbound > Select All > Restart at Failed Step. Monitor — all should now complete.', 'Call Target\'s EDI team: "We experienced a map issue and have rolled back. The 300 ASNs are being resent now. Please confirm receipt on your end."', 'After production is stable: investigate the v2 bug in DEV. Compare v2 vs. v1. Fix in DEV. Rebuild v3. Run full regression with 50 different ASN files. Deploy v3 next change window.'] },
  ];

  scenarios2.forEach(s => {
    result.push(
      h2(`Scenario ${s.n}: ${s.title}`),
      new Table({
        width: { size: 9360, type: WidthType.DXA }, columnWidths: [9360],
        rows: [new TableRow({ children: [new TableCell({
          borders: allBorders(C.brand), shading: { fill: C.lightBlue, type: ShadingType.CLEAR },
          margins: { top: 100, bottom: 100, left: 160, right: 160 }, width: { size: 9360, type: WidthType.DXA },
          children: [new Paragraph({ children: [new TextRun({ text: '🎯 SCENARIO: ', bold: true, color: C.brand, size: 21, font: 'Arial' }), new TextRun({ text: s.summary, color: C.mid, size: 21, font: 'Arial' })] })]
        })] })]
      }),
      spacer(80),
      h3('Key Resolution Steps'),
      ...s.keySteps.map((step, i) => numbered(`${i + 1}. ${step}`)),
      spacer(120),
    );
  });

  result.push(pageBreak());
  return result;
}

// ─── SECTIONS 3,4,5,6 (full from second script) ─────────────────────────────
function makeSections3456() {
  return [
    sectionBanner('3', 'Hands-On Lab Plan', '25 Structured Exercises to Build Real Production Skills — Complete All Within 30 Days'),
    spacer(120),
    callout('info', 'Complete labs in order — each builds on the previous. Mark each lab complete. Aim to finish all 25 within 30 days of starting. These labs are derived from real production scenarios and designed to build genuine job-readiness, not just theoretical knowledge.'),
    spacer(120),

    h2('Track A: Map Editor Mastery (Labs 1–8)'),
    dataTable(
      ['Lab', 'Title', 'Duration', 'Difficulty', 'What You Build'],
      [
        ['1', 'Decode a Raw 850 EDI File', '30 min', 'Beginner', 'Ability to read raw X12 without any tool in under 5 minutes'],
        ['2', 'Build 850 → XML Inbound Map', '2-3 hrs', 'Intermediate', 'Complete inbound PO map with header, N1 parties, PO1 loop'],
        ['3', 'Build XML → 810 Outbound Map', '2-3 hrs', 'Intermediate', 'Complete outbound invoice map with TDS total, IT1 loop'],
        ['4', 'Extended Rules Masterclass', '2 hrs', 'Int-Advanced', 'xref lookup, accumulator, conditionals, null protection, loop counter'],
        ['5', 'Build 856 ASN Inbound Map (HL Loops)', '3-4 hrs', 'Advanced', 'HL loop hierarchy detection: Ship→Order→Pack→Item routing'],
        ['6', 'Cross-Reference Table Implementation', '1 hr', 'Intermediate', 'UOM and trading partner code translation via xref_lookup'],
        ['7', 'Multi-Partner Map Versioning', '1.5 hrs', 'Advanced', 'Partner-specific map variants from shared base; version management'],
        ['8', 'Map Deployment and Rollback Drill', '1 hr', 'Intermediate', 'Deploy v2, break it, roll back to v1 in under 60 seconds'],
      ],
      [700, 2800, 1200, 1400, 3260]
    ),
    spacer(120),

    h2('Track B: Business Process Design (Labs 9–15)'),
    dataTable(
      ['Lab', 'Title', 'Duration', 'Difficulty', 'What You Build'],
      [
        ['9', 'Complete Inbound EDI BP with Error Handling', '2-3 hrs', 'Intermediate', 'Full flow: Adapter → Deenvelope → Translate → SFTP → 997 + onFault email'],
        ['10', 'Mailbox Routing Rules', '45 min', 'Beginner', 'File-type based routing rules; multi-condition routing'],
        ['11', 'Outbound BP with Enveloping', '2 hrs', 'Intermediate', 'XML → 810 → envelope → SFTP delivery with control number increment'],
        ['12', 'AS2 Partner Configuration', '1-2 hrs', 'Intermediate', 'Full AS2 profile; cert import; synchronous MDN test'],
        ['13', 'Scheduling & Polling', '30 min', 'Beginner', 'Fixed-rate poll schedule; business-hours-only cron schedule'],
        ['14', 'Monitor and Reprocess Failed BPs', '1 hr', 'Beginner', 'Break map; identify 3 halted BPs; fix; bulk restart'],
        ['15', 'Sub-Process and Correlation', '2 hrs', 'Advanced', 'Reusable error sub-process; 850-997 correlation set'],
      ],
      [700, 2800, 1200, 1400, 3260]
    ),
    spacer(120),

    h2('Track C: Advanced & Integration Labs (Labs 16–25)'),
    dataTable(
      ['Lab', 'Title', 'Duration', 'Difficulty', 'What You Build'],
      [
        ['16', 'SFTP Adapter Deep Configuration', '1 hr', 'Intermediate', 'SSH key auth; known hosts; GET + PUT; connection failure handling'],
        ['17', 'Deduplication Implementation', '2 hrs', 'Advanced', 'ISA13 DB tracking table; duplicate detection + suppression + 997 return'],
        ['18', 'Bulk Onboarding Automation', '2-3 hrs', 'Advanced', 'Parameterized template BP; new partner = new TP profile + map only'],
        ['19', 'Certificate Rotation Drill', '1 hr', 'Intermediate', 'Cert v1 → cert v2 rotation; zero downtime; MDN verification'],
        ['20', 'Performance Test & Tuning', '2 hrs', 'Advanced', '999-line 850 under 10 seconds; 3 optimizations documented'],
        ['21', 'End-to-End Partner Onboarding (Master Lab)', 'Full day', 'Advanced', '8 deliverables: onboarding form, S2T doc, 3 maps, 3 BPs, test results'],
        ['22', 'VAN Connectivity Simulation', '1 hr', 'Intermediate', 'Mailbox-based VAN simulation; ISA06-driven routing'],
        ['23', 'HTTP Outbound Integration', '2 hrs', 'Advanced', 'EDI → XML → REST API POST; response parsing; error handling'],
        ['24', '997 Auto-Generation & Routing', '1-2 hrs', 'Intermediate', '997 AK5=A and AK5=R generation; routing by disposition'],
        ['25', 'Full Troubleshooting Simulation', '2 hrs', 'Advanced', '5 injected failures; timed resolution using systematic diagnosis'],
      ],
      [700, 2800, 1200, 1400, 3260]
    ),
    spacer(120),
    callout('dayOne', 'Lab 21 is the "master lab" — it simulates a complete real-world partner onboarding from kick-off to go-live. If you can complete all 8 deliverables in under 8 hours, you are ready for a production EDI BA role.'),
    spacer(120),
    pageBreak(),

    sectionBanner('4', 'Expert Interview Questions & Answers', '25 Questions Across 6 Categories — With the Answers That Get You Hired'),
    spacer(120),
    callout('new', 'These questions and answers are structured to demonstrate not just technical knowledge, but the systematic thinking and stakeholder awareness that senior EDI BAs demonstrate. Answer structure: State what you do → Why you do it → What you check for → What you do next.'),
    spacer(120),

    h2('Category A: Core EDI Concepts'),
    h3('Q1. Explain the difference between an MDN and a 997.'),
    p('An MDN (Message Disposition Notification) is a transport-layer confirmation returned by the AS2 protocol. It confirms that the file was received, decrypted, and signature-verified — it is a network handshake. A 997 (Functional Acknowledgment) is an EDI application-layer confirmation that operates inside the X12 standard. It confirms that the EDI content was syntactically valid and accepted or rejected by the recipient\'s EDI system. You need both: the MDN tells you the file arrived; the 997 tells you the EDI content was understood and accepted. A successful MDN with a rejected 997 (AK5=R) means your file was received but your EDI content has an error.'),
    spacer(80),

    h3('Q2. What is a companion guide and why is it critical?'),
    p('A companion guide (or implementation guide) is a trading partner\'s supplement to the X12 standard. The X12 standard defines what is possible; the companion guide defines what is required for that specific partner. It specifies: which segments and elements are mandatory (beyond X12 minimum), allowed code values for specific elements, maximum loop counts, specific data formats, and any non-standard implementations. Failing to read the companion guide before building a map is the most common cause of partner rejections. I always read the companion guide before writing a single mapping line, and I keep it open during development and testing.'),
    spacer(80),

    h3('Q3. Walk me through how you would investigate a 997 with AK5=R.'),
    p('I read the 997 from the bottom up: AK4 tells me the element position and error code (1=mandatory missing, 5=too long, 7=invalid code, 8=invalid date) plus the actual bad value. AK3 tells me which segment failed and on which line within the transaction set. AK2 tells me which transaction set was rejected (ST02 control number). AK1 tells me which functional group (GS06) was being acknowledged. I then go to the original outbound document, navigate to the identified segment and element position, compare the actual value against the companion guide, and trace backward through the map to find which rule produced the bad value. The AK4 error code is the most specific clue — error code 7 (invalid code value) plus the bad value itself is usually enough to pinpoint the exact map fix needed.'),
    spacer(80),

    h3('Q4. What is ISA15 and why must you monitor it?'),
    p('ISA15 is the Usage Indicator — a single character that tells the receiving system whether this interchange is Test (T) or Production (P). In Sterling, this is set in the Enveloping Service configuration. If ISA15=T is sent to a production trading partner, their system may reject it, ignore it, or process it as a test (no fulfillment). If ISA15=P is sent to a test environment, you risk triggering real fulfillment activity. I always double-check ISA15 before any test transmission, and I have a pre-go-live checklist item: "Confirm ISA15 changed from T to P in production enveloping service." This is one of the most common go-live mistakes.'),
    spacer(80),

    h3('Q5. What is the difference between the GS01 functional identifier and the ST01 transaction set identifier?'),
    p('GS01 is the functional group identifier — a 2-character code that categorizes the type of documents in a functional group. Common values: PO (purchase orders), IN (invoices), SH (ship notices), FA (functional acknowledgments). All transaction sets within one GS/GE envelope share the same GS01. ST01 is the specific transaction set type — a 3-digit number identifying the exact EDI format: 850 (purchase order), 810 (invoice), 856 (ship notice), 997 (functional acknowledgment). GS01=PO must contain ST*850 transaction sets; GS01=IN must contain ST*810; GS01=SH must contain ST*856. Sterling validates that GS01 and ST01 are consistent during deenveloping.'),
    spacer(120),

    h2('Category B: Sterling-Specific Technical'),
    h3('Q6. How do you handle a situation where a map works in DEV but fails in production?'),
    p('I start by confirming the exact error message from the PROD BP Status Report — not a paraphrase, the exact text. The most common cause of DEV/PROD discrepancies is: (1) different test data scale — DEV files had 10 lines, PROD has 500 (loop limit issue); (2) different map version deployed — confirm the map version active in PROD vs. DEV; (3) different code reference tables — PROD cross-reference tables may have different entries than DEV; (4) different trading partner profiles — ISA IDs or version numbers may differ between DEV and PROD TP configs. I isolate by pulling the exact PROD input file from Operations > Documents and running it through the DEV map using Map Editor\'s Test function. If it fails in Map Editor on the PROD file, I have the exact error. If it succeeds, the issue is environment-specific, not the map.'),
    spacer(80),

    h3('Q7. What is the BPML onFault handler and when do you use it?'),
    p('The onFault handler is a BPML element that defines what happens when any step within its scope fails. Without an onFault, a failed step leaves the BP in Halted state with no automatic notification — someone has to manually check the Operations dashboard. With onFault, I can: send an alert email with the BP instance ID and error message in the subject line, route the failed document to a quarantine mailbox for manual review, generate a negative 997 (AK5=R) to notify the partner, log the error to a database, and trigger a retry after a delay. I include onFault in every production BP. The email should contain: the trading partner name, the transaction type, the error message from the Status Report, and a direct URL to the failed BP instance. This enables on-call resolution without VPN access to the dashboard.'),
    spacer(80),

    h3('Q8. Explain Sterling mailboxes and routing rules — how do they work together?'),
    p('A mailbox in Sterling is a logical queue — a named container where documents are deposited and from which they can be retrieved. Think of it like an email inbox, but for EDI files. A routing rule is an event-driven trigger that says: "When document X arrives in mailbox Y, execute business process Z." The workflow is: Adapter receives inbound file → adapter deposits file into a specified mailbox → routing rule evaluates all incoming documents against its conditions (mailbox name, filename pattern, trading partner ID) → when conditions match, routing rule invokes the target BP, passing the document as input. This architecture decouples transport from processing. The same file can be routed to different BPs based on content, and the same BP can be triggered from multiple adapters.'),
    spacer(80),

    h3('Q9. How do you implement deduplication in a Sterling BP?'),
    p('Deduplication prevents duplicate interchanges from entering the ERP when partners retransmit. My implementation: after EDIDeenvelope in the inbound BP, I extract ISA13 (interchange control number) and ISA06 (sender ID) from process data. I run a DB Lookup service: SELECT count(*) FROM EDI_DEDUP_LOG WHERE ISA13 = :isa13 AND SENDER_ID = :sender_id AND RECEIVED_TS > SYSDATE-7. If count > 0: this is a duplicate. I route to a DuplicateHandler branch that generates a 997 AK5=A (to stop partner retransmission), logs the duplicate event, sends an alert email, and terminates processing without touching the ERP. If count = 0: I INSERT the ISA13 and sender ID into the log table and continue normal processing. The 7-day window covers typical partner retry windows — adjust based on your partner agreements.'),
    spacer(80),

    h3('Q10. How do you set up correlation between an outbound 850 and its inbound 997 response?'),
    p('Sterling\'s correlation service uses a correlation set — a named key that links related BPs. Implementation: when sending the 850, I create a correlation set named "EDI_850_997" with the ISA13 control number as the key. The outbound 850 BP sets the correlation key before sending. When the inbound 997 BP receives the 997, it extracts AK1-02 (the group control number from the original 850) and uses the WaitService to wait for a correlation match with that key. When Sterling finds the match, it links the two BPs. This is visible in Operations > Reports > EDI Correlation, which shows the outbound 850 and its corresponding inbound 997 in the same row. Correlation is essential for SLA monitoring — you can measure the time between 850 sent and 997 received.'),
    spacer(120),

    h2('Category C: Map Building'),
    h3('Q11. How do you handle a trading partner who sends a non-standard code value in a mandatory code-list-validated element?'),
    p('I have three options. Option 1 (preferred long-term): contact the partner\'s EDI team, document the non-standard value, and request they correct it. Options 2 and 3 are workarounds for while the partner corrects it. Option 2: disable code list validation for that specific element in the map (right-click element > Properties > Standard Rule > remove Code List validation). Add a note in the S2T document. Option 3: add a cross-reference (xref_lookup) that maps the non-standard value to the standard one before it reaches the validation. I always document the deviation in the S2T document with: the partner\'s non-standard value, the expected standard value, the date the deviation was reported, and the ticket reference tracking partner correction.'),
    spacer(80),

    h3('Q12. When would you use an accumulator rule vs. an extended rule?'),
    p('An accumulator is a built-in standard rule specifically for summing numeric values across loop iterations — for example, summing the extended price (Qty * Price) across all PO1 line items for the CTT hash total. Accumulators are configured in the Standard Rule tab of element properties and handle the loop iteration automatically without custom scripting. An extended rule is a scripting language for anything more complex: conditionals, string manipulation, multi-step calculations, cross-references in code, loop index access, or any logic the standard rules cannot express. If the logic is "sum these values," use an accumulator. If the logic is "if N1-01 equals this, set this field; else set that field, then look up this code, then concatenate these strings," use an extended rule.'),
    spacer(120),

    h2('Category D: Operations & Troubleshooting'),
    h3('Q13. A trading partner says their system cannot find files you claim to have sent via SFTP. How do you prove delivery?'),
    p('I go to Operations > Business Processes, find the outbound SFTP BP instance, and read the BPML execution log for the SFTPClientAdapter step. The Status Report will show either "File transferred successfully: /remote/path/filename.edi (X bytes)" or an error. If it shows success, the SFTP PUT completed — Sterling\'s client received acknowledgment from the remote server that the file was written. I take a screenshot of the success status including timestamp, remote path, and file size. I share this with the partner: "Sterling confirms successful SFTP PUT to /inbound/edi/850_20240315_001.edi at 14:23:07 UTC, 2,456 bytes." If their system still cannot find it: they may be looking in the wrong directory, their pickup process may not have run, or a filename pattern filter is excluding our file. I ask them to do a manual directory listing on the SFTP path to confirm the file is physically present.'),
    spacer(80),

    h3('Q14. How do you handle a certificate that expires during business hours?'),
    p('Prevention is the real answer — with proper monitoring, this should never happen. But if it does: the impact is immediate — all AS2 messages fail with MDN decryption errors. First: alert the business and the partner\'s EDI team. Expedite the cert renewal — contact the partner, get their new cert, import it into Sterling, update the AS2 profile, test. This should take under 30 minutes if you have the partner\'s contact info ready. While waiting: check if we can fall back to SFTP for this partner as a temporary measure. Post-incident: implement cert expiry monitoring — a script or scheduled report that checks all Sterling certs quarterly and alerts 90 days before expiry. Never let a cert get within 30 days of expiry without a renewal in progress.'),
    spacer(120),

    h2('Category E: Scenarios & Judgment'),
    h3('Q15. What metrics do you track to demonstrate EDI operational health to management?'),
    p('I track: (1) Transaction success rate: % of BPs completing successfully vs. failing — target >99.5%. (2) 997 acceptance rate: % of outbound EDI receiving AK5=A vs. AK5=R — target >99%. (3) 997 SLA compliance: % of outbound EDI receiving a 997 within the agreed SLA window (typically 24 hours). (4) Average BP execution time trend — increasing times indicate performance degradation. (5) Duplicate detection count — how many duplicates caught per week. (6) Certificate expiry runway — days until the next cert expires; should always be >90 days. (7) Onboarding time — calendar days from partner request to production go-live; target <14 days for standard partners. I present these weekly to the EDI/IT manager in a one-page dashboard.'),
    spacer(80),

    h3('Q16. "We are considering replacing Sterling with a newer platform. As our EDI BA, what is your assessment?"'),
    p('I approach this as a business analysis exercise. First: document the current portfolio — how many trading partners, transaction types, volumes, SLAs, and partner-specific platform requirements. Then assess switching costs: map conversion (Sterling maps don\'t port directly — everything must be rebuilt), partner notification (some require re-certification when you change platforms), training, and parallel-run period. Evaluate alternatives (MuleSoft, Boomi, Azure Logic Apps) against specific requirements. Present a risk-adjusted TCO analysis over 3-5 years. My recommendation is evidence-based: if Sterling fully meets our needs and switching costs are high, I say so — even if the new platform is technically superior. Interviewers respect this nuanced, business-driven judgment over platform loyalty.'),
    spacer(120),

    h2('Category F: Scenario Role-Plays'),
    h3('Q17. "You are the only EDI BA. It is 2 AM and a critical trading partner is calling because their orders are not coming through. What do you do?"'),
    p('First: I do not panic. I access the Sterling dashboard remotely via VPN. I immediately go to Operations > Business Processes, filter by the partner\'s trading partner name, last 4 hours. I identify if any BPs are Halted or Running too long. If Halted: I read the Status Report and identify the layer (transport, map, BP, data). If the issue is a map error: I check if I can restart the BPs with the current map. If the issue is connectivity (SFTP/AS2 failure): I test the connection from the admin UI. If the issue is on their side — their SFTP server is down, their AS2 listener not responding — I document it and let the partner know. I send a status update to my manager and the account team within 15 minutes. I do not make map or BP changes at 2 AM without following emergency change procedures — the risk of making things worse outweighs the urgency of a fix.'),
    spacer(80),

    h3('Q18. Live technical test: "Here is a 997 — tell me what is wrong with the 850 that generated it."'),
    p('I read it systematically: AK1 (group acknowledgment) — note the GS control number and version being acknowledged. AK2 — note the ST control number of the specific rejected transaction set. AK3 — read the segment ID that failed and the line number within the transaction. AK4 — read the element position within that segment, the error code (1=mandatory missing, 5=too long, 7=invalid code, 8=invalid date), and the actual bad value if present. AK5 — A/E/R tells me the disposition. I then describe where in the original 850 I would go: "I would navigate to segment [AK301] at line [AK302], check element [AK401], and compare the value [AK404] against the companion guide\'s allowed values for that element." In a real interview: stay calm, read systematically, narrate your thought process out loud — they are testing your method, not just the answer.'),
    spacer(120),
    pageBreak(),

    sectionBanner('5', 'Comprehensive Troubleshooting Guide', 'Systematic Diagnosis Framework and Resolution Checklists'),
    spacer(120),

    h2('5.1  Systematic Diagnosis Framework'),
    p('Every Sterling issue follows the same diagnostic chain. Use this framework before diving into specifics:'),
    spacer(80),
    ...['CONFIRM the issue: Can you reproduce it? Get the exact error message, BP instance ID, and document ID.',
      'ISOLATE the layer: Is it a Transport issue (adapter/network), Translation issue (map), Business Logic issue (BP), or Data issue (bad input from partner)?',
      'COLLECT evidence: Pull the raw document from Operations > Documents. Get the Status Report from the failed BP step. Check the relevant log file.',
      'HYPOTHESIZE: What is the most likely root cause given the evidence? What are the alternatives?',
      'TEST the fix: Apply the fix in DEV. Reproduce the original failure scenario. Confirm the fix resolves it.',
      'DEPLOY: Follow change management. Monitor for 1-2 hours post-deploy.',
      'DOCUMENT: Update runbook and S2T doc. Add test case to regression suite.',
    ].map((t, i) => numbered(`${i + 1}. ${t}`)),
    spacer(80),
    callout('tip', 'The layer isolation step is the most important. BAs who skip straight to "fixing the map" often spend hours on the wrong problem. Always confirm which layer before touching anything.'),
    spacer(120),

    h2('5.2  AS2 / Certificate Issue Troubleshooting'),
    dataTable(
      ['Symptom', 'Probable Cause', 'Diagnosis', 'Fix'],
      [
        ['MDN: decryption-failed', 'Partner cert expired or wrong cert used to encrypt', 'Admin > Certificates > check expiry on partner cert alias in AS2 profile', 'Import partner\'s new cert; update AS2 profile cert reference'],
        ['MDN: signature-verification-failed', 'Your outbound signing cert doesn\'t match partner\'s stored copy', 'Confirm partner has your current public cert; check private key alias in AS2 profile', 'Share your current public cert with partner; confirm they updated their system'],
        ['No MDN received (async)', 'Wrong async MDN URL, or partner\'s system cannot reach your MDN URL', 'Check your AS2 profile MDN URL; test if URL is reachable; check firewall rules', 'Update MDN URL; open firewall port; or switch to synchronous MDN'],
        ['MDN: processing-error', 'Partner\'s AS2 system received the file but had an internal error', 'Contact partner\'s EDI team — their system error, not Sterling\'s', 'Partner resolves their internal error; you may need to resend'],
        ['SSL handshake failed', 'Outdated TLS version; partner requires TLS 1.2+ but Sterling uses TLS 1.0', 'Check Sterling\'s SSL configuration; noapp.log shows SSL negotiation error', 'Update Sterling\'s SSL configuration to TLS 1.2+; update cipher list'],
      ],
      [2000, 2500, 2800, 2060]
    ),
    spacer(120),

    h2('5.3  SFTP / FTP Issue Troubleshooting'),
    dataTable(
      ['Symptom', 'Probable Cause', 'Diagnosis', 'Fix'],
      [
        ['Auth failed: publickey', 'Wrong SSH key alias or key not uploaded to partner', 'Check key alias in adapter; verify partner has your public key', 'Re-upload public key to partner; verify alias matches Sterling config'],
        ['Host key verification failed', 'Partner rotated their SSH server host key', 'Contact partner to confirm key rotation; get new fingerprint', 'Update known hosts in Sterling with new partner host key'],
        ['Connection refused', 'Wrong host/port or partner firewall blocking Sterling\'s IP', 'Test: sftp -P 22 user@partner-host from Sterling server CLI', 'Correct host/port; ask partner to whitelist Sterling\'s outbound IP'],
        ['File not found: remote path', 'Wrong remote directory path or case sensitivity on Linux SFTP', 'Check adapter remote directory config; test with manual SFTP from CLI', 'Correct remote directory path (case-sensitive on Linux)'],
        ['Connection timeout', 'Partner SFTP server slow or unstable; data timeout too short', 'Check adapter.log for timeout timestamp; try manual SFTP from CLI', 'Increase Data Timeout from 60s to 300s in adapter config'],
        ['File delivered but partner says empty', 'Zero-byte file sent (translation produced empty output)', 'Check translation output; check Operations > Documents payload size', 'Debug map — likely empty input or a rule that produced no output'],
      ],
      [2000, 2500, 2800, 2060]
    ),
    spacer(120),

    h2('5.4  Translation / Map Issue Troubleshooting'),
    dataTable(
      ['Symptom', 'Probable Cause', 'Diagnosis', 'Fix'],
      [
        ['Mandatory segment missing', 'Map not outputting a required segment', 'Check map output side — is segment mapped? Is a conditional suppressing it?', 'Add mapping rule or remove suppression condition for mandatory segment'],
        ['Loop limit exceeded: PO1', 'More loop iterations than map maximum allows', 'Check Map Editor PO1 loop Maximum Use setting', 'Increase Max Use to 9999; recompile; redeploy'],
        ['Invalid code value (AK4 error 7)', 'Output code not in partner\'s allowed code list', 'Compare output code against companion guide allowed values', 'Add conditional mapping or xref lookup to convert to allowed code'],
        ['Null pointer in extended rule', 'Rule tried to use a value from an empty/absent element', 'Check rule for null protection; was optional element absent?', 'Add: if $PO1/PO104 <> "" then... before using the element'],
        ['Date format rejected', 'Date in wrong format for partner or element', 'Check companion guide date format; check dateconvert rule output format', 'Fix dateconvert second parameter to match expected format'],
        ['Translation produces empty file', 'Map compiled against wrong version; input doesn\'t match schema', 'Verify ISA12 version matches map version; recompile', 'Correct version mismatch; recompile map against correct version'],
        ['Extended rule compile error', 'Typo; undeclared variable; wrong function name', 'Map Editor output window shows exact error line and position', 'Fix the syntax; declare all variables at top of rule'],
      ],
      [2200, 2500, 2500, 2160]
    ),
    spacer(120),
    pageBreak(),

    sectionBanner('6', 'Alternative Tools', 'MuleSoft, Boomi, TIBCO, SAP PI/PO, and Azure — How They Compare to Sterling'),
    spacer(120),

    h2('6.1  Platform Concept Crosswalk'),
    dataTable(
      ['Sterling Concept', 'MuleSoft', 'Boomi', 'TIBCO', 'SAP PI/PO', 'Azure Logic Apps'],
      [
        ['Map Editor', 'DataWeave Mapper', 'Boomi Map Component', 'Trading Manager Map', 'Graphical Message Mapping', 'Data Mapper Action'],
        ['GPM (Visual BP)', 'Anypoint Studio', 'Process Canvas', 'Process Editor', 'Integration Designer', 'Logic App Designer'],
        ['Trading Partner Profile', 'Partner Manager (API-based)', 'Trading Partner tab', 'Community Manager record', 'Communication Channel + Party', 'Connector configuration'],
        ['AS2 Adapter', 'AS2 Connector (paid)', 'Boomi AS2 Connector', 'Built-in AS2', 'SAP AS2 Adapter', 'AS2 Logic App Connector'],
        ['SFTP Adapter', 'SFTP Connector', 'SFTP Connector', 'Built-in SFTP', 'SAP SFTP Adapter', 'SFTP Connector'],
        ['EDI De-envelope', 'EDI Module (X12/EDIFACT)', 'Boomi EDI Module', 'Built-in EDI parser', 'SAP IDoc / EDI Adapter', 'Flat File Decoder'],
        ['Operations > Business Processes', 'Runtime Manager (CloudHub)', 'Process Reporting', 'Partner Manager logs', 'Monitor (NWA)', 'Run History'],
        ['Certificate Store', 'Anypoint Security (TLS contexts)', 'Certificate management', 'Partner certificate store', 'Keystore / TLS', 'Azure Key Vault'],
      ],
      [2000, 1440, 1440, 1440, 1600, 1440]
    ),
    spacer(120),

    h2('6.2  Platform Selection Guide'),
    dataTable(
      ['Scenario', 'Best Platform', 'Why'],
      [
        ['High-volume retail EDI (Walmart, Target, Kroger)', 'IBM Sterling', 'Purpose-built; proven at scale; native companion guide compliance'],
        ['Healthcare EDI (837, 835, 834) at scale', 'IBM Sterling or HL7 Rhapsody', 'Native HL7 and X12; HIPAA compliance tooling'],
        ['Salesforce ecosystem integration', 'MuleSoft', 'Native Salesforce connectivity; API-first design'],
        ['SAP ERP internal + external EDI', 'SAP PI/PO + Sterling', 'PI handles IDoc; Sterling handles partner EDI — complement each other'],
        ['Start-up or mid-market, cloud-first', 'Boomi or Azure Logic Apps', 'Lower cost; faster deployment; less infrastructure overhead'],
        ['Financial services (SWIFT, SEPA)', 'TIBCO or IBM Sterling', 'SWIFT adapters; financial EDI standards support'],
        ['Modern API-to-API integration', 'MuleSoft or Azure API Mgmt', 'REST/GraphQL native; developer-friendly; API marketplace'],
        ['Manufacturing / RosettaNet', 'TIBCO or Sterling', 'RosettaNet adapters; XML-based B2B standards'],
      ],
      [3000, 2500, 3860]
    ),
    spacer(80),
    callout('tip', 'In interviews: never say "Sterling is the best." Say "Sterling is the right choice when X, Y, Z conditions apply. In other scenarios, platforms like Boomi or MuleSoft may be more appropriate." Interviewers respect nuanced, business-driven judgment over platform loyalty.'),
    spacer(120),
    pageBreak(),
  ];
}

// ─── SECTION 7: STAKEHOLDER MANAGEMENT (full from second script) ────────────
function makeSection7() {
  return [
    sectionBanner('7', 'Stakeholder Management for the EDI BA', 'Soft Skills, Communication, and Managing the Human Side of Integration'),
    spacer(120),
    callout('new', 'Technical skills get you hired. Stakeholder management skills get you promoted. This section covers the human dimension of EDI BA work — an area completely absent from most technical training guides.'),
    spacer(120),

    h2('7.1  The EDI BA\'s Stakeholder Universe'),
    p('An EDI BA sits at the intersection of technology, business, and external partners. You are the translator between all three worlds. Understanding each stakeholder\'s perspective — and their definition of "success" — is the foundation of effective stakeholder management.'),
    spacer(80),
    dataTable(
      ['Stakeholder Group', 'Primary Concern', 'What They Need From You', 'How to Communicate'],
      [
        ['Business Leadership', 'On-time delivery, cost, partner relationships', 'Status dashboards, risk flags, executive summaries', 'Weekly 1-page status report; escalate early'],
        ['IT / Engineering', 'Technical correctness, platform stability, security', 'Detailed specs, change logs, deployment plans', 'Tickets, code reviews, architecture diagrams'],
        ['ERP Team', 'Data quality, schema compliance, no surprises in their system', 'Field mapping specs, test data, data flow diagrams', 'S2T mapping document; joint testing sessions'],
        ['Finance / AP', 'Accurate invoices, remittance matching, audit trail', 'Reconciliation reports, error explanations in business terms', 'Plain English; translate EDI codes to business meaning'],
        ['Procurement / Buyers', 'POs confirmed, ASNs received, order visibility', 'Exception alerts, reprocessing status, workarounds', 'Direct; fast; action-oriented. No jargon.'],
        ['Trading Partners', 'Reliable, compliant EDI; fast issue resolution', 'Clear error messages, quick response, test environment', 'Professional email; regular check-ins during onboarding'],
        ['QA Team', 'Test coverage, documented expected results, sign-off process', 'Test case specs, sample data, acceptance criteria', 'Formal test plan documents; UAT scripts'],
        ['Network / Security', 'Protocol compliance, cert management, IP security', 'Certificate expiry notices, IP whitelist requests, protocol specs', 'Infrastructure ticket; advance notice always'],
      ],
      [2000, 2300, 2800, 2260]
    ),
    spacer(120),

    h2('7.2  Requirements Gathering — The Complete Checklist'),
    callout('new', 'Requirements gathering is the most critical phase of any EDI project. Gaps discovered during requirements gathering cost hours to fix. Gaps discovered during UAT cost days. Gaps discovered in production cost weeks — and sometimes partnerships.'),
    spacer(80),

    h3('Trading Partner Onboarding — Requirements Checklist'),
    ...checklistTable('Pre-Project Requirements Gathering', [
      'Partner\'s EDI ID (ISA06 for X12; UNB Sender ID for EDIFACT)',
      'Your company\'s EDI ID (ISA08) as configured in the partner\'s system',
      'Communication protocol: AS2, SFTP, FTP, VAN? Both inbound and outbound may differ.',
      'AS2 specifics (if applicable): AS2 ID, AS2 URL, MDN type (sync/async), encryption algorithm, signing algorithm, MDN signing required?',
      'SFTP specifics (if applicable): hostname, port, remote inbound directory, remote outbound directory, authentication method (password/SSH key), partner\'s public key if key-auth',
      'Transaction types: complete list of all document types to exchange (850, 855, 856, 810, 997, etc.)',
      'Companion guide for each transaction type — the specific version (e.g., ANSI X12 005010)',
      'Test environment details: test AS2 URL, test SFTP host, test ISA15=T flag configuration',
      'Partner\'s EDI test contact name, email, phone',
      'Go-live date requirement and any hard deadlines (e.g., retailer\'s new item setup date)',
      'Acknowledgment requirements: does partner require 997? Within what SLA window?',
      'Data mapping source: where does the data come from in your ERP? (field names, data types, formats)',
      'Any partner-specific code cross-references needed (e.g., UOM: EA→EA, CA→CS)',
      'Certificate exchange process: who sends their cert first? Format (.cer, .p7c, .pem)?',
      'IP whitelist requirements: does partner need your outbound IP? Does your firewall need their IP?',
      'Compliance requirements: HIPAA, SOX, GDPR, retailer compliance certification (Drummond, VICS)?',
      'Data retention requirements: how long must EDI documents be stored for audit?',
    ]),
    spacer(120),

    h3('Requirements Gathering Meeting — Question Bank'),
    p('These questions should be asked in your kick-off call with every new trading partner:'),
    spacer(60),
    ...['What EDI software / platform are you using on your side? (Knowing their platform helps you anticipate their constraints.)',
      'Have you integrated with [your company name] before? If so, what protocol?',
      'Are you using a VAN or direct connectivity? If VAN, which one, and what is your VAN ID?',
      'Do you have a certification requirement before we go live in production? (Some retailers require Drummond certification.)',
      'What is your standard SLA for 997 acknowledgment? Do you auto-reject if you don\'t receive a 997 within X hours?',
      'Do you have specific filename conventions for SFTP delivery?',
      'Are there any fields in the companion guide that you use differently than the X12 standard specifies? (This is where non-standard implementations hide.)',
      'What is your escalation path if there\'s a production issue outside business hours?',
      'Can you provide sample test files — both valid and intentionally invalid — for our testing?',
      'What monitoring do you have on your side? Will you alert us if transmissions stop arriving?',
    ].map(q => bullet(q)),
    spacer(120),

    h2('7.3  Managing Scope Creep in EDI Projects'),
    p('EDI projects are particularly susceptible to scope creep because trading partners frequently change their requirements mid-project ("we just updated our companion guide"), stakeholders add transaction types after mapping begins, and what initially seems like a simple integration reveals hidden complexity (e.g., the 856 has 5-level HL loops instead of 3).'),
    spacer(80),
    h3('The Scope Creep Response Framework'),
    ...['Document first: before responding, write down the change request in detail. "Partner has added a new qualifier to the N1 segment" is actionable. "Things changed" is not.',
      'Assess impact: estimate effort for maps, BPs, testing, and documentation. Is this 1 hour or 1 week?',
      'Classify severity: is this a blocker (prevents go-live without it), high (significant rework), or low (minor map tweak)?',
      'Communicate formally: email the project team and sponsor: "A scope change has been identified. The following change will impact the timeline by approximately X days." This creates a paper trail.',
      'Get sign-off: if the change is significant, get written approval from the sponsor before proceeding. Never silently absorb scope changes.',
      'Update the S2T document: every change to requirements must be reflected in the mapping documentation. The S2T doc is your source of truth.',
    ].map(t => bullet(t)),
    spacer(80),
    callout('tip', 'The most valuable phrase an EDI BA can use: "I can do that, and here is the impact on the timeline and effort." This is not resistance — it is transparency. Stakeholders respect BAs who quantify impact rather than silently absorb changes or flatly refuse them.'),
    spacer(120),

    h2('7.4  Managing the 2 AM Production Call'),
    p('Production incidents are the defining moments of an EDI BA\'s credibility. How you handle them — technically and interpersonally — determines how stakeholders perceive you.'),
    spacer(80),
    h3('The Production Incident Communication Framework'),
    dataTable(
      ['Time After Incident', 'Action', 'Audience', 'Content'],
      [
        ['T+0 min', 'Acknowledge receipt', 'Trading partner, internal team', '"We are aware of the issue and investigating." No false promises.'],
        ['T+15 min', 'Initial assessment', 'Manager, team lead', 'Layer isolated (transport/map/BP/data). Impact scope known.'],
        ['T+30 min', 'Status update #1', 'All stakeholders', 'Root cause hypothesis. ETA for resolution or next update.'],
        ['T+resolution', 'Resolution notice', 'All stakeholders', 'What was wrong. What was done. Reprocessing status. Confirmation.'],
        ['T+24 hrs', 'Post-incident report', 'Manager, partner', 'Root cause, fix, preventive measures, lessons learned.'],
      ],
      [1800, 2500, 2000, 3060]
    ),
    spacer(80),
    callout('warning', 'NEVER commit to a resolution time you cannot control. Saying "it will be fixed in 30 minutes" and missing that deadline damages your credibility far more than saying "I am investigating and will update you in 30 minutes with a timeline." Stakeholders can handle uncertainty. They cannot handle broken promises.'),
    spacer(120),

    h2('7.5  Presenting EDI Work to Non-Technical Stakeholders'),
    p('Finance directors, procurement managers, and C-suite executives do not understand EDI segments. Your ability to translate technical findings into business language is a critical differentiator.'),
    spacer(80),
    h3('Translation Guide: EDI Technical → Business Language'),
    dataTable(
      ['What You Know (Technical)', 'What You Say (Business)'],
      [
        ['997 AK5=R received for the 850 we sent', 'Target\'s system rejected our purchase order. We know exactly which field caused it and are fixing it now.'],
        ['MDN decryption failed — certificate expired', 'Our digital handshake with the partner failed because our security certificate expired. We are renewing it — estimated 2-hour fix.'],
        ['ISA13 duplicate detected — suppressed by deduplication', 'We received the same order twice from Amazon. Our system correctly identified it as a duplicate and prevented it from entering our ERP.'],
        ['Translation failed — NM109 mandatory element missing in 837', 'We received a claim from the hospital but it was missing the patient\'s insurance member ID. We flagged it for correction before sending to the payer.'],
        ['SFTP SLA breach — 940s delivered 4 hours late', 'Warehouse orders were delayed by 4 hours due to a connection issue. No orders were lost — all were delivered and confirmed. We have fixed the root cause.'],
        ['PO1 loop MaxUse exceeded in Map Editor', 'We discovered that our system had a limit on how many line items it could process in a single order. We have increased that limit to handle any order size you send us.'],
      ],
      [4000, 5360]
    ),
    spacer(120),
    pageBreak(),
  ];
}

// ─── SECTION 8: UAT TESTING FRAMEWORK (full from second script) ─────────────
function makeSection8() {
  return [
    sectionBanner('8', 'UAT Testing Framework', 'End-to-End Testing Checklists, Test Case Templates, and Sign-Off Process'),
    spacer(120),
    callout('new', 'This section provides the complete testing framework that separates a confident EDI BA from a tentative one. Comprehensive UAT before go-live is the single most important risk mitigation in EDI implementation.'),
    spacer(120),

    h2('8.1  The UAT Testing Philosophy'),
    p('UAT for EDI is not about clicking through a UI — it is about systematically proving that every transaction type flows correctly through every path in the integration, under every data condition the production environment will encounter. Test like a skeptic. Deploy like you are certain.'),
    spacer(80),
    dataTable(
      ['Testing Phase', 'Who Leads', 'What Is Tested', 'Entry Criteria', 'Exit Criteria'],
      [
        ['Unit Testing', 'EDI BA', 'Individual maps in Map Editor against sample files', 'Map compiled without errors', 'All sample files produce expected output; no translation errors'],
        ['System Integration Testing', 'EDI BA + IT', 'End-to-end BP flow from adapter to ERP, single partner', 'All maps deployed to TEST; TEST BPs configured', 'Full document lifecycle completes; 997 generated; ERP receives data'],
        ['Performance Testing', 'EDI BA + IT', 'High-volume files; edge case file sizes (1, 100, 999 lines)', 'SIT passed; TEST environment mirrors PROD config', 'Performance within SLA; no timeouts at expected volumes'],
        ['Partner Testing', 'EDI BA + Partner EDI Team', 'Live test transmissions from partner test system', 'Partner test environment configured; our TEST configured', 'Partner confirms receipt of 997, 855, 856; we confirm receipt of 850'],
        ['UAT (Business)', 'Business Stakeholders + EDI BA', 'Business validation of output data in ERP', 'Partner testing passed; business test scenarios defined', 'Business stakeholder signs off on data accuracy in ERP'],
        ['Regression Testing', 'EDI BA', 'All existing partners unaffected by changes', 'Any map/BP change before PROD deployment', 'All existing transactions for all partners process without change'],
      ],
      [2000, 1500, 2500, 1680, 1680]
    ),
    spacer(120),

    h2('8.2  The Complete UAT Checklist — New Partner Onboarding'),
    h3('Phase 1: Map Testing (Unit Tests)'),
    ...checklistTable('Map Unit Testing Checklist', [
      'Compiled map without errors in Map Editor (zero compile warnings)',
      'Tested with "happy path" sample file — all mandatory fields present, all codes valid',
      'Tested with minimum viable file — only mandatory segments, all optional omitted',
      'Tested with maximum scale file — maximum number of line items (e.g., 999 PO1 loops)',
      'Tested with partner\'s companion guide test file (if provided)',
      'Tested with intentionally invalid file — confirmed map produces correct error (not silent failure)',
      'All cross-reference tables produce correct output for all code values in scope',
      'Date format conversions verified (CCYYMMDD → YYYY-MM-DD, etc.)',
      'Numeric precision verified (decimal amounts, quantity calculations)',
      'All optional fields produce correct null/default handling when absent',
      'Extended rules with conditionals tested for both true and false branches',
      'Output XML/flat file validated against target schema (XSD validation)',
      'Map version documented in S2T document',
    ]),
    spacer(80),
    h3('Phase 2: System Integration Testing'),
    ...checklistTable('System Integration Test Checklist', [
      'Inbound file drops into correct mailbox/directory and routing rule triggers correct BP',
      'BP reaches EDIDeenvelope step without error; envelope structure validated',
      '997 generated and sent back to partner within SLA window',
      'Translation step runs correct map version; output document correct',
      'Output document delivered to ERP via SFTP/MQ/API without error',
      'ERP confirms receipt of the document and can parse all fields',
      'Operations > Business Processes shows BP Completed (not Halted)',
      'Operations > Documents retains the raw inbound EDI payload',
      'Operations > Reports > EDI Correlation links the 850 to its 997',
      'Error path tested: intentionally break the map; confirm BP Halts; confirm alert email sent',
      'Deduplication tested: send the same ISA13 twice; confirm second is suppressed',
      'Duplicate 997 for same interchange is handled gracefully (not double-processed)',
    ]),
    spacer(80),
    h3('Phase 3: Partner Connectivity Testing'),
    ...checklistTable('Partner Connectivity Test Checklist', [
      'AS2 outbound test: send test file; confirm MDN received within 60 seconds',
      'AS2 inbound test: partner sends test file; confirm Sterling receives and MDN returned',
      'MDN content verified: signature valid; partner AS2 ID correct; encrypted correctly',
      'SFTP outbound test: PUT test file to partner directory; partner confirms receipt',
      'SFTP inbound test: partner places file; Sterling picks up within polling interval',
      'ISA15=T (test mode) confirmed in all test transmissions; ISA15=P NOT sent during testing',
      'Partner\'s test acknowledgment received and parsed correctly',
      'All partner-specific companion guide requirements validated against sent file',
      'Partner EDI contact has confirmed receipt of test 850, 855, 856, 997 in writing',
      'Partner has provided any required test sign-off documentation',
    ]),
    spacer(80),
    h3('Phase 4: Business UAT Sign-Off'),
    ...checklistTable('Business UAT Checklist', [
      'Business stakeholder can see the inbound PO data in ERP with all fields correct',
      'PO number, date, buyer ID, ship-to address all match the EDI 850 sent',
      'All line items present with correct SKU, quantity, unit of measure, price',
      '856 ASN creates correct shipment record in ERP or WMS',
      '810 invoice creates correct payable record in AP system',
      '820 remittance can be reconciled against open invoices',
      'Exception cases tested: partial shipments, cancelled lines, backordered items',
      'Business process for handling rejected 997s confirmed with procurement team',
      'Finance team has confirmed 820 reconciliation report meets their needs',
      'Formal UAT sign-off document signed by business stakeholder and IT lead',
    ]),
    spacer(120),

    h2('8.3  Sample Test Case Template'),
    dataTable(
      ['Field', 'Example Value'],
      [
        ['Test Case ID', 'TC-850-INBOUND-001'],
        ['Test Name', 'Standard 850 Purchase Order — Inbound Happy Path'],
        ['Transaction Type', 'X12 850 Purchase Order'],
        ['Trading Partner', 'Kroger / ISA06=1234567890'],
        ['Preconditions', 'Trading partner profile configured; 850 inbound map deployed to TEST; BP active'],
        ['Test Data File', '850_kroger_10_lines_valid.edi (attached)'],
        ['Test Steps', '1. Drop test file to /inbound/850/ directory. 2. Monitor Operations > Business Processes. 3. Confirm BP completes. 4. Check ERP for PO creation.'],
        ['Expected Result', 'BP completes; 997 AK5=A returned; ERP PO created with 10 line items; all fields match test file'],
        ['Actual Result', '[To be filled during testing]'],
        ['Pass / Fail', '[Circle one]'],
        ['Tested By', '[Name] [Date]'],
        ['Defect Reference', '[JIRA ticket if failed]'],
        ['Notes', '[Any observations]'],
      ],
      [2500, 6860]
    ),
    spacer(120),

    h2('8.4  Regression Testing — The Deployment Safety Net'),
    p('Every time you change a map or BP, you must run a regression test to confirm existing partners are unaffected. This is not optional. Many production incidents are caused by changes that fixed one partner\'s issue while silently breaking another\'s.'),
    spacer(80),
    h3('Building Your Regression Test Library'),
    ...['Maintain at least 3 test files per transaction type per partner: (1) standard file, (2) maximum size file, (3) edge case file (e.g., all optional fields present).', 
      'Store test files in version control (Git) or SharePoint under: /EDI/TestFiles/[PartnerName]/[TransactionType]/.',
      'For each test file, store the expected output: the exact XML or flat file that should be produced.',
      'Before any PROD deployment: run all regression files through the new map version in Map Editor. Compare output to stored expected output using a diff tool.',
      'Any diff must be intentional (i.e., you changed that field on purpose for the partner being fixed). Unintentional diffs are bugs.',
      'Regression test time budget: allow 30 minutes per partner per transaction type. Plan accordingly in your change management requests.',
    ].map(t => bullet(t)),
    spacer(120),
    pageBreak(),
  ];
}

// ─── SECTION 9: ESSENTIAL BA DELIVERABLES (full from second script) ─────────
function makeSection9() {
  return [
    sectionBanner('9', 'Essential BA Deliverables', 'The Documents Every EDI BA Must Know How to Produce'),
    spacer(120),
    callout('new', 'Your value as an EDI BA is not just in what you can configure — it is in the documentation you produce. These deliverables communicate your work to stakeholders, protect the organization in audits, and enable the team that comes after you to maintain the integration.'),
    spacer(120),

    h2('9.1  The Source-to-Target (S2T) Mapping Document'),
    p('The S2T (Source-to-Target) mapping document is the foundational specification for any EDI integration. It maps every field from the source system to the target, documents transformation rules, and serves as the reference throughout development, testing, and maintenance.'),
    spacer(80),
    h3('S2T Document Structure'),
    dataTable(
      ['Section', 'Content', 'Purpose'],
      [
        ['Header', 'Project name, partner name, transaction type, version, author, date, revision history', 'Identification and change management'],
        ['Overview', 'High-level data flow diagram, protocol, document types, SLA requirements', 'Executive and stakeholder reference'],
        ['Envelope Mapping', 'ISA/GS/ST configurations: your sender ID, partner receiver ID, version, test/prod flag', 'Sterling trading partner profile configuration reference'],
        ['Field Mapping Table', 'For each output field: source segment/element, transformation rule, mandatory/optional, notes', 'The heart of the document — maps every field'],
        ['Cross-Reference Tables', 'Code translation tables: e.g., UOM EA→EA; Product Type codes; N1 qualifiers', 'Reference for xref_lookup rules in the map'],
        ['Conditional Logic', 'Complex business rules: "if BEG03=SA, set PO type=Standard; if BEG03=CN, set type=Cancel"', 'Documents extended rule logic in plain language'],
        ['Exception Handling', 'What happens when mandatory fields are missing, invalid codes received, etc.', 'Error handling specification'],
        ['Test Scenarios', 'List of test cases with file names and expected results', 'Links to UAT test plan'],
        ['Sign-Off', 'Business stakeholder, IT lead, trading partner contact signatures', 'Formal approval before go-live'],
        ['Revision History', 'Date, version, change description, author', 'Audit trail of all changes'],
      ],
      [2000, 4000, 3360]
    ),
    spacer(80),
    h3('S2T Field Mapping Table — Example Row Structure'),
    dataTable(
      ['Output Field', 'X12 Seg/Ele', 'Source', 'Transformation Rule', 'Required', 'Notes'],
      [
        ['Purchase Order Number', 'BEG03', 'ERP PO Header.PONumber', 'Direct — no transformation', 'M', 'Max 22 chars per companion guide'],
        ['PO Date', 'BEG05', 'ERP PO Header.CreateDate', 'Convert YYYY-MM-DD → CCYYMMDD', 'M', 'Use dateconvert("date", "YYYY-MM-DD", "CCYYMMDD")'],
        ['Ship-To Name', 'N1*ST*N102', 'ERP PO ShipTo.Name', 'Direct', 'M', 'Truncate to 60 chars if longer'],
        ['Ship-To Zip', 'N3/N4', 'ERP PO ShipTo.Zip', 'Direct (no leading zeros lost)', 'M', 'Zip+4: format as NNNNN-NNNN if 9 digits'],
        ['Unit of Measure', 'PO1-03', 'ERP LineItem.UOM', 'xref_lookup("UOM_XREF", ERP_UOM, EDI_UOM)', 'M', 'See UOM Cross-Reference table on tab 3'],
        ['Unit Price', 'PO1-04', 'ERP LineItem.UnitPrice', 'Format as decimal with 2 decimal places', 'C', 'Conditional: omit if BEG03 = CN (cancel)'],
        ['Extended Price', 'PO1-05', 'Calculated', 'Qty * UnitPrice; accumulate for CTT02', 'O', 'Used in CTT hash total — see accumulator rule'],
      ],
      [2000, 1500, 2000, 2500, 1000, 2360]
    ),
    spacer(120),

    h2('9.2  The Trading Partner Onboarding Form'),
    p('Every new trading partner integration should begin with a completed onboarding form. This document captures all the information you need before development begins and serves as a reference throughout the project.'),
    spacer(80),
    dataTable(
      ['Section', 'Fields to Capture'],
      [
        ['Partner Identity', 'Legal name; common name; EDI contact name; EDI contact email; EDI contact phone; escalation contact'],
        ['EDI Identifiers', 'ISA05/ISA06 (your qualifier/ID as they know you); ISA07/ISA08 (their qualifier/ID); GS Sender/Receiver IDs'],
        ['Communication Protocol', 'Protocol: AS2 / SFTP / FTP / VAN; environment (TEST / PROD) details for each'],
        ['AS2 Parameters (if AS2)', 'Their AS2 ID; their AS2 URL; MDN type (sync/async); async MDN URL; encryption: Yes/No + algorithm; signing: Yes/No + algorithm'],
        ['SFTP Parameters (if SFTP)', 'Hostname; port; auth method (password/key); remote inbound dir; remote outbound dir; filename pattern'],
        ['Certificate Exchange', 'Date certificates exchanged; their cert alias in Sterling; your cert shared with them; expiry dates'],
        ['Transaction Types', 'List of all transaction sets; direction (inbound/outbound); frequency; SLA requirements'],
        ['Companion Guide', 'Version number; date received; SharePoint link; key deviations from X12 standard noted'],
        ['Testing Details', 'Test go-live date; partner test contact; test file names provided; certification requirement'],
        ['Production Details', 'Production go-live date; first production transaction date; hypercare period (how long you monitor closely)'],
      ],
      [2800, 6560]
    ),
    spacer(120),

    h2('9.3  The Post-Go-Live Hypercare Report'),
    p('For the first 5 business days after a new partner goes live in production, the EDI BA should produce a daily hypercare report. This demonstrates professionalism, catches issues early, and builds partner confidence.'),
    spacer(80),
    dataTable(
      ['Hypercare Report Section', 'Content'],
      [
        ['Date & Day Number', 'Day 1 of 5, [date]'],
        ['Transaction Summary', 'Number of 850s received; number of 856s sent; number of 997s; all counts vs. expected'],
        ['Success Rate', '% of BPs completing without errors; any failures with root cause'],
        ['Partner Confirmation', 'Did partner confirm receipt of all outbound documents? Any partner-side rejections?'],
        ['Open Issues', 'Any outstanding items; JIRA ticket reference; owner; target resolution date'],
        ['Actions Taken Today', 'Any fixes applied; map changes; BP adjustments'],
        ['Tomorrow\'s Focus', 'What to watch for; any scheduled partner communication'],
      ],
      [3000, 6360]
    ),
    spacer(120),
    callout('tip', 'Producing a hypercare report unprompted signals to your manager and the business that you take ownership. Most EDI BAs deploy and move on. Those who monitor, document, and communicate the first 5 days stand out immediately.'),
    spacer(120),
    pageBreak(),
  ];
}

// ─── SECTION 10: COMPLIANCE, SECURITY & QUICK REFERENCE (full from second script) ──
function makeSection10() {
  return [
    sectionBanner('10', 'Compliance, Security & Quick Reference', 'HIPAA, SOX, Data Retention, and Your Production-Ready Cheat Sheet'),
    spacer(120),
    callout('new', 'Compliance and security are not someone else\'s job. As the EDI BA, you are often the person closest to the data flow — and the first person asked when an audit question arises. Know these fundamentals.'),
    spacer(120),

    h2('10.1  HIPAA Compliance for Healthcare EDI'),
    dataTable(
      ['HIPAA Rule', 'EDI Impact', 'Your Responsibility'],
      [
        ['Transaction Standards', 'Mandates X12 5010 for 837, 835, 834, 270, 271, 276, 277, 820, 834, 835, 837', 'Ensure correct version in GS08 (005010X221 etc.); never use obsolete 4010'],
        ['Privacy Rule (HIPAA-PHI)', 'Patient data in EDI (PID, NM1, CLM) is PHI — must be protected', 'AS2 encryption mandatory; SFTP with SSH keys mandatory; never FTP (unencrypted)'],
        ['Security Rule', 'Transmission security: all PHI EDI must be encrypted in transit and at rest', 'AS2 with encryption=Yes; audit logs maintained; access controls on Sterling'],
        ['Breach Notification', 'PHI data loss must be reported within 60 days', 'Implement immediate alerting on any EDI failure involving PHI data'],
        ['Audit Trails', 'Must demonstrate who accessed PHI and when', 'Sterling Operations > Documents provides this; configure retention per HIPAA (6 years)'],
        ['Business Associate Agreement (BAA)', 'Any system processing PHI must have a BAA with the covered entity', 'Ensure your organization has a BAA with healthcare trading partners and VAN providers'],
        ['999 vs. 997', 'HIPAA 5010 uses 999 Implementation Acknowledgment, not 997', 'Configure Sterling to generate/process 999 for all 5010 HIPAA transactions'],
      ],
      [2500, 3200, 3660]
    ),
    spacer(120),

    h2('10.2  Data Retention and Audit Requirements'),
    dataTable(
      ['Industry', 'Minimum Retention Period', 'What Must Be Retained', 'Sterling Configuration'],
      [
        ['Healthcare (HIPAA)', '6 years from creation or last effective date', 'All PHI transactions: 837, 835, 834, 270, 271', 'Operations > System > Document Retention = 2190 days (6 years)'],
        ['Retail / Consumer', '3-7 years (varies by state tax law)', 'Purchase orders, invoices (850, 810, 856)', 'Minimum 3 years (1095 days) for audit defensibility'],
        ['Financial (SOX)', '7 years', 'All financial transactions: 820 remittance, 810 invoices', 'Configure Sterling document retention = 2555 days'],
        ['Government / Federal', '10+ years', 'All procurement and payment transactions', 'External archival required beyond Sterling\'s default capacity'],
        ['Pharmaceutical (FDA)', '10 years for product traceability', '856 ASN with lot/serial data under DSCSA', 'Full HL loop with SN1 and LIN data retained'],
      ],
      [2000, 2000, 3000, 2360]
    ),
    spacer(80),
    callout('critical', 'Never delete Sterling\'s Operations > Documents data without confirming retention requirements with your Legal and Compliance teams. Deleting audit-required EDI records — even to save disk space — can result in regulatory violations, failed audits, and contract breaches.'),
    spacer(120),

    h2('10.3  Security Best Practices for the EDI BA'),
    ...['Certificate management: create a calendar reminder 90 days before every certificate expiry date. Certificate rotation with zero downtime requires coordination with the partner — you need lead time.', 
      'SSH key rotation: implement annual SSH key rotation for SFTP connections. Document the rotation procedure so it can be executed under time pressure if a partner rotates their key unexpectedly.',
      'Never disable host key verification: the "known hosts" check in SFTP is a man-in-the-middle attack prevention mechanism. Never set "Trust All" in SFTP adapter configuration in production.',
      'Principle of least privilege: SFTP user accounts should have write access only to the specific directories needed — not root or home directory access.',
      'Test vs. Production separation: always confirm ISA15=T before any test transmission. A test 850 landing in a partner\'s production system can trigger real fulfillment. Always confirm before sending.',
      'Credential storage: never store SFTP passwords or API keys in plain text in Sterling adapter configurations. Use Sterling\'s credential store or your organization\'s secrets management system.',
      'VPN for remote access: always access the Sterling dashboard via VPN. Never access over public networks.',
      'Incident response plan: know your organization\'s incident response process for potential data breaches involving EDI. Who do you call first? What is your 30-minute action plan?',
    ].map(t => bullet(t)),
    spacer(120),

    h2('10.4  EDI X12 Segment Quick Reference'),
    dataTable(
      ['Segment', 'Transaction', 'Purpose', 'Key Elements'],
      [
        ['ISA/IEA', 'All', 'Interchange envelope', 'ISA05/06=Sender, ISA07/08=Receiver, ISA12=Version, ISA15=P/T'],
        ['GS/GE', 'All', 'Functional group', 'GS01=Type (PO/IN/FA/SH), GS06=Group Ctrl Num'],
        ['ST/SE', 'All', 'Transaction set', 'ST01=TxnSet#, ST02=TxnCtrlNum; SE01=SegmentCount'],
        ['BEG', '850', 'PO header', 'BEG02=PO type, BEG03=PO#, BEG05=PO Date'],
        ['BIG', '810', 'Invoice header', 'BIG01=InvDate, BIG02=InvNum, BIG04=POReference'],
        ['BSN', '856', 'ASN header', 'BSN02=ShipmentID, BSN03=Date, BSN04=Time'],
        ['N1', 'All', 'Party name', 'N101=Qualifier(ST/BT/SF), N102=Name, N103/04=ID type/value'],
        ['PO1', '850', 'Line item', 'PO101=Line#, PO102=Qty, PO103=UOM, PO104=Price, PO105=PriceBasis'],
        ['IT1', '810', 'Invoice line', 'IT101=Line#, IT102=Qty, IT103=UOM, IT104=Price'],
        ['HL', '856', 'Hierarchy level', 'HL01=Level#, HL02=Parent#, HL03=S/O/P/I'],
        ['CTT', '850', 'Transaction totals', 'CTT01=LineCount, CTT02=HashTotal'],
        ['AK1', '997', 'Group ack', 'AK101=FuncID, AK102=GrpCtrlNum, AK103=Version'],
        ['AK3', '997', 'Segment error', 'AK301=SegID, AK302=LineNum, AK304=ErrorCode'],
        ['AK4', '997', 'Element error', 'AK401=ElemPos, AK403=ErrorCode, AK404=BadValue'],
        ['AK5', '997', 'Txn disposition', 'AK501=A/E/R/M/W/X — A=Accepted, R=Rejected'],
      ],
      [1100, 900, 2500, 4860]
    ),
    spacer(120),

    h2('10.5  AK4 Error Code Reference'),
    dataTable(
      ['Code', 'Meaning', 'Common Cause'],
      [
        ['1', 'Mandatory element missing', 'Required field left blank in map output; check map for null protection'],
        ['2', 'Conditional required element missing', 'Dependency rule violated; read companion guide for conditionals'],
        ['3', 'Too many data elements', 'Extra delimiters in segment; map generating extra empty elements'],
        ['4', 'Data element too short', 'Value below minimum length; check min length in map element properties'],
        ['5', 'Data element too long', 'Value exceeds maximum length; add truncation in extended rule'],
        ['6', 'Invalid character', 'Control character or non-printable ASCII in data; cleanse ERP data'],
        ['7', 'Invalid code value', 'Code not in companion guide allowed list; check xref lookup or constant'],
        ['8', 'Invalid date', 'Date format wrong or non-existent date; check dateconvert rule'],
        ['9', 'Invalid time', 'Time format incorrect; check time element format in map'],
        ['10', 'Exclusion condition violated', 'Mutually exclusive elements both present; check companion guide'],
      ],
      [900, 2600, 5860]
    ),
    spacer(120),

    h2('10.6  Sterling Dashboard Quick Navigation'),
    dataTable(
      ['Task', 'Navigate To'],
      [
        ['Monitor BP failures', 'Operations > Business Processes > Status=Halted'],
        ['Pull raw EDI document', 'Operations > Documents > search by partner/date'],
        ['Check 997 receipt', 'Operations > Reports > EDI Correlation'],
        ['Deploy a new map', 'Deployment > Maps > New Map'],
        ['Deploy a new BP', 'Deployment > Business Processes > Create'],
        ['Create trading partner', 'Administration > Trading Partners > New'],
        ['Configure AS2 profile', 'Administration > Trading Partners > AS2 > New'],
        ['Import certificate', 'Administration > Certificates > Import'],
        ['Configure SFTP adapter', 'Administration > Adapter > SFTPClientAdapter'],
        ['Add SSH key', 'Administration > Trading Partners > SSH Private Keys'],
        ['Create mailbox', 'Mailbox > Manage Mailboxes > New'],
        ['Create routing rule', 'Mailbox > Routing Rules > New'],
        ['Schedule a BP', 'Deployment > Schedules > New Schedule'],
        ['Create cross-reference', 'Administration > Trading Partner > Code Lists > New'],
        ['Check system performance', 'Administration > System > Performance Tuning'],
        ['View adapter logs', 'SSH: tail -f /opt/IBM/SterlingIntegrator/logs/adapter.log'],
      ],
      [3500, 5860]
    ),
    spacer(120),

    // Final Banner
    new Table({
      width: { size: 9360, type: WidthType.DXA }, columnWidths: [9360],
      rows: [new TableRow({ children: [new TableCell({
        borders: noBorders(), shading: { fill: C.brand, type: ShadingType.CLEAR },
        margins: { top: 300, bottom: 300, left: 400, right: 400 }, width: { size: 9360, type: WidthType.DXA },
        children: [
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '✅ YOU ARE PRODUCTION-READY', color: C.gold, bold: true, size: 32, font: 'Arial' })] }),
          spacer(80),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Master the labs. Practice the scenarios. Own the troubleshooting checklist.', color: C.white, size: 24, font: 'Arial', italics: true })] }),
          spacer(60),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'The difference between a junior and a senior EDI BA is the confidence to diagnose any situation — without panic.', color: 'BDD7EE', size: 22, font: 'Arial' })] }),
          spacer(60),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'IBM Sterling B2B Integrator — Complete Training Guide | Enhanced Edition 2026', color: C.lightBlue, size: 18, font: 'Arial' })] }),
        ]
      })] })]
    }),
    spacer(120),
  ];
}

// ─── MAIN DOCUMENT BUILD ─────────────────────────────────────────────────────
async function buildDocument() {
  const allSections = [
    ...makeCoverPage(),
    ...makeSection0(),
    ...makeSection1(),
    ...makeSection2(),
    ...makeSections3456(),
    ...makeSection7(),
    ...makeSection8(),
    ...makeSection9(),
    ...makeSection10(),
  ];

  const doc = new Document({
    numbering: {
      config: [
        {
          reference: 'bullets',
          levels: [{
            level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } }
          }]
        },
        {
          reference: 'numbers',
          levels: [{
            level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } }
          }]
        },
      ]
    },
    styles: {
      default: {
        document: { run: { font: 'Arial', size: 22, color: C.dark } }
      },
      paragraphStyles: [
        {
          id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 36, bold: true, font: 'Arial', color: C.brand },
          paragraph: { spacing: { before: 360, after: 120 }, outlineLevel: 0 }
        },
        {
          id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 28, bold: true, font: 'Arial', color: C.accent },
          paragraph: { spacing: { before: 280, after: 100 }, outlineLevel: 1 }
        },
        {
          id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 24, bold: true, font: 'Arial', color: C.accent2 },
          paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 2 }
        },
      ]
    },
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 }
        }
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: C.accent, space: 1 } },
              children: [
                new TextRun({ text: 'IBM Sterling B2B Integrator — Complete Job-Ready Training Guide  |  Enhanced 2026 Edition', color: C.light, size: 18, font: 'Arial' }),
              ]
            })
          ]
        })
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              border: { top: { style: BorderStyle.SINGLE, size: 6, color: C.accent, space: 1 } },
              children: [
                new TextRun({ text: 'EDI BA Training Guide — Production Ready  |  Page ', color: C.light, size: 18, font: 'Arial' }),
                new TextRun({ children: [new PageNumber.current()], color: C.accent, size: 18, font: 'Arial', bold: true }),
              ]
            })
          ]
        })
      },
      children: allSections
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync('./EDI_BA_Complete_Training_Guide_2026.docx', buffer);
  console.log('✅ Document generated successfully!');
  console.log('File size:', Math.round(buffer.length / 1024), 'KB');
}

buildDocument().catch(console.error);
