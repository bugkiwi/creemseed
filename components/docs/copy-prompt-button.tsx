'use client';

import { useState } from 'react';

export function CopyPromptButton({
  prompt,
  language,
}: {
  prompt: string;
  language: 'en' | 'zh-CN';
}) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const chinese = language === 'zh-CN';

  async function copy() {
    try {
      await navigator.clipboard.writeText(prompt);
      setStatus('copied');
      window.setTimeout(() => setStatus('idle'), 1800);
    } catch {
      setStatus('error');
    }
  }

  return (
    <button className="docs-copy-prompt" type="button" onClick={copy}>
      {status === 'copied'
        ? chinese
          ? '已复制'
          : 'Copied'
        : status === 'error'
          ? chinese
            ? '复制失败，请选中 Prompt 手动复制'
            : 'Copy failed; select the prompt to copy it'
          : chinese
            ? '复制完整 Prompt'
            : 'Copy full prompt'}
      <span className="sr-only" aria-live="polite">
        {status === 'copied'
          ? chinese
            ? 'Prompt 已复制到剪贴板'
            : 'Prompt copied to clipboard'
          : status === 'error'
            ? chinese
              ? '复制失败，请选中 Prompt 手动复制'
              : 'Copy failed; select the prompt to copy it'
            : ''}
      </span>
    </button>
  );
}
