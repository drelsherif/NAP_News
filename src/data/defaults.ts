import { v4 as uuidv4 } from 'uuid';
import type {
  Block, BlockType, Newsletter, NewsletterMeta, ThemePreset,
  Article, QuickHit, SbarStep, ClinicalPrompt, SafetyUpdate, NorthwellItem,
} from '../types';
import { THEMES } from './themes';

// ─── Article factory ─────────────────────────────────────────────────────────

export function makeArticle(overrides: Partial<Article> = {}): Article {
  return {
    id: uuidv4(), title: 'Article Title', source: 'Source / Journal',
    url: '', imageUrl: '', pubDate: '', summary: 'Brief summary of the study.',
    clinicalContext: 'Clinical context and implications for practice.',
    myTake: 'Your clinical voice here.', evidenceLevel: 'Moderate', tags: [],
    ...overrides,
  };
}

// ─── Block factories ─────────────────────────────────────────────────────────

export const BLOCK_DEFAULTS: Record<BlockType, () => Block> = {
  header: () => ({
    id: uuidv4(), type: 'header',
    title: 'The Neurology AI Pulse',
    subtitle: 'Artificial Intelligence in Clinical Neuroscience',
    issueNumber: 'Issue 001',
    issueDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    tagline: 'Edited by Yasir El-Sherif MD, PhD & Jai Shahani MD · Staten Island University Hospital · Northwell Health',
    logoUrl: '', logoDataUrl: '', backgroundStyle: 'gradient', accentColor: '#009CDE',
  }),

  ticker: () => ({
    id: uuidv4(), type: 'ticker',
    sourceMode: 'manual',
    items: [
      'Nature Medicine: AI CT screening reaches 94% sensitivity across 47 RCTs',
      'FDA authorizes record 692 AI medical devices in 2024',
      'JAMA RCT: AI scribes reduce physician burnout 34% at 6 months',
    ],
    links: [],
    useLinks: false,
    rssUrls: [],
    rssMaxItems: 20,
    speed: 'medium',
    backgroundColor: '#003087',
    textColor: '#ffffff',
  }),

  'section-divider': () => ({
    id: uuidv4(), type: 'section-divider',
    label: 'TOP NEUROLOGY AI NEWS', style: 'gradient', number: 1, description: '',
  }),

  'article-grid': () => ({
    id: uuidv4(), type: 'article-grid',
    sectionTitle: 'This Week in Neurology AI', columns: 2, layout: 'card',
    articles: [makeArticle({ title: 'AI Seizure Detection: CNN vs LSTM' }), makeArticle({ title: 'Foundation Models in Neuroradiology' })],
  }),

  spotlight: () => ({
    id: uuidv4(), type: 'spotlight',
    article: makeArticle({ title: 'Spotlight: Paper of the Month' }),
    accentColor: '#009CDE', layout: 'left-image',
  }),

  'ethics-split': () => ({
    id: uuidv4(), type: 'ethics-split',
    heading: 'AI Governance & Ethics Update',
    subheading: 'What it means for clinical practice',
    leftTitle: 'The Concern', leftContent: 'Describe the ethical or governance concern here.',
    rightTitle: 'Clinical Perspective', rightContent: 'Your clinical perspective and recommended approach.',
    clinicalPerspective: '', url: '', source: '',
  }),

  image: () => ({
    id: uuidv4(), type: 'image', url: '', dataUrl: '', alt: '', caption: '',
    linkUrl: '', width: 'full', alignment: 'center', borderRadius: 12,
  }),

  text: () => ({
    id: uuidv4(), type: 'text',
    html: '<p>Click to edit this text block. You can write <strong>bold</strong>, <em>italic</em>, and include <a href="#">links</a>.</p>',
    alignment: 'left', maxWidth: 'reading',
  }),

  'html-embed': () => ({
    id: uuidv4(), type: 'html-embed',
    html: '<div style="padding:20px;border:1px dashed #ccc;border-radius:8px;text-align:center;color:#888">Custom HTML content</div>',
    label: 'Custom HTML',
  }),

  'prompt-masterclass': () => ({
    id: uuidv4(), type: 'prompt-masterclass',
    heading: 'Prompt Like a Rockstar',
    step: 'Step 1 — The Baseline',
    framework: 'Context → Task → Constraints',
    badPrompt: '"Explain MS."',
    goodPrompt: 'Act as a neurology attending. In 120–160 words, explain MS pathophysiology focusing on demyelination and immune mechanisms. Exclude treatment and epidemiology. Add 2 "clinical correlates" relevant to bedside localization. If uncertain, say so.',
    explanation: 'Better prompts save time and reduce hallucinations. Persona + task verb + negative constraints + uncertainty disclosure.',
  }),

  'sbar-prompt': () => ({
    id: uuidv4(), type: 'sbar-prompt',
    heading: 'SBAR-P Clinical AI Prompting Framework',
    steps: [
      {
        letter: 'S',
        name: 'SITUATION',
        description: 'State the clinical context clearly — the care setting and presenting problem.',
        example: '58-year-old female admitted with acute decompensated heart failure, EF 25%, currently on IV furosemide.'
      },
      {
        letter: 'B',
        name: 'BACKGROUND',
        description: 'Provide relevant history, current medications, allergies, and key investigations.',
        example: 'PMH: CKD stage 3 (eGFR 38), type 2 diabetes. Current Cr 2.1 (baseline 1.6). On metformin, lisinopril, carvedilol.'
      },
      {
        letter: 'A',
        name: 'ASK',
        description: 'Be explicit about exactly what you want. Vague asks produce vague answers.',
        example: 'List the top 5 causes of worsening renal function in this setting and the targeted workup for each.'
      },
      {
        letter: 'R',
        name: 'ROLE',
        description: 'Assign a clinical persona to anchor the AI\'s frame of reference and reasoning style.',
        example: 'Respond as a nephrology consultant reviewing this case and preparing a consultation note.'
      },
      {
        letter: 'P',
        name: 'PARAMETERS',
        description: 'Set safety guardrails: specify the evidence base, require uncertainty disclosure, and define what to do when information is insufficient.',
        example: 'Use current KDIGO 2024 guidelines. Explicitly flag any uncertainty. Do not fabricate lab values or medication doses.'
      },
    ] as SbarStep[],
    templatePrompt: `Act as a [SPECIALTY] consultant reviewing this case.\n\nPatient: [AGE] [SEX] presenting with [CHIEF COMPLAINT] for [DURATION].\nKey findings: [VITAL SIGNS, EXAM FINDINGS, KEY LABS/IMAGING]\nPMH: [RELEVANT COMORBIDITIES]\nCurrent medications: [MED LIST]\n\nTask: Generate a prioritized differential diagnosis (top 5 conditions).\nFor each diagnosis, provide:\n  1. Likelihood assessment (High / Moderate / Low)\n  2. Supporting clinical features from this case\n  3. Single most informative next investigation\n\nRequirements:\n- Base reasoning on current evidence-based guidelines\n- Explicitly flag areas of uncertainty\n- Do not fabricate laboratory values, imaging findings, or medication doses\n- If clinical information is insufficient, state what additional data is needed`,
    safetyTips: [
      'Always verify AI-generated clinical reasoning against primary sources before acting.',
      'Never submit patient-identifiable information (PHI) to consumer AI tools — use only approved institutional platforms.',
      'AI supports clinical judgment; it does not replace it. Final decisions remain with the treating clinician.',
      'Document AI tool use in the medical record where institutional policy requires it.',
    ],
  }),

  'clinical-prompt-templates': () => ({
    id: uuidv4(), type: 'clinical-prompt-templates',
    heading: 'Clinical Prompt Templates',
    description: 'Click any prompt to copy it. Ready-to-use templates for common clinical AI scenarios.',
    templates: [
      {
        id: uuidv4(), category: 'Differential Diagnosis',
        title: 'Generate Differential Diagnosis',
        prompt: 'Act as a neurology attending. My patient is a [AGE] [SEX] presenting with [SYMPTOM] for [DURATION]. Key findings: [EXAM/LABS/IMAGING]. Generate a prioritized differential (top 5), with likelihood, supporting features, and one targeted investigation for each. Use evidence-based reasoning. Flag uncertainty. Do not fabricate data.',
        useCase: 'Clinical reasoning support for complex presentations',
      },
      {
        id: uuidv4(), category: 'Discharge Summary',
        title: 'Discharge Summary Draft',
        prompt: 'Act as a hospitalist writing a discharge summary. Patient: [NAME OMITTED], [AGE] [SEX], admitted [DATE] for [PRIMARY DIAGNOSIS]. Hospital course: [BRIEF SUMMARY]. Discharge condition: [STABLE/IMPROVED]. Write a structured discharge summary including: diagnosis, hospital course, discharge medications, follow-up instructions, and return precautions. Use clear patient-friendly language for the patient section.',
        useCase: 'Streamline discharge documentation',
      },
      {
        id: uuidv4(), category: 'Literature Review',
        title: 'Evidence Summary',
        prompt: 'Summarize the current evidence base for [INTERVENTION/DRUG/PROCEDURE] in patients with [CONDITION]. Include: level of evidence, key RCTs or meta-analyses, effect size, number needed to treat (if applicable), major contraindications, and areas of ongoing debate. Limit to 200 words. Cite uncertainty where evidence is weak. Do not fabricate citations.',
        useCase: 'Quick evidence review at the point of care',
      },
      {
        id: uuidv4(), category: 'Patient Education',
        title: 'Patient Education Letter',
        prompt: 'Write a patient education letter for a [AGE]-year-old with [DIAGNOSIS]. Explain: what the condition is, why it matters, the recommended treatment plan, what to expect, and when to seek urgent care. Use a 6th-grade reading level. Avoid medical jargon. End with 3 specific "warning signs" requiring immediate emergency evaluation.',
        useCase: 'Generate patient-readable health information',
      },
      {
        id: uuidv4(), category: 'EEG / EMG Report',
        title: 'Neurophysiology Interpretation',
        prompt: 'Act as a clinical neurophysiologist. Interpret the following EEG/EMG findings and generate a structured report: [PASTE FINDINGS]. Include: technical quality, relevant findings, clinical correlation, and impression. Note limitations. Flag any findings that warrant urgent clinical attention. Do not infer diagnoses beyond what the data supports.',
        useCase: 'Neurophysiology report drafting and review',
      },
      {
        id: uuidv4(), category: 'Research',
        title: 'Research Abstract Summary',
        prompt: 'Summarize this research paper for a clinical audience. Provide: (1) Study question in one sentence, (2) Study design and population, (3) Primary outcome and result, (4) Key limitations, (5) Clinical bottom line in one sentence. Keep total to 150 words. Do not overstate conclusions beyond what the study supports.',
        useCase: 'Rapid journal club and literature scanning',
      },
    ] as ClinicalPrompt[],
  }),

  'term-of-month': () => ({
    id: uuidv4(), type: 'term-of-month',
    term: 'Foundation Model',
    definition: 'A large-scale AI model trained on broad, diverse data that serves as a reusable base adaptable to many downstream tasks — including text, medical imaging, and multimodal applications.',
    relevance: 'Foundation models shift clinical AI from narrow, single-disease algorithms to robust systems that can generalize across conditions — enabling faster iteration and broader utility, while introducing new governance and validation challenges.',
    neurologyApplication: 'A vision foundation model trained on large MRI datasets can screen for multiple emergencies (stroke, hemorrhage, mass effect, hydrocephalus) from a single inference, rather than requiring separate validated detectors for each pathology.',
    relatedTerms: ['Transfer Learning', 'Fine-tuning', 'Large Language Model', 'GPT', 'Multimodal AI', 'BERT'],
  }),

  'ai-case-file': () => ({
    id: uuidv4(), type: 'ai-case-file',
    year: '1950',
    title: 'The Turing Test',
    content: 'In 1950, Alan Turing published "Computing Machinery and Intelligence," proposing the Imitation Game as a practical test for machine intelligence. Rather than asking "Can machines think?" — philosophically unanswerable — Turing asked whether a machine could behave indistinguishably from a human in text conversation. This reframing from metaphysics to measurement shaped the next 70 years of AI development.',
    significance: 'The Turing Test established the behavioral benchmark for AI that still drives philosophical debate about machine consciousness, language, and cognition today.',
    imageUrl: '',
    imageDataUrl: '',
    sourceUrl: 'https://doi.org/10.1093/mind/LIX.236.433',
    sourceLabel: 'Turing, 1950 — Mind Journal',
  }),

  'quick-hits': () => ({
    id: uuidv4(), type: 'quick-hits',
    heading: 'Quick Hits',
    hits: [
      { id: uuidv4(), title: 'Add article title here', url: '', source: 'Journal', summary: '1–2 line summary.' },
      { id: uuidv4(), title: 'Add article title here', url: '', source: 'Journal', summary: '1–2 line summary.' },
    ] as QuickHit[],
  }),

  humor: () => ({
    id: uuidv4(), type: 'humor',
    heading: '🧠 Neurology Humor Break',
    content: 'My AI dictation system transcribed "patient denies diplopia" as "patient denies diplopia, but suspects the government." To be fair, given the context of the visit, I cannot entirely rule this out.',
    attribution: '— Submitted anonymously by a Northwell attending',
    emojiDecor: '🧠',
    imageUrl: '',
    imageDataUrl: '',
    sourceUrl: '',
    imageHeight: undefined,
    imageFit: 'contain' as const,
  }),

  spacer: () => ({
    id: uuidv4(), type: 'spacer', height: 32, showLine: false, lineStyle: 'solid',
  }),

  footer: () => ({
    id: uuidv4(), type: 'footer',
    institution: 'Northwell Health', department: 'Department of Neurology',
    editors: 'Yasir El-Sherif MD, PhD & Jai Shahani MD',
    unsubscribeUrl: '#unsubscribe', subscribeUrl: '#subscribe',
    websiteUrl: 'https://www.northwell.edu/neurology',
    contactEmail: 'neurologyai@northwell.edu',
    copyrightYear: String(new Date().getFullYear()),
    disclaimer: 'This newsletter is for educational purposes only and does not constitute medical advice. Content represents the views of the authors and not Northwell Health as an institution.',
    socials: [{ platform: 'Twitter/X', url: '#', icon: 'twitter' }, { platform: 'LinkedIn', url: '#', icon: 'linkedin' }],
    showSocials: true, nextIssueDate: '', nextIssueTeaser: '',
  }),

  'ai-safety': () => ({
    id: uuidv4(), type: 'ai-safety',
    heading: 'AI Safety Monitor',
    subheading: 'Regulatory updates, incidents, and clinical safety alerts',
    showLastUpdated: true,
    updates: [
      {
        id: uuidv4(),
        date: new Date().toISOString().split('T')[0],
        category: 'FDA',
        title: 'FDA Issues Guidance on AI-Enabled Medical Devices',
        summary: 'New guidance emphasizes post-market surveillance requirements for adaptive AI algorithms used in clinical decision support.',
        url: 'https://www.fda.gov/medical-devices/software-medical-device-samd/artificial-intelligence-and-machine-learning-aiml-enabled-medical-devices',
        severity: 'high',
      },
      {
        id: uuidv4(),
        date: new Date().toISOString().split('T')[0],
        category: 'Guideline',
        title: 'AAN Position Statement: Clinical Use of Large Language Models',
        summary: 'The American Academy of Neurology recommends structured validation and institutional oversight before deploying LLMs in patient-facing clinical workflows.',
        url: 'https://www.aan.com',
        severity: 'medium',
      },
      {
        id: uuidv4(),
        date: new Date().toISOString().split('T')[0],
        category: 'Alert',
        title: 'Hallucination Risk: AI Drug Dosing Tools',
        summary: 'Multiple case reports have identified incorrect medication dosing recommendations from consumer AI chatbots used without clinical validation. Institutional guardrails are strongly recommended.',
        url: '',
        severity: 'critical',
      },
    ] as SafetyUpdate[],
  }),

  'northwell-spotlight': () => ({
    id: uuidv4(), type: 'northwell-spotlight',
    heading: 'Northwell Health AI Spotlight',
    subheading: 'Latest AI innovation from across the Northwell system',
    autoFetch: false,
    lastFetched: '',
    maxItems: 6,
    items: [
      {
        id: uuidv4(), category: 'Innovation',
        title: 'Add Northwell AI news item',
        url: 'https://www.northwell.edu/news',
        pubDate: new Date().toISOString(),
        summary: 'Summary of the Northwell AI initiative or news item.',
        imageUrl: '',
      },
    ] as NorthwellItem[],
  }),

  'rss-sidebar': () => ({
    id: uuidv4(), type: 'rss-sidebar',
    heading: 'In the Feed This Week',
    feedUrls: [
      'https://pubmed.ncbi.nlm.nih.gov/rss/search/1/?term=neurology+artificial+intelligence&sort=date',
    ],
    items: [],
    maxItems: 8,
    lastFetched: '',
    position: 'inline',
    refreshOnView: false,
  }),
};

