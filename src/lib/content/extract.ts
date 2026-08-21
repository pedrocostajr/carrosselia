import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import createDOMPurify from "isomorphic-dompurify";

import { fetchUrlSafely, FetchSafelyError } from "@/lib/content/fetch-safely";
import { SsrfBlockedError } from "@/lib/security/ssrf";
import type { ExtractedContent } from "@/lib/schemas/content-source";

export class ContentExtractionError extends Error {
  constructor(message: string, public readonly userMessage: string) {
    super(message);
    this.name = "ContentExtractionError";
  }
}

const MAX_TEXT_LENGTH = 12000;

function metaContent(dom: JSDOM, selectors: string[]): string | null {
  for (const selector of selectors) {
    const el = dom.window.document.querySelector(selector);
    const content = el?.getAttribute("content")?.trim();
    if (content) return content;
  }
  return null;
}

/**
 * Extracts readable content from a public URL. Never attempts to bypass
 * login walls, paywalls, or bot protections - if the page cannot be reached
 * or does not yield meaningful article content, a clear error is thrown so
 * the caller can ask the user to paste the text manually.
 */
export async function extractContentFromUrl(rawUrl: string): Promise<ExtractedContent> {
  let fetched;
  try {
    fetched = await fetchUrlSafely(rawUrl);
  } catch (err) {
    if (err instanceof SsrfBlockedError) {
      throw new ContentExtractionError(err.message, err.message);
    }
    if (err instanceof FetchSafelyError) {
      const messages: Record<string, string> = {
        too_large: "O conteúdo desta página é grande demais para ser importado.",
        timeout: "A página demorou demais para responder. Tente novamente ou cole o texto manualmente.",
        bad_status: "Não foi possível acessar esta página (ela pode exigir login ou ter bloqueado o acesso).",
        too_many_redirects: "Esta página redireciona repetidamente e não pôde ser acessada.",
        network_error: "Não foi possível conectar a esta página.",
      };
      throw new ContentExtractionError(
        err.message,
        messages[err.code] ??
          "Não foi possível acessar esta página. Cole o texto manualmente."
      );
    }
    throw new ContentExtractionError(
      "unknown_error",
      "Não foi possível acessar esta página. Cole o texto manualmente."
    );
  }

  if (fetched.contentType && !fetched.contentType.includes("html")) {
    throw new ContentExtractionError(
      "not_html",
      "Este link não aponta para uma página de texto (HTML). Cole o conteúdo manualmente."
    );
  }

  const sanitizedHtml = createDOMPurify.sanitize(fetched.body, {
    WHOLE_DOCUMENT: true,
    ALLOWED_TAGS: [
      "html", "head", "body", "title", "meta", "article", "main", "section", "div",
      "p", "span", "a", "img", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li",
      "blockquote", "strong", "em", "b", "i", "br", "figure", "figcaption", "time",
    ],
    ALLOWED_ATTR: ["href", "src", "alt", "content", "name", "property", "datetime"],
    FORBID_TAGS: ["script", "style", "noscript", "iframe", "object", "embed", "form"],
  });

  const dom = new JSDOM(sanitizedHtml, { url: fetched.finalUrl });

  const title = dom.window.document.title?.trim() || metaContent(dom, ["meta[property='og:title']"]);
  const description = metaContent(dom, [
    "meta[name='description']",
    "meta[property='og:description']",
  ]);
  const author = metaContent(dom, [
    "meta[name='author']",
    "meta[property='article:author']",
  ]);
  const imageUrl = metaContent(dom, ["meta[property='og:image']"]);
  const siteName = metaContent(dom, ["meta[property='og:site_name']"]);

  let article;
  try {
    article = new Readability(dom.window.document, { charThreshold: 200 }).parse();
  } catch {
    article = null;
  }

  const textContent = (article?.textContent ?? "").trim();

  if (!textContent || textContent.length < 200) {
    throw new ContentExtractionError(
      "no_readable_content",
      "Não foi possível extrair um conteúdo legível desta página (ela pode ser dinâmica, exigir login ou bloquear automação). Cole o texto manualmente."
    );
  }

  const trimmed =
    textContent.length > MAX_TEXT_LENGTH
      ? `${textContent.slice(0, MAX_TEXT_LENGTH)}…`
      : textContent;

  return {
    url: fetched.finalUrl,
    title: (article?.title || title || null)?.slice(0, 300) ?? null,
    description: description?.slice(0, 500) ?? null,
    author: author?.slice(0, 200) ?? null,
    imageUrl: imageUrl,
    textContent: trimmed,
    siteName: siteName,
    wordCount: trimmed.split(/\s+/).filter(Boolean).length,
  };
}
