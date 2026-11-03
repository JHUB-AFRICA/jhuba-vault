export const API_URL = '/api';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}
