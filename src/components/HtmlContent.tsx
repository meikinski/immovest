'use client';

import React, { useEffect, useState } from 'react';
import createDOMPurify from 'dompurify';

interface HtmlContentProps {
  html: string;
  className?: string;
}

export default function HtmlContent({ html, className }: HtmlContentProps) {
  const [sanitized, setSanitized] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const DOMPurify = createDOMPurify(window);
      const cleaned = DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });

      const transformed = cleaned
        .replace(/<div>/gi, '<p>')
        .replace(/<\/div>/gi, '</p>')
        .replace(/<br\s*\/?>(?!<\/p>)/gi, '</p><p>');

      setSanitized(transformed);
    }
  }, [html]);

  return (
    <div
      className={`${className} [&>p]:mb-4 [&>p:last-child]:mb-0`}
      dangerouslySetInnerHTML={{ __html: sanitized || '<p>–</p>' }}
    />
  );
}
