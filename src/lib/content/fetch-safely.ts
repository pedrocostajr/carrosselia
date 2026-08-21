import http from "node:http";
import https from "node:https";

import { resolveSafeUrl, SsrfBlockedError } from "@/lib/security/ssrf";

const MAX_REDIRECTS = 3;
const TIMEOUT_MS = 8000;
const MAX_BYTES = 3 * 1024 * 1024; // 3MB
const USER_AGENT = "CarouselAI-Bot/1.0 (+content-extractor)";

export class FetchSafelyError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = "FetchSafelyError";
  }
}

export interface SafeFetchResult {
  finalUrl: string;
  contentType: string | null;
  body: string;
}

/**
 * Fetches a URL while preventing SSRF: every hop (including redirects) is
 * validated and DNS-pinned so the TCP connection always goes to the address
 * that was checked, never a rebound one. Limits redirects, response size and
 * total time.
 */
export async function fetchUrlSafely(rawUrl: string): Promise<SafeFetchResult> {
  let currentUrl = rawUrl;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const { url, resolvedIp } = await resolveSafeUrl(currentUrl);
    const result = await performRequest(url, resolvedIp);

    if (result.type === "redirect") {
      if (hop === MAX_REDIRECTS) {
        throw new FetchSafelyError(
          "A página redirecionou muitas vezes.",
          "too_many_redirects"
        );
      }
      currentUrl = new URL(result.location, url).toString();
      continue;
    }

    return {
      finalUrl: url.toString(),
      contentType: result.contentType,
      body: result.body,
    };
  }

  throw new FetchSafelyError("Não foi possível acessar a página.", "unknown");
}

function performRequest(
  url: URL,
  resolvedIp: string
): Promise<
  | { type: "redirect"; location: string }
  | { type: "ok"; contentType: string | null; body: string }
> {
  const client = url.protocol === "https:" ? https : http;

  return new Promise((resolve, reject) => {
    const req = client.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || (url.protocol === "https:" ? 443 : 80),
        path: `${url.pathname}${url.search}`,
        method: "GET",
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "text/html,application/xhtml+xml",
          Host: url.hostname,
        },
        timeout: TIMEOUT_MS,
        // Pin the connection to the pre-validated IP to prevent DNS-rebinding
        // TOCTOU attacks; the Host header above preserves virtual hosting.
        lookup: (_hostname, _options, callback) => {
          callback(null, resolvedIp, url.hostname.includes(":") ? 6 : 4);
        },
      },
      (res) => {
        const status = res.statusCode ?? 0;

        if (status >= 300 && status < 400 && res.headers.location) {
          res.resume();
          resolve({ type: "redirect", location: res.headers.location });
          return;
        }

        if (status < 200 || status >= 300) {
          req.destroy();
          reject(
            new FetchSafelyError(
              `A página respondeu com status ${status}.`,
              "bad_status"
            )
          );
          return;
        }

        const contentType = res.headers["content-type"] ?? null;
        let received = 0;
        const chunks: Buffer[] = [];

        res.on("data", (chunk: Buffer) => {
          received += chunk.length;
          if (received > MAX_BYTES) {
            req.destroy();
            reject(
              new FetchSafelyError(
                "O conteúdo da página é grande demais.",
                "too_large"
              )
            );
            return;
          }
          chunks.push(chunk);
        });

        res.on("end", () => {
          resolve({
            type: "ok",
            contentType,
            body: Buffer.concat(chunks).toString("utf-8"),
          });
        });
      }
    );

    req.on("timeout", () => {
      req.destroy(new FetchSafelyError("Tempo de acesso à página esgotado.", "timeout"));
    });

    req.on("error", (err) => {
      if (err instanceof SsrfBlockedError || err instanceof FetchSafelyError) {
        reject(err);
        return;
      }
      reject(new FetchSafelyError("Não foi possível acessar a página.", "network_error"));
    });

    req.end();
  });
}
