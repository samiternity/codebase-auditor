
export async function onRequest(context) {
  const url = new URL(context.request.url);
  const targetUrl = `http://13.53.245.246:8000${url.pathname}${url.search}`;
  
  const newRequest = new Request(targetUrl, {
    method: context.request.method,
    headers: context.request.headers,
    body: context.request.body,
    redirect: "manual"
  });
  
  try {
    return await fetch(newRequest);
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message, targetUrl }), { 
      status: 502,
      headers: { "Content-Type": "application/json" }
    });
  }
}
