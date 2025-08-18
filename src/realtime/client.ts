let retries = 0;

function backoff() {
  return Math.min(30000, 500 * 2 ** retries) + Math.random() * 250;
}

function getToken(): string | undefined {
  // Get token from storage or auth context
  return localStorage.getItem('ws_token') || undefined;
}

export function connectWS(url: string, token: string | undefined) {
  if (!token) {
    console.warn('No WebSocket token available, retrying in 1s');
    return setTimeout(() => connectWS(url, getToken()), 1000);
  }
  
  const ws = new WebSocket(`${url}?t=${encodeURIComponent(token)}`);
  
  ws.onopen = () => {
    retries = 0;
    console.log('WebSocket connected successfully');
  };
  
  ws.onclose = (event) => {
    console.log(`WebSocket closed: ${event.code} ${event.reason}`);
    retries++;
    const delay = backoff();
    console.log(`Reconnecting in ${delay}ms (attempt ${retries})`);
    setTimeout(() => connectWS(url, token), delay);
  };
  
  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
  
  return ws;
}