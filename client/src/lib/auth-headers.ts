export function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('session_token') || sessionStorage.getItem('session_token');
  if (token) {
    return { 'Authorization': `Bearer ${token}` };
  }
  return {};
}
