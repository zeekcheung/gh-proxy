/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.toml`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

const WHITELIST: string[] = ['github.com'];

/**
 * Regular expression for github URL matching
 */
// const GITHUB_REGEX = {
//   releasesOrArchive: /^(?:https?:\/\/)?github\.com\/.+?\/.+?\/(?:releases|archive)\/.*$/i,
//   blob: /^(?:https?:\/\/)?github\.com\/.+?\/.+?\/(?:blob|raw)\/.*$/i,
//   info: /^(?:https?:\/\/)?github\.com\/.+?\/.+?\/(?:info|git-).*$/i,
//   raw: /^(?:https?:\/\/)?raw\.(?:githubusercontent|github)\.com\/.+?\/.+?\/.+?\/.+$/i,
//   gist: /^(?:https?:\/\/)?gist\.(?:githubusercontent|github)\.com\/.+?\/.+?\/.+$/i,
//   tags: /^(?:https?:\/\/)?github\.com\/.+?\/.+?\/tags.*$/i,
// };

export default {
  async fetch(request, env, ctx): Promise<Response> {
    return fetchHandler(request);
  },
} satisfies ExportedHandler<Env>;

/**
 * Redirect to target server.
 */
async function fetchHandler(req: Request) {
  const reqHeaders = req.headers;

  // preflight
  if (req.method === 'OPTIONS' && reqHeaders.has('access-control-request-headers')) {
    return new Response(null, {
      status: 204,
      headers: new Headers({
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'GET,POST,PUT,PATCH,TRACE,DELETE,HEAD,OPTIONS',
        'access-control-max-age': '1728000',
      }),
    });
  }

  const urlObj = new URL(req.url);
  let targetUrl = urlObj.href.slice(urlObj.origin.length + 1);
  targetUrl = targetUrl.length === 0 ? 'https://github.com' : targetUrl;
  // console.log(targetUrl);

  // Add protocol and host if not present
  if (targetUrl.length > 0 && targetUrl.search(/^https?:\/\//) === -1) {
    targetUrl = 'https://github.com/' + targetUrl;
  }

  // Block request if not in whitelist
  const whitelistEnabled = WHITELIST.length > 0;
  const allowPass = WHITELIST.some((i) => targetUrl.includes(i));
  if (whitelistEnabled && !allowPass) {
    return new Response('Blocked by whitelist.', { status: 403 });
  }

  // Redirect to raw if the URL is a blob URL
  // if (GITHUB_REGEX.blob.test(targetUrl)) {
  //   targetUrl = targetUrl.replace('/blob/', '/raw/');
  // }

  // Porxy to target server
  return proxy(targetUrl, {
    method: req.method,
    headers: new Headers(reqHeaders),
    redirect: 'manual',
    body: req.body,
  });
}

/**
 * Proxy to target server
 * @param {string} targetUrl
 */
async function proxy(targetUrl: string, reqInit: RequestInit) {
  try {
    const res = await fetch(targetUrl, reqInit);
    const resStatus = res.status;
    const resHeaders = new Headers(res.headers);

    // Redirect
    if (resHeaders.has('location')) {
      const location = resHeaders.get('location')!;
      reqInit.redirect = 'follow';
      return proxy(location, reqInit);
    }

    // Modify response headers
    resHeaders.set('access-control-expose-headers', '*');
    resHeaders.set('access-control-allow-origin', '*');
    resHeaders.delete('content-security-policy');
    resHeaders.delete('content-security-policy-report-only');
    resHeaders.delete('clear-site-data');

    // Response
    return new Response(res.body, {
      status: resStatus,
      headers: resHeaders,
    });
  } catch (e: any) {
    const message = `Error: ${e.message}
Usage: git clone https://gh-proxy.zeekcheung.workers.dev/https://github.com/zeekcheung/gh-proxy
`;
    // console.log(e.stack);
    return new Response(message, { status: 500 });
  }
}
