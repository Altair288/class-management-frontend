import axios from 'axios';

export interface CurrentUser {
  id: number;
  username: string;
  userType: string;
  relatedId?: number;
  classMonitor?: boolean;
  monitorClassId?: number;
}

export interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export async function getCurrentUser(): Promise<CurrentUser> {
  const res = await axios.get('/api/users/current');
  return res.data;
}

export async function changePassword(payload: ChangePasswordPayload) {
  const res = await axios.patch('/api/users/password', payload);
  return res.data as { message: string; forceReLogin?: boolean };
}
