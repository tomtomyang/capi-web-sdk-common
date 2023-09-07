import { CapiClient, ClientConfig, Credential, RequestOptions } from './index';

export type CapiCallback<TReuslt = any> = (error: string, rep: TReuslt) => void;

export type CapiOptions = {
  /**
   * 接口所属服务，默认 teo
   */
  service?: string;
  /**
   * 接口版本，默认 2022-09-01
   */
  version?: string;
  /**
   * 地域，默认 ap-guangzhou
   */
  region?: string;
  /**
   * 语言，默认 en-US
   */
  language?: 'zh-CN' | 'en-US';
  /**
   * 签名方式，默认 sign
   */
  signMethod?: 'sign' | 'signV3';
  /**
   * 自定义身份信息, 必须传 secretId & secretKey
   */
  credential?: Credential;
  /**
   * 自定义 http 请求头部，默认无
   */
  headers?: Record<string, string>;
  /**
   * Content-Type: multipart/form-data，默认不开启
   */
  // multipart?: boolean;
};

/**
 * 不同服务对应的 endpoint
 */
const SERVICE_2_ENDPOINT = {
  /**
   * EdgeOne
   */
  teo: 'teo.tencentcloudapi.com',
  /**
   * CDN
   */
  cdn: 'cdn.tencentcloudapi.com',
  /**
   * CVM
   */
  cvm: 'cvm.tencentcloudapi.com',
  /**
   * VPC
   */
  vpc: 'vpc.tencentcloudapi.com'
};

/**
 * 请求云 API 接口
 * @param action 请求接口
 * @param req 请求参数
 * @param options 自定义选项
 * @param cb callback 函数
 */
export function capi(action: string, req?: any, options?: CapiOptions, cb?: CapiCallback): Promise<any> | void {
  try {
    const endpoint: string = SERVICE_2_ENDPOINT?.[options?.service || 'teo'] || 'teo.tencentcloudapi.com';
    const version: string = options?.version || '2022-09-01';
    const config: ClientConfig = {
      region: options?.region || 'ap-guangzhou',
      credential: {
        secretId: options?.credential?.secretId || null,
        secretKey: options?.credential?.secretKey || null,
        token: options?.credential?.token || null,
      },
      profile: {
        signMethod: (options?.signMethod === 'signV3') ? 'TC3-HMAC-SHA256' : 'HmacSHA256',
        language: options?.language || 'en-US',
      },
    };
    const capiClient = new CapiClient(endpoint, version, config);
    const requestOption: RequestOptions = {};
    if (options?.headers) requestOption.headers = options.headers;
    // if (options?.multipart) requestOption.multipart = options.multipart;

    return capiClient.request(action, req, requestOption, cb);
  } catch (e) {
    throw e;
  }
}
