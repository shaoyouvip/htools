import { ArrowUpRight, Check, ChevronDown, ChevronUp, Copy } from "lucide-react";
import type { Nodes as HtmlNodes, Root as HtmlRoot } from "hast";
import type { Nodes } from "mdast";
import { useEffect, useMemo, useRef, useState } from "react";
import type { HTMLAttributes, ImgHTMLAttributes } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified, type PluggableList } from "unified";
import { getArticleDisplaySummary } from "../article-helpers";
import { DEFAULT_PROXY_MODE, DEFAULT_PROXY_SCOPE, proxifyUrl } from "../proxy";
import { useToast } from "../toast-context";
import type { ProxySettings } from "../types";
import { translations, type Locale } from "../i18n";

const markdownSanitizeSchema = {
  ...defaultSchema,
  strip: [...(defaultSchema.strip ?? []), "style"],
  attributes: {
    ...defaultSchema.attributes,
    a: [
      ...(defaultSchema.attributes?.a ?? []),
      ["target"],
      ["rel"]
    ],
    code: [
      ...(defaultSchema.attributes?.code ?? []),
      ["className"]
    ]
  }
};

const originalLinkHeadingPattern = "(?:原文链接|Original Link|鍘熸枃閾炬帴)";
const collapsibleCodeLineThreshold = 6;
const markdownParser = unified().use(remarkParse).use(remarkGfm);
const markdownRemarkPlugins: PluggableList = [remarkGfm, remarkBreaks];
const markdownRehypePlugins: PluggableList = [rehypeRaw, [rehypeSanitize, markdownSanitizeSchema]];

const defaultProxySettings: ProxySettings = {
  enabled: false,
  baseUrl: "",
  mode: DEFAULT_PROXY_MODE,
  scope: DEFAULT_PROXY_SCOPE
};

function getArticleSummaryText(node: HtmlNodes): string {
  if (node.type === "text") {
    return node.value;
  }
  if (node.type === "element" &&
      (node.properties.dataFootnoteRef !== undefined || node.properties.dataFootnotes !== undefined)) {
    return "";
  }
  if ("children" in node) {
    const text = node.children.map(getArticleSummaryText).join("");
    const block = node.type === "element" &&
      /^(?:p|div|blockquote|h[1-6]|li|tr|td|th|pre|dl|dt|dd|section|summary|br|hr)$/.test(node.tagName);
    return block ? `\n${text}\n` : text;
  }
  return "";
}

function rehypeArticleSummary({ summary, trailingText }: { summary: string; trailingText: string }) {
  return (tree: HtmlRoot) => {
    // 只读取与正文相同流程净化后的文字，不再清理 HTML 或代码字面量。
    const displaySummary = getArticleDisplaySummary(summary, `${getArticleSummaryText(tree)}\n${trailingText}`);
    tree.children = displaySummary ? [{
      type: "element",
      tagName: "p",
      properties: {},
      children: [{ type: "text", value: displaySummary }]
    }] : [];
  };
}

export function ArticleSummary({ content, summary }: { content: string; summary: string }) {
  const { body, linkSections, originalLink } = useMemo(() => prepareMarkdownContent(content), [content]);
  const trailingText = [
    ...linkSections.flatMap((section) => [section.title, ...section.links.map((link) => link.label)]),
    ...(originalLink ? [originalLink.title, originalLink.label] : [])
  ].join("\n");

  return (
    <ReactMarkdown
      remarkPlugins={markdownRemarkPlugins}
      rehypePlugins={[...markdownRehypePlugins, [rehypeArticleSummary, { summary, trailingText }]]}
    >
      {body}
    </ReactMarkdown>
  );
}

function prepareMarkdownContent(content: string) {
  const protectedCode = protectMarkdownCode(content.replace(/\r\n?/g, "\n"));
  const extractedOriginalLink = extractOriginalMarkdownLink(protectedCode.body, protectedCode.marker);
  const extractedLinkSections = extractMarkdownLinkSections(
    extractedOriginalLink.body,
    protectedCode.marker
  );

  return {
    body: protectedCode.restore(extractedLinkSections.body),
    linkSections: extractedLinkSections.linkSections.map((section) => ({
      ...section,
      title: protectedCode.restore(section.title),
      links: section.links.map((link) => ({
        ...link,
        label: protectedCode.restore(link.label)
      }))
    })),
    originalLink: extractedOriginalLink.originalLink
      ? {
          ...extractedOriginalLink.originalLink,
          label: protectedCode.restore(extractedOriginalLink.originalLink.label)
        }
      : null
  };
}

