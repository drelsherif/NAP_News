import { useReducer, useCallback } from 'react';
import { produce } from 'immer';
import { v4 as uuidv4 } from 'uuid';
import type { Newsletter, Block, BlockType, ThemePreset, Article, QuickHit } from '../types';
import { BLOCK_DEFAULTS, makeDefaultNewsletter } from '../data/defaults';

// ─── Actions ─────────────────────────────────────────────────────────────────

type Action =
  | { type: 'LOAD'; payload: Newsletter }
  | { type: 'ADD_BLOCK'; payload: { blockType: BlockType; afterId?: string } }
  | { type: 'DELETE_BLOCK'; payload: { id: string } }
  | { type: 'UPDATE_BLOCK'; payload: { id: string; changes: Partial<Block> } }
  | { type: 'MOVE_BLOCK'; payload: { from: number; to: number } }
  | { type: 'DUPLICATE_BLOCK'; payload: { id: string } }
  | { type: 'UPDATE_THEME'; payload: ThemePreset }
  | { type: 'UPDATE_META'; payload: Partial<Newsletter['meta']> }
  // Article grid helpers
  | { type: 'ADD_ARTICLE'; payload: { blockId: string } }
  | { type: 'UPDATE_ARTICLE'; payload: { blockId: string; articleId: string; changes: Partial<Article> } }
  | { type: 'DELETE_ARTICLE'; payload: { blockId: string; articleId: string } }
  | { type: 'MOVE_ARTICLE'; payload: { blockId: string; from: number; to: number } }
  // Quick hits helpers
  | { type: 'ADD_QUICK_HIT'; payload: { blockId: string } }
  | { type: 'UPDATE_QUICK_HIT'; payload: { blockId: string; hitId: string; changes: Partial<QuickHit> } }
  | { type: 'DELETE_QUICK_HIT'; payload: { blockId: string; hitId: string } };

// ─── Reducer ─────────────────────────────────────────────────────────────────

