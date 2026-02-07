export function getAuthHeaders(): HeadersInit {
  let token = localStorage.getItem('session_token') || sessionStorage.getItem('session_token');
  if (!token) {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get('auth_token');
      if (urlToken) {
        localStorage.setItem('session_token', urlToken);
        sessionStorage.setItem('session_token', urlToken);
        token = urlToken;
      }
    } catch (e) {}
  }
  if (token) {
    return { 'Authorization': `Bearer ${token}` };
  }
  return {};
}