export default function MarkdownContent({
  content,
  locale,
  proxySettings = defaultProxySettings
}: {
  content: string;
  locale?: Locale;
  proxySettings?: ProxySettings;
}) {
  const { body, linkSections, originalLink } = useMemo(
    () => prepareMarkdownContent(content),
    [content]
  );
  // 保持正文组件身份，避免全局提示更新时丢失展开状态、焦点和选区。
  const components = useMemo<Components>(() => ({
    a({ href, children, ...props }) {
      const safeHref = sanitizeMarkdownHref(href);

      if (!safeHref || isSearchTagHref(safeHref)) {
        return <>{children}</>;
      }

      const isLocalAnchor = safeHref.startsWith("#");

      return (
        <a
          {...props}
          href={isLocalAnchor ? safeHref : proxifyUrl(safeHref, proxySettings)}
          rel={isLocalAnchor ? undefined : "noreferrer"}
          target={isLocalAnchor ? undefined : "_blank"}
        >
          {children}
        </a>
      );
    },
    img({ alt, src, title, node: _node, ...props }) {
      return (
        <MarkdownImage
          {...props}
          alt={alt ?? ""}
          proxySettings={proxySettings}
          src={src}
          title={title}
        />
      );
    },
    table({ children, node: _node, ...props }) {
      return (
        <div className="markdown-table-wrap">
          <table {...props}>{children}</table>
        </div>
      );
    },
    pre({ children }) {
      return <>{children}</>;
    },
    code({ className, children, node: _node, ...props }) {
      const code = String(children).replace(/\n$/, "");
      const isBlock = Boolean(className) || code.includes("\n");

      if (!isBlock) {
        return (
          <code className={className} {...props}>
            {children}
          </code>
        );
      }

      return (
        <MarkdownCodeBlock
          className={className}
          code={code}
          codeProps={props}
          locale={locale}
        />
      );
    }
  }), [locale, proxySettings]);

  return (
    <div className="markdown-content">
      {body ? (
        <ReactMarkdown
          remarkPlugins={markdownRemarkPlugins}
          rehypePlugins={markdownRehypePlugins}
          components={components}
        >
          {body}
        </ReactMarkdown>
      ) : null}

      {linkSections.map((section) => (
        <section className="about-section product-links-section" key={section.title}>
          <h2>{section.title}</h2>
          <div className="product-links-grid">
            {section.links.map((link) => (
              <a
                className="product-link-card"
                href={proxifyUrl(link.href, proxySettings)}
                key={`${section.title}-${link.label}-${link.href}`}
                rel="noreferrer"
                target="_blank"
              >
                <span>{link.label}</span>
                <ArrowUpRight size={17} />
              </a>
            ))}
          </div>
        </section>
      ))}

      {originalLink ? (
        <section className="about-section product-links-section markdown-original-link-section">
          <h2>{originalLink.title}</h2>
          <a
            className="product-link-card markdown-original-link-card"
            href={proxifyUrl(originalLink.href, proxySettings)}
            rel="noreferrer"
            target="_blank"
          >
            <span>{originalLink.label}</span>
            <ArrowUpRight size={17} />
          </a>
        </section>
      ) : null}
    </div>
  );
}

