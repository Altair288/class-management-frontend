'use client';
import * as React from 'react';
import { CacheProvider } from '@emotion/react';
import { createEmotionCache } from './createEmotionCache';

// 单例 client cache，防止每次渲染新建导致 style 标签顺序变化
const clientSideEmotionCache = createEmotionCache();

export default function EmotionCacheProvider({ children }: { children: React.ReactNode }) {
  return <CacheProvider value={clientSideEmotionCache}>{children}</CacheProvider>;
}
