import { CapiUnexpectedException } from './exception';
import { cgiRequest, cgiRequestWithSignV3 } from './request';
import { handleResponse } from './response';

export interface Credential {
  /**
   * 腾讯云账户secretId，secretKey
   * 非必选，和 token 二选一
   */
  secretId?: string;
  /**
   * 腾讯云账户secretKey
   * 非必选，和 token 二选一
   */
  secretKey?: string;
  /**
   * 腾讯云账户token
   * 非必选，和 secretId 二选一
   */
  token?: string;
}

export interface HttpProfile {
  /**
   * 请求方法
   * @type {"POST" | "GET"}
   * 非必选
   */
  reqMethod?: 'POST' | 'GET';
  /**
   * 接入点域名，形如（cvm.ap-shanghai.tencentcloud.com）
   * @type {string}
   * 非必选
   */
  endpoint?: string;
  /**
   * 协议，目前支持（https://）
   * @type {string}
   * 非必选
   */
  protocol?: string;
  /**
   *  请求超时时间，默认60s
   * @type {number}
   * 非必选
   */
  reqTimeout?: number;
  /**
   * 自定义请求头，例如 { "X-TC-TraceId": "ffe0c072-8a5d-4e17-8887-a8a60252abca" }
   * @type {Record<string, string>}
   * 非必选
   */
  headers?: Record<string, string>;
}

export interface ClientProfile {
  /**
   * 签名方法 (TC3-HMAC-SHA256 HmacSHA1 HmacSHA256)
   * @type {string}
   * 非必选
   */
  signMethod?: 'TC3-HMAC-SHA256' | 'HmacSHA256' | 'HmacSHA1';
  /**
   * http相关选项实例
   * @type {HttpProfile}
   * 非必选
   */
  httpProfile?: HttpProfile;
  /**
   * api请求时附带的 language 字段
   * @type {"zh-CN" | "en-US"}
   * 非必选
   */
  language?: 'zh-CN' | 'en-US';
}

export interface ClientConfig {
  /**
   * @param {Credential} credential 认证信息
   * 必选
   */
  credential?: Credential;
  /**
   * @param {string} region 产品地域
   * 对于要求区分地域的产品，此参数必选（如 cvm）；对于不区分地域的产品（如 sms），无需传入。
   */
  region?: string;
  /**
   * @param {ClientProfile} profile 可选配置实例
   * 可选，没有特殊需求可以跳过。
   */
  profile?: ClientProfile;
}

export interface RequestOptions extends Partial<Pick<HttpProfile, 'headers'>> {
  /**
   * @param {boolean} multipart 使用 Content-Type: multipart/form-data
   * 可选，没有特殊需求可以跳过。
   */
  multipart?: boolean;
}

type ResponseCallback<TReuslt = any> = (error: string, rep: TReuslt) => void;

export class CapiClient {
  path: string;
  region: string;
  apiVersion: string;
  endpoint: string;
  credential: Credential;
  profile: ClientProfile;

  constructor(endpoint: string, version: string, config?: ClientConfig) {
    const { credential, region, profile } = config || {};

    this.endpoint = endpoint || null;
    this.apiVersion = version || null;
    this.region = region || null;
    this.path = '/';

    this.credential = Object.assign(
      {
        secretId: null,
        secretKey: null,
        token: null,
      },
      credential,
    );

    this.profile = {
      signMethod: profile?.signMethod || 'HmacSHA256',
      httpProfile: Object.assign(
        {
          reqMethod: 'POST',
          endpoint: null,
          protocol: 'https://',
          reqTimeout: 60,
        },
        profile?.httpProfile,
      ),
      language: profile?.language || 'en-US',
    };
  }

  async request(
    action: string,
    req?: Record<string, string>,
    option?: RequestOptions,
    cb?: ResponseCallback,
  ): Promise<any> {
    try {
      const result = await this.doRequest(action, req || {}, option || {});
      !!cb && cb(null, result);
      return result;
    } catch (e) {
      !!cb && cb(e as any, null);
      throw e;
    }
  }

  private getCredential(): Credential {
    return this.credential;
  }

  private async doRequest(action: string, req: Record<string, string>, options: RequestOptions): Promise<any> {
    if (this.profile.signMethod === 'TC3-HMAC-SHA256') {
      return this.doRequestWithSignV3(action, req, options);
    }
    return this.doRequestWithSign(action, req, options);
  }

  private async doRequestWithSign(action: string, req: Record<string, string>, options: RequestOptions): Promise<any> {
    let res = {};
    try {
      const credential = this.getCredential();
      res = await cgiRequest({
        endpoint: this.endpoint,
        version: this.apiVersion,
        region: this.region,
        language: this.profile.language,
        credential,
        method: this.profile.httpProfile.reqMethod,
        path: this.path,
        action,
        url: this.profile.httpProfile.protocol + this.endpoint + this.path,
        data: req || {},
        signMethod: this.profile.signMethod as 'HmacSHA1' | 'HmacSHA256',
        timeout: this.profile.httpProfile.reqTimeout * 1000,
        headers: Object.assign({}, this.profile.httpProfile.headers, options?.headers),
      });
    } catch (err: any) {
      throw new CapiUnexpectedException(action, err?.message);
    }
    return handleResponse(action, res);
  }

  private async doRequestWithSignV3(
    action: string,
    req: Record<string, string>,
    options: RequestOptions,
  ): Promise<any> {
    let res = {};
    try {
      const credential = this.getCredential();
      res = await cgiRequestWithSignV3({
        service: this.endpoint.split('.')[0],
        version: this.apiVersion,
        region: this.region,
        language: this.profile.language,
        secretId: credential.secretId,
        secretKey: credential.secretKey,
        token: credential.token,
        method: this.profile.httpProfile.reqMethod,
        action,
        url: this.profile.httpProfile.protocol + this.endpoint + this.path,
        data: req || {},
        multipart: options?.multipart,
        timeout: this.profile.httpProfile.reqTimeout * 1000,
        headers: Object.assign({}, this.profile.httpProfile.headers, options.headers),
      });
    } catch (err: any) {
      throw new CapiUnexpectedException(action, err.message);
    }
    return handleResponse(action, res);
  }
}
