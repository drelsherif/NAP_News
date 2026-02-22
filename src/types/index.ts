// ─── Block Types ────────────────────────────────────────────────────────────

export type BlockType =
  | 'header'
  | 'ticker'
  | 'section-divider'
  | 'article-grid'
  | 'spotlight'
  | 'ethics-split'
  | 'image'
  | 'text'
  | 'html-embed'
  | 'prompt-masterclass'
  | 'sbar-prompt'
  | 'prompt-template'
  | 'safety-reminders'
  | 'clinical-prompt-templates'
  | 'term-of-month'
  | 'ai-case-file'
  | 'quick-hits'
  | 'humor'
  | 'spacer'
  | 'footer'
  | 'ai-safety'
  | 'northwell-spotlight'
  | 'rss-sidebar';

// ─── Article (shared sub-type) ───────────────────────────────────────────────

export interface Article {
  id: string;
  title: string;
  source: string;
  url: string;
  imageUrl: string;
  pubDate: string;
  summary: string;
  clinicalContext: string;
  myTake: string;
  evidenceLevel: 'High' | 'Moderate' | 'Low' | 'Expert Opinion' | '';
  tags: string[];
}

// ─── Block Data Interfaces ───────────────────────────────────────────────────

export interface HeaderBlock {
  id: string; type: 'header';
  title: string;
  subtitle: string;
  issueNumber: string;
  issueDate: string;
  tagline: string;
  logoUrl: string;
  logoDataUrl: string;
  backgroundStyle: 'gradient' | 'solid' | 'mesh' | 'wave';
  accentColor: string;
}

export interface TickerLink {
  text: string;
  url: string;
}

export interface TickerBlock {
  id: string; type: 'ticker';
  /** Content source for the ticker */
  sourceMode: 'manual' | 'rss';
  items: string[];
  links: TickerLink[];
  useLinks: boolean;
  /** When sourceMode==='rss', fetch titles from these RSS URLs */
  rssUrls: string[];
  /** Max RSS items to show (before duplication for loop) */
  rssMaxItems: number;
  speed: 'slow' | 'medium' | 'fast';
  backgroundColor: string;
  textColor: string;
}

export interface SectionDividerBlock {
  id: string; type: 'section-divider';
  label: string;
  style: 'gradient' | 'line' | 'bold' | 'numbered';
  number: number;
  description: string;
}

export interface ArticleGridBlock {
  id: string; type: 'article-grid';
  sectionTitle: string;
  columns: 1 | 2 | 3;
  layout: 'card' | 'editorial' | 'compact';
  articles: Article[];
}

export interface SpotlightBlock {
  id: string; type: 'spotlight';
  article: Article;
  accentColor: string;
  layout: 'left-image' | 'right-image' | 'top-image' | 'no-image';
}

export interface EthicsSplitBlock {
  id: string; type: 'ethics-split';
  heading: string;
  subheading: string;
  leftTitle: string;
  leftContent: string;
  rightTitle: string;
  rightContent: string;
  clinicalPerspective: string;
  url: string;
  source: string;
}

export interface ImageBlock {
  id: string; type: 'image';
  url: string;
  dataUrl: string;
  alt: string;
  caption: string;
  linkUrl: string;
  width: 'full' | 'wide' | 'medium' | 'small';
  alignment: 'left' | 'center' | 'right';
  borderRadius: number;
}

export interface TextBlock {
  id: string; type: 'text';
  html: string;
  alignment: 'left' | 'center' | 'right';
  maxWidth: 'full' | 'reading' | 'narrow';
}

export interface HtmlEmbedBlock {
  id: string; type: 'html-embed';
  html: string;
  label: string;
}

export interface PromptMasterclassBlock {
  id: string; type: 'prompt-masterclass';
  heading: string;
  step: string;
  framework: string;
  badPrompt: string;
  goodPrompt: string;
  explanation: string;
}

export interface SbarStep {
  letter: string;
  name: string;
  description: string;
  example: string;
}

export interface SbarPromptBlock {
  id: string; type: 'sbar-prompt';
  heading: string;
  steps: SbarStep[];
  templatePrompt: string;
  safetyTips: string[];
}

export interface PromptTemplateBlock {
  id: string; type: 'prompt-template';
  heading: string;
  /** Plain text prompt content. Rendered as a mono <pre> and can be copied. */
  prompt: string;
}

export interface SafetyRemindersBlock {
  id: string; type: 'safety-reminders';
  heading: string;
  /** 1–n reminder bullets (defaults seeded from standard options) */
  items: string[];
}

export interface TermOfMonthBlock {
  id: string; type: 'term-of-month';
  term: string;
  definition: string;
  relevance: string;
  neurologyApplication: string;
  relatedTerms: string[];
}

export interface AiCaseFileBlock {
  id: string; type: 'ai-case-file';
  year: string;
  title: string;
  content: string;
  significance: string;
  imageUrl: string;
  imageDataUrl: string;
  sourceUrl: string;
  sourceLabel: string;
}