export const BLOCK_LABELS: Record<BlockType, string> = {
  'header':                    '🏷️  Header / Masthead',
  'ticker':                    '📡  Scrolling News Ticker',
  'section-divider':           '➖  Section Divider',
  'article-grid':              '📰  Article Grid',
  'spotlight':                 '🔦  Spotlight Article',
  'ethics-split':              '⚖️   Ethics & Governance',
  'image':                     '🖼️  Image Block',
  'text':                      '📝  Rich Text Block',
  'html-embed':                '💻  HTML Embed',
  'prompt-masterclass':        '🤖  Prompt Masterclass',
  'sbar-prompt':               '📋  SBAR-P Framework',
  'clinical-prompt-templates': '📎  Clinical Prompt Templates',
  'term-of-month':             '📖  AI Term of the Month',
  'ai-case-file':              '🕰️  AI Case File / History',
  'quick-hits':                '⚡  Quick Hits',
  'humor':                     '😄  Humor Break',
  'spacer':                    '↕️  Spacer',
  'footer':                    '🔻  Footer',
  'ai-safety':                 '🛡️  AI Safety Monitor',
  'northwell-spotlight':       '🏥  Northwell AI Spotlight',
  'rss-sidebar':               '📰  RSS Feed Panel',
};

// ─── Default Newsletter ──────────────────────────────────────────────────────

