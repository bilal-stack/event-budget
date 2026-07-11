export const getToken = () => localStorage.getItem('token');
export const getWorkspaceId = () => localStorage.getItem('workspaceId');
export const isAuthenticated = () => !!getToken();

export const setAuth = (token: string, workspaceId: string) => {
  localStorage.setItem('token', token);
  localStorage.setItem('workspaceId', workspaceId);
};

export const clearAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('workspaceId');
};
