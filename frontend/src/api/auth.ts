const refreshToken = async () => {
  const refresh = localStorage.getItem('refresh');
  if (!refresh) return null;

  const response = await fetch('/api/token/refresh/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  });

  if (response.ok) {
    const data = await response.json();
    localStorage.setItem('access', data.access);
    return data.access;
  } else {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    return null;
  }
};
export const fetchWithAuth = async (url: string, options: any = {}) => {
  let access = localStorage.getItem('access');
  options.headers = {
    ...options.headers,
    Authorization: `Bearer ${access}`,
  };

  let response = await fetch(url, options);

  // If access token expired, try refreshing
  if (response.status === 401) {
    access = await refreshToken();
    if (access) {
      options.headers.Authorization = `Bearer ${access}`;
      response = await fetch(url, options); // retry
    }
  }

  return response;
};
