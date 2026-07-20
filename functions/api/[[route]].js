// Cloudflare Pages Function: proxy /api/* to the Vercel-hosted TourMate backend.
// The Angular frontend always calls same-origin /api, so the browser never
// sees a cross-origin request and no CORS configuration is required.

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const target = (env.API_TARGET || 'https://tourmate.vercel.app') + url.pathname + url.search;

  const method = request.method;
  const init = {
    method,
    headers: request.headers,
    redirect: 'follow',
  };

  if (method !== 'GET' && method !== 'HEAD') {
    init.body = await request.arrayBuffer();
  }

  const response = await fetch(target, init);
  return response;
}
