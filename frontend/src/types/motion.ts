export type MotionAction = {
  action: string;
  motion_prompt: string;
  duration: number;
  speed: number;
  direction: string;
  transition: string;
};

export type MotionPlan = {
  original_prompt: string;
  style: string;
  speed: number;
  total_duration: number;
  actions: MotionAction[];
};

export type HealthStatus = {
  status: string;
  groq_configured: boolean;
  cuda_available: boolean;
  motion_engine?: string;
  motion_model?: string;
  motion_model_available: boolean;
  available_engines?: MotionEngineStatus[];
  kimodo_available?: boolean;
  humanml3d_available?: boolean;
  gpu?: string | null;
};

export type MotionEngineId = 'preview' | 'humanml3d' | 'kimodo';

export type MotionEngineStatus = {
  id: MotionEngineId;
  label: string;
  model: string;
  available: boolean;
  requires_setup: boolean;
};

export type MotionRecord = {
  id: string;
  prompt: string;
  model: string;
  fps: number;
  duration: number;
  frames: number;
  joints: number;
  created_at: string;
  plan?: MotionPlan;
  status?: string;
};

export type MotionData = {
  frames: number[][][];
  fps: number;
  joints: number;
  bones: number[][];
  duration?: number;
  plan?: MotionPlan;
};

export type GenerateResponse = {
  success: boolean;
  motion_id: string;
  status: string;
  plan: MotionPlan;
};
