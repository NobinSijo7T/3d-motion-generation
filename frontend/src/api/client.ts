import type { GenerateResponse, HealthStatus, MotionData, MotionEngineId, MotionPlan, MotionRecord } from '../types/motion';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

async function parse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = (data as { detail?: string }).detail;
    throw new Error(detail || `Request failed (${response.status})`);
  }
  return data as T;
}

export const api = {
  health: () => fetch(`${API}/health`).then((r) => parse<HealthStatus>(r)),
  plan: (prompt: string) =>
    fetch(`${API}/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    }).then((r) => parse<MotionPlan>(r)),
  generate: (prompt: string, duration: number | null, variations: number, motionEngine: MotionEngineId) =>
    fetch(`${API}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, duration, variations, motion_engine: motionEngine }),
    }).then((r) => parse<GenerateResponse>(r)),
  motions: () => fetch(`${API}/motions`).then((r) => parse<MotionRecord[]>(r)),
  motion: (id: string) => fetch(`${API}/motions/${id}`).then((r) => parse<MotionRecord>(r)),
  data: (id: string) => fetch(`${API}/motions/${id}/data`).then((r) => parse<MotionData>(r)),
  downloadUrl: (id: string, format: 'npy' | 'npz' | 'json') =>
    `${API}/motions/${id}/download?format=${format}`,
  remove: (id: string) => fetch(`${API}/motions/${id}`, { method: 'DELETE' }).then((r) => parse<{ success: boolean }>(r)),
};
