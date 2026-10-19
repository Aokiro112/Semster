"use client";

import React, { useMemo } from "react";
import katex from "katex";

interface MathRendererProps {
  content: string;
  className?: string;
}

export function MathRenderer({ content, className }: MathRendererProps) {
  const renderedElements = useMemo(() => {
    if (!content) return null;

    // Split text by block math $$...$$ first, then inline math $...$
    const parts: React.ReactNode[] = [];
    const lines = content.split("\n");

    let insideBlockMath = false;
    let blockMathBuffer: string[] = [];

    lines.forEach((line, lineIdx) => {
      const trimmed = line.trim();

      // Check for standalone block math
      if (trimmed.startsWith("$$") && trimmed.endsWith("$$") && trimmed.length > 4) {
        const mathExpr = trimmed.slice(2, -2);
        try {
          const html = katex.renderToString(mathExpr, { displayMode: true, throwOnError: false });
          parts.push(
            <div
              key={`block-${lineIdx}`}
              className="my-3 overflow-x-auto py-1"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
          return;
        } catch {
          parts.push(<pre key={`err-${lineIdx}`}>{line}</pre>);
          return;
        }
      }

      // Check for Markdown headers (###, ##, #)
      if (trimmed.startsWith("### ")) {
        parts.push(
          <h3 key={`h3-${lineIdx}`} className="text-sm font-bold text-foreground mt-4 mb-2">
            {trimmed.slice(4)}
          </h3>
        );
        return;
      }
      if (trimmed.startsWith("## ")) {
        parts.push(
          <h2 key={`h2-${lineIdx}`} className="text-base font-bold text-foreground mt-5 mb-2">
            {trimmed.slice(3)}
          </h2>
        );
        return;
      }
      if (trimmed.startsWith("# ")) {
        parts.push(
          <h1 key={`h1-${lineIdx}`} className="text-lg font-bold text-foreground mt-6 mb-3">
            {trimmed.slice(2)}
          </h1>
        );
        return;
      }

      // Process inline math $...$ within paragraph
      if (line.includes("$")) {
        const segments = line.split(/(\$[^\$]+\$)/g);
        const lineParts = segments.map((seg, sIdx) => {
          if (seg.startsWith("$") && seg.endsWith("$") && seg.length > 2) {
            const math = seg.slice(1, -1);
            try {
              const html = katex.renderToString(math, { displayMode: false, throwOnError: false });
              return (
                <span
                  key={`inline-${lineIdx}-${sIdx}`}
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              );
            } catch {
              return <span key={`inline-err-${lineIdx}-${sIdx}`}>{seg}</span>;
            }
          }
          return <span key={`text-${lineIdx}-${sIdx}`}>{seg}</span>;
        });

        parts.push(
          <p key={`p-${lineIdx}`} className="my-1.5 leading-relaxed text-xs text-foreground">
            {lineParts}
          </p>
        );
        return;
      }

      // Regular line
      if (line.trim() === "") {
        parts.push(<div key={`empty-${lineIdx}`} className="h-2" />);
      } else {
        parts.push(
          <p key={`p-${lineIdx}`} className="my-1 leading-relaxed text-xs text-foreground">
            {line}
          </p>
        );
      }
    });

    return parts;
  }, [content]);

  return <div className={className}>{renderedElements}</div>;
}
