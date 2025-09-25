import createCache from '@emotion/cache';

// 与 MUI 官方示例一致: prepend true 以确保 MUI 样式优先并保持与服务端一致顺序
export function createEmotionCache() {
  return createCache({ key: 'css', prepend: true });
}
