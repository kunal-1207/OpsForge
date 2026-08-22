import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1',
});

export interface Application {
  id?: string;
  name: string;
  image: string;
  replicas: number;
  environment: string;
  created_at?: string;
  updated_at?: string;
}

export const getApplications = async () => {
  const response = await api.get<Application[]>('/applications');
  return response.data;
};

export const createApplication = async (app: Application) => {
  const response = await api.post<Application>('/applications', app);
  return response.data;
};
