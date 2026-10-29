const jsonHeaders = { 'Content-Type': 'application/json' };

async function request(url, options = {}) {
  const response = await fetch(url, options);
  const body = response.status === 204 ? null : await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.message || 'Erro na requisição.');
  return body;
}

export const api = {
  systemStatus: () => request('/api/system/status'),
  health: () => request('/api/health'),
  simulation: () => request('/api/simulation'),
  advanceSimulation: (days = 7) => request('/api/simulation/advance', { method:'POST', headers:jsonHeaders, body:JSON.stringify({days}) }),
  nextSimulationEvent: () => request('/api/simulation/next-event', { method:'POST' }),
  resetSimulation: () => request('/api/simulation/reset', { method:'POST' }),
  classes: () => request('/api/classes'),
  dashboard: (classId) => request(`/api/classes/${classId}/dashboard`),
  profile: (studentId) => request(`/api/students/${studentId}/profile`),
  updateSubject: (studentId, subjectId, payload) => request(`/api/students/${studentId}/subjects/${subjectId}`, {
    method: 'PATCH', headers: jsonHeaders, body: JSON.stringify(payload)
  }),
  notificationPreview: (studentId) => request(`/api/students/${studentId}/notifications/preview`),
  notifications: () => request('/api/notifications'),
  createNotification: (payload) => request('/api/notifications', { method: 'POST', headers: jsonHeaders, body: JSON.stringify(payload) }),
  simulateSend: (id) => request(`/api/notifications/${id}/send`, { method: 'POST' }),
  clusters: (classId) => request(`/api/classes/${classId}/clusters`)
};
