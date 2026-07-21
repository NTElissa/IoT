import api, { unwrap } from './api.js';

export const getAlerts = () => unwrap(api.get('/alerts'));

export const getOverview = () => unwrap(api.get('/reports/overview'));
export const getResponseTimes = () => unwrap(api.get('/reports/response-times'));
export const getComplications = () => unwrap(api.get('/reports/complications'));
export const getWorkload = () => unwrap(api.get('/reports/workload'));
export const getTaskCompletion = () => unwrap(api.get('/reports/task-completion'));
export const getIVUsage = () => unwrap(api.get('/reports/iv-usage'));

export default {
  getAlerts,
  getOverview,
  getResponseTimes,
  getComplications,
  getWorkload,
  getTaskCompletion,
  getIVUsage,
};
