import React from 'react';
import type { Block, Newsletter, Article } from '../../types';
import {
  HeaderBlock, TickerBlock, SectionDividerBlock, ArticleGridBlock, SpotlightBlock,
  EthicsSplitBlock, ImageBlock, TextBlock, HtmlEmbedBlock, PromptMasterclassBlock,
  SbarPromptBlock, PromptTemplateBlock, SafetyRemindersBlock, ClinicalPromptTemplatesBlock, TermOfMonthBlock, AiCaseFileBlock,
  QuickHitsBlock, HumorBlock, SpacerBlock, FooterBlock,
  AiSafetyBlock, NorthwellSpotlightBlock, RssSidebarBlock,
} from './AllBlocks';

interface Props {
  block: Block;
  theme: Newsletter['theme'];
  newsletter: Newsletter;
  editable?: boolean;
  onUpdateBlock: (changes: Partial<Block>) => void;
  onUpdateArticle: (blockId: string, articleId: string, changes: Partial<Article>) => void;
  onDeleteArticle: (blockId: string, articleId: string) => void;
  onMoveArticle: (blockId: string, from: number, to: number) => void;
  onAddArticle: (blockId: string) => void;
}

export function BlockRenderer({ block, theme, newsletter, editable, onUpdateBlock, onUpdateArticle, onDeleteArticle, onMoveArticle, onAddArticle }: Props) {
  const sharedProps = { theme, newsletter, editable, onUpdateBlock };
  const articleProps = {
    onUpdateArticle: (aid: string, c: Partial<Article>) => onUpdateArticle(block.id, aid, c),
    onDeleteArticle: (aid: string) => onDeleteArticle(block.id, aid),
    onMoveArticle: (from: number, to: number) => onMoveArticle(block.id, from, to),
    onAddArticle: () => onAddArticle(block.id),
  };

  switch (block.type) {
    case 'header':                    return <HeaderBlock block={block} {...sharedProps} />;
    case 'ticker':                    return <TickerBlock block={block} {...sharedProps} />;
    case 'section-divider':           return <SectionDividerBlock block={block} {...sharedProps} />;
    case 'article-grid':              return <ArticleGridBlock block={block} {...sharedProps} {...articleProps} />;
    case 'spotlight':                 return <SpotlightBlock block={block} {...sharedProps} {...articleProps} />;
    case 'ethics-split':              return <EthicsSplitBlock block={block} {...sharedProps} />;
    case 'image':                     return <ImageBlock block={block} {...sharedProps} />;
    case 'text':                      return <TextBlock block={block} {...sharedProps} />;
    case 'html-embed':                return <HtmlEmbedBlock block={block} {...sharedProps} />;
    case 'prompt-masterclass':        return <PromptMasterclassBlock block={block} {...sharedProps} />;
    case 'sbar-prompt':               return <SbarPromptBlock block={block} {...sharedProps} />;
    case 'prompt-template':           return <PromptTemplateBlock block={block} {...sharedProps} />;
    case 'safety-reminders':          return <SafetyRemindersBlock block={block} {...sharedProps} />;
    case 'clinical-prompt-templates': return <ClinicalPromptTemplatesBlock block={block} {...sharedProps} />;
    case 'term-of-month':             return <TermOfMonthBlock block={block} {...sharedProps} />;
    case 'ai-case-file':              return <AiCaseFileBlock block={block} {...sharedProps} />;
    case 'quick-hits':                return <QuickHitsBlock block={block} {...sharedProps} />;
    case 'humor':                     return <HumorBlock block={block} {...sharedProps} />;
    case 'spacer':                    return <SpacerBlock block={block} {...sharedProps} />;
    case 'footer':                    return <FooterBlock block={block} {...sharedProps} />;
    case 'ai-safety':                 return <AiSafetyBlock block={block} {...sharedProps} />;
    case 'northwell-spotlight':       return <NorthwellSpotlightBlock block={block} {...sharedProps} />;
    case 'rss-sidebar':               return <RssSidebarBlock block={block} {...sharedProps} />;
    default:
      return <div style={{ padding: 16, fontFamily: 'monospace', fontSize: 12, color: '#999' }}>Unknown block: {(block as any).type}</div>;
  }
}