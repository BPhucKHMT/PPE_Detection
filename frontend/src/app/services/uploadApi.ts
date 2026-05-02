import { API_BASE_URL } from '../config';

export interface UploadVideoResponse {
  job_id: string;
}

export async function uploadVideo(file: File): Promise<UploadVideoResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/detect/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Upload API failed');
  }

  return response.json() as Promise<UploadVideoResponse>;
}
