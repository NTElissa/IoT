import api, { unwrap } from './api.js';

export const getIVFluids = (params) => unwrap(api.get('/iv-fluids', { params }));
export const getIVFluid = (id) => unwrap(api.get(`/iv-fluids/${id}`));
export const createIVFluid = (payload) => unwrap(api.post('/iv-fluids', payload));
export const updateIVFluid = (id, payload) => unwrap(api.put(`/iv-fluids/${id}`, payload));
export const changeBag = (id) => unwrap(api.patch(`/iv-fluids/${id}/change-bag`));
export const removeIVFluid = (id) => unwrap(api.patch(`/iv-fluids/${id}/remove`));
export const acknowledgeAlert = (ivId, alertId) =>
  unwrap(api.patch(`/iv-fluids/${ivId}/alerts/${alertId}/acknowledge`));
export const recordComplication = (id, description) =>
  unwrap(api.post(`/iv-fluids/${id}/complications`, { description }));

export default {
  getIVFluids,
  getIVFluid,
  createIVFluid,
  updateIVFluid,
  changeBag,
  removeIVFluid,
  acknowledgeAlert,
  recordComplication,
};
