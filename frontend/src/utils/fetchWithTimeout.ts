export const fetchWithTimeout = async (resource: RequestInfo, options: RequestInit & { timeout?: number } = {}) => {
  const { timeout = 60000 } = options;
  
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    return await fetch(resource, {
      ...options,
      signal: controller.signal
    });
  } finally {
    clearTimeout(id);
  }
};

export const readApiResponse = async <T extends { success: boolean; message?: string }>(response: Response): Promise<T> => {
  const body = await response.text();

  try {
    return JSON.parse(body) as T;
  } catch {
    return {
      success: false,
      message: body || `El servidor respondió con estado ${response.status}`,
    } as T;
  }
};