export function makeDefaultNewsletter(): Newsletter {
  const headerId = uuidv4(); const tickerId = uuidv4(); const div1Id = uuidv4();
  const articleId = uuidv4(); const spotlightId = uuidv4(); const div2Id = uuidv4();
  const ethicsId = uuidv4(); const safetyId = uuidv4(); const div3Id = uuidv4();
  const sbarId = uuidv4(); const templatesId = uuidv4(); const termId = uuidv4();
  const div4Id = uuidv4(); const northwellId = uuidv4(); const rssSidebarId = uuidv4();
  const humorId = uuidv4(); const spacerId = uuidv4(); const footerId = uuidv4();

  return {
    meta: {
      id: uuidv4(), title: 'Neurology AI Pulse — Issue 001',
      issueNumber: '001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    theme: THEMES[0],
    blockOrder: [headerId, tickerId, div1Id, articleId, spotlightId, div2Id, ethicsId, safetyId, div3Id, sbarId, templatesId, termId, div4Id, northwellId, rssSidebarId, humorId, spacerId, footerId],
    blocks: {
      [headerId]: { ...BLOCK_DEFAULTS['header'](), id: headerId } as any,
      [tickerId]: { ...BLOCK_DEFAULTS['ticker'](), id: tickerId } as any,
      [div1Id]: { ...BLOCK_DEFAULTS['section-divider'](), id: div1Id, label: 'TOP NEUROLOGY AI NEWS', number: 1 } as any,
      [articleId]: { ...BLOCK_DEFAULTS['article-grid'](), id: articleId } as any,
      [spotlightId]: { ...BLOCK_DEFAULTS['spotlight'](), id: spotlightId } as any,
      [div2Id]: { ...BLOCK_DEFAULTS['section-divider'](), id: div2Id, label: 'AI SAFETY & ETHICS', number: 2 } as any,
      [ethicsId]: { ...BLOCK_DEFAULTS['ethics-split'](), id: ethicsId } as any,
      [safetyId]: { ...BLOCK_DEFAULTS['ai-safety'](), id: safetyId } as any,
      [div3Id]: { ...BLOCK_DEFAULTS['section-divider'](), id: div3Id, label: 'CLINICAL AI SKILLS', number: 3 } as any,
      [sbarId]: { ...BLOCK_DEFAULTS['sbar-prompt'](), id: sbarId } as any,
      [templatesId]: { ...BLOCK_DEFAULTS['clinical-prompt-templates'](), id: templatesId } as any,
      [termId]: { ...BLOCK_DEFAULTS['term-of-month'](), id: termId } as any,
      [div4Id]: { ...BLOCK_DEFAULTS['section-divider'](), id: div4Id, label: 'NORTHWELL & COMMUNITY', number: 4 } as any,
      [northwellId]: { ...BLOCK_DEFAULTS['northwell-spotlight'](), id: northwellId } as any,
      [rssSidebarId]: { ...BLOCK_DEFAULTS['rss-sidebar'](), id: rssSidebarId } as any,
      [humorId]: { ...BLOCK_DEFAULTS['humor'](), id: humorId } as any,
      [spacerId]: { ...BLOCK_DEFAULTS['spacer'](), id: spacerId } as any,
      [footerId]: { ...BLOCK_DEFAULTS['footer'](), id: footerId } as any,
    },
  };
}
