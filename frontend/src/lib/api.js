const BASE = (import.meta.env.VITE_API_URL || '') + '/api'

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (res.status === 204) return null
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.detail || `HTTP ${res.status}`)
  return data
}

export const customers = {
  list:   ()             => request('GET',    '/customers'),
  get:    (id)           => request('GET',    `/customers/${id}`),
  create: (data)         => request('POST',   '/customers', data),
  update: (id, data)     => request('PUT',    `/customers/${id}`, data),
  delete: (id)           => request('DELETE', `/customers/${id}`),
  updateCategory: (id, cat, data) =>
    request('PUT', `/customers/${id}/categories/${cat}`, data),
  addAppointment: (id, data) =>
    request('POST', `/customers/${id}/appointments`, data),
  deleteAppointment: (id, apptId) =>
    request('DELETE', `/customers/${id}/appointments/${apptId}`),
  getContracts: (id) =>
    request('GET', `/customers/${id}/contracts`),
  createContract: (id, cat, data) =>
    request('POST', `/customers/${id}/contracts/${cat}`, data),
  updateContract: (id, contractId, data) =>
    request('PUT', `/customers/${id}/contracts/${contractId}`, data),
  deleteContract: (id, contractId) =>
    request('DELETE', `/customers/${id}/contracts/${contractId}`),
  exportExcelUrl: (id) => `${BASE}/customers/${id}/export/excel`,
}

export const settings = {
  get:    (key)        => request('GET', `/settings/${key}`),
  set:    (key, value) => request('PUT', `/settings/${key}`, { value: JSON.stringify(value) }),
}

export const tasks = {
  list:   ()     => request('GET',    '/tasks'),
  count:  ()     => request('GET',    '/tasks/count'),
  create: (data) => request('POST',   '/tasks', data),
  done:   (id)   => request('PUT',    `/tasks/${id}/done`),
  delete: (id)   => request('DELETE', `/tasks/${id}`),
}

export const termine = {
  uebersicht: () => request('GET', '/termine-uebersicht'),
}

export const leads = {
  import:          (raw_email)   => request('POST', '/leads/import', { raw_email }),
  applyMapping:    ()            => request('POST', '/leads/apply-mapping'),
  simulateSent:    (customer_id) => request('POST', `/leads/${customer_id}/simulate-sent`),
  unmappedReport:  ()            => request('GET',  '/leads/unmapped-report'),
}