function MarkdownCodeBlock({
  className,
  code,
  codeProps,
  locale
}: {
  className?: string;
  code: string;
  codeProps: HTMLAttributes<HTMLElement>;
  locale?: Locale;
}) {
  const lines = useMemo(() => code.split("\n"), [code]);
  const shouldCollapse = lines.length > collapsibleCodeLineThreshold;
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyRequestRef = useRef(0);
  const notify = useToast();
  const labels = getMarkdownCodeBlockLabels(locale);
  const languageLabel = getCodeLanguageLabel(className, code);

  useEffect(() => {
    setExpanded(false);
    setCopied(false);
    return () => { copyRequestRef.current += 1; };
  }, [code]);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timer = window.setTimeout(() => setCopied(false), 1600);

    return () => window.clearTimeout(timer);
  }, [copied]);

  async function handleCopy() {
    const requestId = ++copyRequestRef.current;
    setCopied(false);
    try {
      await copyTextToClipboard(code);
      if (requestId !== copyRequestRef.current) return;
      setCopied(true);
    } catch {
      if (requestId !== copyRequestRef.current) return;
      notify?.({ tone: "error", message: labels.copyFailed });
    }
  }

  return (
    <div
      className={`markdown-code-block ${
        shouldCollapse && !expanded ? "is-collapsed" : ""
      }`.trim()}
    >
      <div className="markdown-code-toolbar">
        <div className="markdown-code-meta">
          {languageLabel ? (
            <span className="markdown-code-language">{languageLabel}</span>
          ) : null}
          <span>{labels.lineCount(lines.length)}</span>
        </div>
        <div className="markdown-code-actions">
          <button
            type="button"
            className="markdown-code-action"
            onClick={handleCopy}
          >
            {copied ? labels.copied : labels.copy(languageLabel)}
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
          {shouldCollapse ? (
            <button
              type="button"
              className="markdown-code-action"
              aria-expanded={expanded}
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded ? labels.collapse : labels.expand}
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          ) : null}
        </div>
      </div>
      <pre>
        <code className={className} {...codeProps}>
          {lines.map((line, index) => (
            <span className="markdown-code-line" key={`${index}-${line}`}>
              <span className="markdown-code-line-number" aria-hidden="true">
                {index + 1}
              </span>
              <span className="markdown-code-line-content">{line || " "}</span>
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}

function getMarkdownCodeBlockLabels(locale?: Locale) {
  const language = locale ??
    (typeof document === "undefined"
      ? "zh"
      : document.documentElement.lang || navigator.language || "zh");
  const isChinese = language === "zh" || language.toLowerCase().startsWith("zh");

  return isChinese
    ? {
        expand: "展开代码",
        collapse: "收起代码",
        copy: (languageLabel: string) =>
          languageLabel ? `复制 ${languageLabel}` : "复制代码",
        copied: "已复制",
        copyFailed: translations.zh.markdownCode.copyFailed,
        lineCount: (count: number) => `${count} 行`
      }
    : {
        expand: "Expand code",
        collapse: "Collapse code",
        copy: (languageLabel: string) =>
          languageLabel ? `Copy ${languageLabel}` : "Copy code",
        copied: "Copied",
        copyFailed: translations.en.markdownCode.copyFailed,
        lineCount: (count: number) => `${count} lines`
      };
}

function getCodeLanguageLabel(className: string | undefined, code: string) {
  const rawLanguage =
    className?.match(/(?:^|\s)language-([^\s]+)/i)?.[1] || guessCodeLanguage(code);
  const language = rawLanguage.trim().toLowerCase();

  if (!language) {
    return "";
  }

  const languageLabels: Record<string, string> = {
    js: "JS",
    javascript: "JS",
    jsx: "JSX",
    ts: "TS",
    typescript: "TS",
    tsx: "TSX",
    html: "HTML",
    css: "CSS",
    json: "JSON",
    bash: "Bash",
    shell: "Shell",
    sh: "Shell",
    powershell: "PowerShell",
    ps1: "PowerShell"
  };

  return languageLabels[language] ?? language.toUpperCase();
}

async function copyTextToClipboard(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const inputSelection = activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement
    ? { start: activeElement.selectionStart, end: activeElement.selectionEnd, direction: activeElement.selectionDirection }
    : null;
  const selection = document.getSelection();
  const ranges = selection
    ? Array.from({ length: selection.rangeCount }, (_, index) => selection.getRangeAt(index).cloneRange())
    : [];
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";

  try {
    document.body.appendChild(textarea);
    textarea.focus({ preventScroll: true });
    textarea.select();
    if (!document.execCommand("copy")) {
      throw new Error("Copy failed");
    }
  } finally {
    textarea.remove();
    activeElement?.focus({ preventScroll: true });
    if (selection) {
      selection.removeAllRanges();
      ranges.forEach((range) => selection.addRange(range));
    }
    if (
      inputSelection && inputSelection.start !== null && inputSelection.end !== null &&
      (activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement)
    ) {
      activeElement.setSelectionRange(inputSelection.start, inputSelection.end, inputSelection.direction ?? undefined);
    }
  }
}

function MarkdownImage({
  alt,
  proxySettings,
  src,
  title,
  ...props
}: ImgHTMLAttributes<HTMLImageElement> & { proxySettings: ProxySettings }) {
  const safeSrc = sanitizeMarkdownImageSrc(src);
  const proxiedSrc = safeSrc
    ? proxifyUrl(safeSrc, proxySettings, { resourceType: "image" })
    : "";
  const rawCaption = typeof alt === "string" ? alt.trim() : "";
  const caption = isMeaningfulImageCaption(rawCaption) ? rawCaption : "";
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [proxiedSrc]);

  if (!proxiedSrc || failed) {
    return null;
  }

  return (
    <figure className="markdown-image-frame">
      <img
        {...props}
        alt={caption}
        src={proxiedSrc}
        title={title}
        loading="lazy"
        decoding="async"
        onError={(event) => {
          event.currentTarget.style.display = "none";
          setFailed(true);
        }}
      />
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}

function protectMarkdownCode(content: string) {
  // 使用与渲染相同的解析器定位代码，兼容引用、列表、表格和未闭合围栏。
  let marker: string;
  do {
    marker = `\uE000${crypto.getRandomValues(new Uint32Array(4)).join("-")}\uE001`;
  } while (content.includes(marker));

  const code: string[] = [];
  const parts: string[] = [];
  let cursor = 0;

  function visit(node: Nodes) {
    const start = node.position?.start.offset;
    const end = node.position?.end.offset;
    if ((node.type === "code" || node.type === "inlineCode") && start !== undefined && end !== undefined) {
      const source = content.slice(start, end);
      parts.push(content.slice(cursor, start), `${marker}${code.length}${"\n".repeat(source.split("\n").length - 1)}${marker}`);
      code.push(source);
      cursor = end;
    } else if ("children" in node) {
      node.children.forEach(visit);
    }
  }

  visit(markdownParser.parse(content));
  parts.push(content.slice(cursor));

  return {
    body: parts.join(""),
    marker,
    restore: (value: string) => value.replace(
      new RegExp(`${marker}(\\d+)[ \\t\\n]*${marker}`, "g"),
      (_, index: string) => code[Number(index)]
    )
  };
}

function normalizeMarkdownContent(content: string, codeMarker: string) {
  const removeOutsideCode = (match: string) => match.includes(codeMarker) ? match : "";
  const cleaned = content
    .replace(/<a\b[^>]*(?:class=["'][^"']*\bheaderlink\b[^"']*["']|href=["']#[^"']*["'])[^>]*>\s*<\/a>/gi, removeOutsideCode)
    .replace(/<a\b[^>\n]*(?:class=["'][^"'\n]*\bheaderlink\b[^"'\n]*["']?|href=["']#[^"'\n]*["']?)[^>\n]*$/gi, removeOutsideCode)
    .replace(/\[\]\(#[^)]+\)/g, removeOutsideCode)
    .replace(
      /\[\s*\n+\s*(!\[[^\]]*\]\([^)]+\))\s*\n+\s*\]\(([^)\s]+)\)/g,
      "[$1]($2)"
    )
    .replace(/(?:^|\n)[ \t]*(?:×|✕|✖)[ \t]*(?=\n|$)/gu, "\n")
    .replace(/(?:^|\n)[ \t]*(?:#[\p{L}\p{N}_-]+[ \t]*){1,24}(?=\n|$)/gu, "\n")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, label, href) =>
      !String(href).includes(codeMarker) && isSearchTagHref(String(href)) ? String(label).trim() : match
    )
    .trim();

  return repairLegacyNumberedCodeBlocks(cleaned);
}

function repairLegacyNumberedCodeBlocks(content: string) {
  const separatedContent = content.replace(
    /([^\n])((?:1\n2\n3\n(?:\d+\n){7,})(?=(?:const|let|var|import|export|async|function|class)\b))/g,
    "$1\n$2"
  );

  return separatedContent.replace(
    /(^|\n)(?:1\n2\n3\n(?:\d+\n){7,})((?:const|let|var|import|export|async|function|class)\b[\s\S]*?)(?=\n#{1,6}\s|$)/g,
    (_, prefix: string, code: string) => {
      const cleanedCode = formatLegacyCodeBlock(code.replace(/\n+$/g, ""));
      const fence = cleanedCode.includes("```") ? "````" : "```";
      const language = guessCodeLanguage(cleanedCode);

      return `${prefix}${fence}${language}\n${cleanedCode}\n${fence}\n\n`;
    }
  );
}

function formatLegacyCodeBlock(code: string) {
  if (guessCodeLanguage(code) === "js") {
    return formatLegacyJavaScript(code);
  }

  return code;
}

function formatLegacyJavaScript(code: string) {
  const lines = code.split("\n");
  let indent = 0;

  return lines
    .map((line) => {
      const trimmed = line.trim();

      if (!trimmed) {
        return "";
      }

      const leadingClosers = trimmed.match(/^}+/)?.[0].length ?? 0;
      indent = Math.max(0, indent - leadingClosers);

      const visualIndent =
        trimmed.startsWith("?") || trimmed.startsWith(":") ? indent + 1 : indent;
      const formattedLine = `${"  ".repeat(visualIndent)}${trimmed}`;
      const opens = countCodeCharacters(trimmed, "{");
      const closes = countCodeCharacters(trimmed, "}");
      indent = Math.max(0, indent + opens - Math.max(0, closes - leadingClosers));

      return formattedLine;
    })
    .join("\n");
}

function countCodeCharacters(value: string, target: "{" | "}") {
  let count = 0;
  let quote: "'" | '"' | "`" | null = null;
  let escaped = false;

  for (const char of value) {
    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (quote) {
      if (char === quote) {
        quote = null;
      }
      continue;
    }

    if (char === "'" || char === '"' || char === "`") {
      quote = char;
      continue;
    }

    if (char === target) {
      count += 1;
    }
  }

  return count;
}

function guessCodeLanguage(code: string) {
  if (/^\s*(?:const|let|var|import|export|async function|function|class)\b/m.test(code)) {
    return "js";
  }

  return "";
}

function extractOriginalMarkdownLink(content: string, codeMarker: string) {
  const normalizedContent = normalizeMarkdownContent(content, codeMarker);
  const originalLinkPattern = new RegExp(
    `(?:^|\\n)#{1,6}\\s*(${originalLinkHeadingPattern})\\s*\\n+\\[([^\\]]+)\\]\\(([^\\s)]+)\\)\\s*$`,
    "i"
  );
  const match = normalizedContent.match(originalLinkPattern);

  if (!match || match.index === undefined || match[3].includes(codeMarker)) {
    return {
      body: normalizedContent,
      originalLink: null as null | { title: string; label: string; href: string }
    };
  }

  const href = sanitizeMarkdownHref(match[3]);

  return {
    body: normalizedContent.slice(0, match.index).trim(),
    originalLink: href
      ? {
          title: match[1].trim(),
          label: match[2].trim(),
          href
        }
      : null
  };
}

type MarkdownLinkSection = {
  title: string;
  links: Array<{
    label: string;
    href: string;
  }>;
};

function extractMarkdownLinkSections(content: string, codeMarker: string) {
  const lines = content.split("\n");
  const bodyLines: string[] = [];
  const linkSections: MarkdownLinkSection[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    if (!isLinkCardsStartMarker(lines[index])) {
      bodyLines.push(lines[index]);
      continue;
    }

    const blockStart = index;
    let cursor = index + 1;

    while (cursor < lines.length && !lines[cursor].trim()) {
      cursor += 1;
    }

    const heading = lines[cursor]?.match(/^#{1,6}\s*(.+?)\s*$/);

    if (!heading) {
      bodyLines.push(lines[blockStart]);
      continue;
    }

    cursor += 1;

    while (cursor < lines.length && !lines[cursor].trim()) {
      cursor += 1;
    }

    const links: MarkdownLinkSection["links"] = [];

    while (cursor < lines.length) {
      const line = lines[cursor];

      if (isLinkCardsEndMarker(line)) {
        break;
      }

      const link = line.match(/^\s*[-*+]\s+\[([^\]]+)\]\(([^)\s]+)\)\s*$/);

      if (!link || link[2].includes(codeMarker)) {
        break;
      }

      const href = sanitizeMarkdownHref(link[2]);

      if (href) {
        links.push({
          label: link[1].trim(),
          href
        });
      }

      cursor += 1;
    }

    if (!links.length || cursor >= lines.length || !isLinkCardsEndMarker(lines[cursor])) {
      bodyLines.push(...lines.slice(blockStart, cursor + 1));
      index = cursor;
      continue;
    }

    linkSections.push({
      title: heading[1].trim(),
      links
    });
    index = cursor;
  }

  return {
    body: bodyLines.join("\n").trim(),
    linkSections
  };
}

function isLinkCardsStartMarker(line: string) {
  return /^\s*::links\s*$/i.test(line);
}

function isLinkCardsEndMarker(line: string) {
  return /^\s*::\s*$/.test(line);
}

function isSearchTagHref(value: string) {
  return /^(?:https?:\/\/[^/]+)?\/search\/result\b/i.test(value.trim());
}

function sanitizeMarkdownHref(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();

  if (!trimmed || /^(?:javascript|vbscript|data):/i.test(trimmed)) {
    return "";
  }

  return trimmed;
}

function sanitizeMarkdownImageSrc(value: unknown) {
  const href = sanitizeMarkdownHref(value)
    .replace(/^<|>$/g, "")
    .replace(/^['"]|['"]$/g, "")
    .trim();

  if (!href || /^(?:mailto|tel|sms):/i.test(href)) {
    return "";
  }

  return href;
}

function isMeaningfulImageCaption(value: string) {
  const normalized = value.trim();

  if (!normalized || normalized.length > 80 || /^(?:×|✕|✖)$/u.test(normalized)) {
    return false;
  }

  return true;
}