export interface QuickHit {
  id: string;
  title: string;
  url: string;
  source: string;
  summary: string;
}

export interface QuickHitsBlock {
  id: string; type: 'quick-hits';
  heading: string;
  hits: QuickHit[];
}

export interface HumorBlock {
  id: string; type: 'humor';
  heading: string;
  content: string;
  attribution: string;
  emojiDecor: string;
  imageUrl: string;
  imageDataUrl: string;
  sourceUrl: string;
  imageHeight?: number;
  imageFit?: 'cover' | 'contain' | 'fill';
}

export interface SpacerBlock {
  id: string; type: 'spacer';
  height: number;
  showLine: boolean;
  lineStyle: 'solid' | 'dashed' | 'dotted';
}

export interface FooterSocial {
  platform: string;
  url: string;
  icon: string;
}

export interface FooterBlock {
  id: string; type: 'footer';
  institution: string;
  department: string;
  editors: string;
  unsubscribeUrl: string;
  subscribeUrl: string;
  websiteUrl: string;
  contactEmail: string;
  copyrightYear: string;
  disclaimer: string;
  socials: FooterSocial[];
  showSocials: boolean;
  nextIssueDate: string;
  nextIssueTeaser: string;
}

// ─── Clinical Prompt Templates ───────────────────────────────────────────────

export interface ClinicalPrompt {
  id: string;
  category: string;
  title: string;
  prompt: string;
  useCase: string;
}

export interface ClinicalPromptTemplatesBlock {
  id: string; type: 'clinical-prompt-templates';
  heading: string;
  description: string;
  templates: ClinicalPrompt[];
}

// ─── AI Safety Block ─────────────────────────────────────────────────────────

export interface SafetyUpdate {
  id: string;
  date: string;
  category: 'FDA' | 'Policy' | 'Incident' | 'Guideline' | 'Alert' | 'Research';
  title: string;
  summary: string;
  url: string;
  severity: 'critical' | 'high' | 'medium' | 'informational';
}

export interface AiSafetyBlock {
  id: string; type: 'ai-safety';
  heading: string;
  subheading: string;
  updates: SafetyUpdate[];
  showLastUpdated: boolean;
}

// ─── Northwell Spotlight Block ────────────────────────────────────────────────

export interface NorthwellItem {
  id: string;
  title: string;
  url: string;
  pubDate: string;
  summary: string;
  imageUrl: string;
  category: string;
}

export interface NorthwellSpotlightBlock {
  id: string; type: 'northwell-spotlight';
  heading: string;
  subheading: string;
  items: NorthwellItem[];
  autoFetch: boolean;
  lastFetched: string;
  maxItems: number;
}

// ─── RSS Sidebar Panel Block ──────────────────────────────────────────────────

export interface RssSidebarBlock {
  id: string; type: 'rss-sidebar';
  heading: string;
  feedUrls: string[];
  items: { title: string; url: string; source: string; pubDate: string }[];
  maxItems: number;
  lastFetched: string;
  position: 'inline' | 'sidebar-right';
  refreshOnView: boolean;
  /** If true, render a fixed-height scroll area. If false, expand to show all items (better for export). */
  enableScroll?: boolean;
}

// Block Union extended
export type Block =
  | HeaderBlock
  | TickerBlock
  | SectionDividerBlock
  | ArticleGridBlock
  | SpotlightBlock
  | EthicsSplitBlock
  | ImageBlock
  | TextBlock
  | HtmlEmbedBlock
  | PromptMasterclassBlock
  | SbarPromptBlock
  | PromptTemplateBlock
  | SafetyRemindersBlock
  | ClinicalPromptTemplatesBlock
  | TermOfMonthBlock
  | AiCaseFileBlock
  | QuickHitsBlock
  | HumorBlock
  | SpacerBlock
  | FooterBlock
  | AiSafetyBlock
  | NorthwellSpotlightBlock
  | RssSidebarBlock;

// ─── Newsletter / State ──────────────────────────────────────────────────────

export interface NewsletterMeta {
  id: string;
  title: string;
  issueNumber: string;
  createdAt: string;
  updatedAt: string;
}

export interface ThemePreset {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  border: string;
  text: string;
  muted: string;
  fontDisplay: string;
  fontBody: string;
  fontMono: string;
}

export interface Newsletter {
  meta: NewsletterMeta;
  theme: ThemePreset;
  blockOrder: string[];
  blocks: Record<string, Block>;
}

export interface SaveVersion {
  id: string;
  label: string;
  createdAt: string;
  newsletter: Newsletter;
}

// ─── Editor State ────────────────────────────────────────────────────────────

export type SidebarPanel = 'blocks' | 'settings' | 'rss' | 'theme' | 'export';

export interface EditorState {
  selectedBlockId: string | null;
  activePanel: SidebarPanel;
  previewMode: boolean;
  zoom: number;
}

// ─── RSS ─────────────────────────────────────────────────────────────────────

export interface RssFeedConfig {
  url: string;
  label: string;
  enabled: boolean;
}

export interface RssItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  description: string;
  imageUrl: string;
}