function reducer(state: Newsletter, action: Action): Newsletter {
  return produce(state, draft => {
    switch (action.type) {
      case 'LOAD':
        return action.payload;

      case 'ADD_BLOCK': {
        const block = { ...BLOCK_DEFAULTS[action.payload.blockType](), id: uuidv4() } as Block;
        draft.blocks[block.id] = block;
        if (action.payload.afterId) {
          const idx = draft.blockOrder.indexOf(action.payload.afterId);
          draft.blockOrder.splice(idx + 1, 0, block.id);
        } else {
          draft.blockOrder.push(block.id);
        }
        break;
      }

      case 'DELETE_BLOCK': {
        const idx = draft.blockOrder.indexOf(action.payload.id);
        if (idx > -1) draft.blockOrder.splice(idx, 1);
        delete draft.blocks[action.payload.id];
        break;
      }

      case 'UPDATE_BLOCK': {
        const existing = draft.blocks[action.payload.id];
        if (existing) Object.assign(existing, action.payload.changes);
        break;
      }

      case 'MOVE_BLOCK': {
        const { from, to } = action.payload;
        const [item] = draft.blockOrder.splice(from, 1);
        draft.blockOrder.splice(to, 0, item);
        break;
      }

      case 'DUPLICATE_BLOCK': {
        const original = draft.blocks[action.payload.id];
        if (!original) break;
        const clone = JSON.parse(JSON.stringify(original));
        clone.id = uuidv4();
        draft.blocks[clone.id] = clone;
        const idx = draft.blockOrder.indexOf(action.payload.id);
        draft.blockOrder.splice(idx + 1, 0, clone.id);
        break;
      }

      case 'UPDATE_THEME':
        draft.theme = action.payload;
        break;

      case 'UPDATE_META':
        Object.assign(draft.meta, action.payload);
        break;

      case 'ADD_ARTICLE': {
        const block = draft.blocks[action.payload.blockId] as any;
        if (block?.articles) {
          block.articles.push({
            id: uuidv4(), title: 'New Article', source: '', url: '', imageUrl: '',
            pubDate: '', summary: '', clinicalContext: '', myTake: '',
            evidenceLevel: '', tags: [],
          });
        }
        if (block?.article === undefined && block?.type === 'spotlight') {
          // spotlight has single article
        }
        break;
      }

      case 'UPDATE_ARTICLE': {
        const block = draft.blocks[action.payload.blockId] as any;
        if (block?.articles) {
          const art = block.articles.find((a: Article) => a.id === action.payload.articleId);
          if (art) Object.assign(art, action.payload.changes);
        } else if (block?.article && action.payload.articleId === block.article.id) {
          Object.assign(block.article, action.payload.changes);
        }
        break;
      }

      case 'DELETE_ARTICLE': {
        const block = draft.blocks[action.payload.blockId] as any;
        if (block?.articles) {
          block.articles = block.articles.filter((a: Article) => a.id !== action.payload.articleId);
        }
        break;
      }

      case 'MOVE_ARTICLE': {
        const block = draft.blocks[action.payload.blockId] as any;
        if (block?.articles) {
          const [item] = block.articles.splice(action.payload.from, 1);
          block.articles.splice(action.payload.to, 0, item);
        }
        break;
      }

      case 'ADD_QUICK_HIT': {
        const block = draft.blocks[action.payload.blockId] as any;
        if (block?.hits) {
          block.hits.push({ id: uuidv4(), title: 'New hit', url: '', source: '', summary: '' });
        }
        break;
      }

      case 'UPDATE_QUICK_HIT': {
        const block = draft.blocks[action.payload.blockId] as any;
        if (block?.hits) {
          const hit = block.hits.find((h: QuickHit) => h.id === action.payload.hitId);
          if (hit) Object.assign(hit, action.payload.changes);
        }
        break;
      }

      case 'DELETE_QUICK_HIT': {
        const block = draft.blocks[action.payload.blockId] as any;
        if (block?.hits) {
          block.hits = block.hits.filter((h: QuickHit) => h.id !== action.payload.hitId);
        }
        break;
      }
    }
    draft.meta.updatedAt = new Date().toISOString();
  });
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useNewsletter(initial?: Newsletter) {
  const [newsletter, dispatch] = useReducer(reducer, initial ?? makeDefaultNewsletter());

  const load = useCallback((nl: Newsletter) => dispatch({ type: 'LOAD', payload: nl }), []);
  const addBlock = useCallback((blockType: BlockType, afterId?: string) =>
    dispatch({ type: 'ADD_BLOCK', payload: { blockType, afterId } }), []);
  const deleteBlock = useCallback((id: string) =>
    dispatch({ type: 'DELETE_BLOCK', payload: { id } }), []);
  const updateBlock = useCallback((id: string, changes: Partial<Block>) =>
    dispatch({ type: 'UPDATE_BLOCK', payload: { id, changes } }), []);
  const moveBlock = useCallback((from: number, to: number) =>
    dispatch({ type: 'MOVE_BLOCK', payload: { from, to } }), []);
  const duplicateBlock = useCallback((id: string) =>
    dispatch({ type: 'DUPLICATE_BLOCK', payload: { id } }), []);
  const updateTheme = useCallback((theme: ThemePreset) =>
    dispatch({ type: 'UPDATE_THEME', payload: theme }), []);
  const updateMeta = useCallback((changes: Partial<Newsletter['meta']>) =>
    dispatch({ type: 'UPDATE_META', payload: changes }), []);

  const addArticle = useCallback((blockId: string) =>
    dispatch({ type: 'ADD_ARTICLE', payload: { blockId } }), []);
  const updateArticle = useCallback((blockId: string, articleId: string, changes: Partial<Article>) =>
    dispatch({ type: 'UPDATE_ARTICLE', payload: { blockId, articleId, changes } }), []);
  const deleteArticle = useCallback((blockId: string, articleId: string) =>
    dispatch({ type: 'DELETE_ARTICLE', payload: { blockId, articleId } }), []);
  const moveArticle = useCallback((blockId: string, from: number, to: number) =>
    dispatch({ type: 'MOVE_ARTICLE', payload: { blockId, from, to } }), []);

  const addQuickHit = useCallback((blockId: string) =>
    dispatch({ type: 'ADD_QUICK_HIT', payload: { blockId } }), []);
  const updateQuickHit = useCallback((blockId: string, hitId: string, changes: Partial<QuickHit>) =>
    dispatch({ type: 'UPDATE_QUICK_HIT', payload: { blockId, hitId, changes } }), []);
  const deleteQuickHit = useCallback((blockId: string, hitId: string) =>
    dispatch({ type: 'DELETE_QUICK_HIT', payload: { blockId, hitId } }), []);

  return {
    newsletter,
    load, addBlock, deleteBlock, updateBlock, moveBlock, duplicateBlock,
    updateTheme, updateMeta,
    addArticle, updateArticle, deleteArticle, moveArticle,
    addQuickHit, updateQuickHit, deleteQuickHit,
  };
}
