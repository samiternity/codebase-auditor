export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const targetUrl = `http://13.53.245.246${url.pathname}${url.search}`;
  
  const headers = new Headers(request.headers);
  headers.delete("Host");
  
  const init = {
    method: request.method,
    headers: headers,
    redirect: "manual"
  };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = request.body;
  }
  
  try {
    return await fetch(targetUrl, init);
  } catch(err) {
    return new Response('Proxy Error: ' + err.message, {status:502});
  }
}