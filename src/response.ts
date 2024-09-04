import { CapiHttpStatusException, CapiInsigntException } from './exception';

export async function handleResponse(action: string, res: any): Promise<any> {
  if (res?.status !== 200) {
    const httpError = new CapiHttpStatusException(action, res?.status || '', res?.statusText || '');
    throw httpError;
  } else {
    const data = await res.json();
    if (data?.Response?.Error) {
      const backendError = new CapiInsigntException(
        action,
        data.Response?.RequestId || '',
        data.Response.Error?.Code || '',
        data.Response.Error?.Message || '',
      );
      throw backendError;
    } else {
      return data.Response;
    }
  }
}
