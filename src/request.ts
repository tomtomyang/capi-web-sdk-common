import qs from 'qs';

import { Credential } from './client';
import { mergeData } from './data';
import { sign, signV3 } from './sign';

type CgiRequestProps = {
  endpoint: string;
  version: string;
  path: string;
  method: 'POST' | 'GET';
  url: string;
  action: string;
  data: Record<string, string>;
  credential: Credential;
  region: string;
  language: string;
  signMethod: 'HmacSHA1' | 'HmacSHA256';
  timeout: number;
  headers: Record<string, string>;
};

type CgiRequestWithSignV3Props = {
  service: string;
  version: string;
  region: string;
  language: string;
  method: 'POST' | 'GET';
  url: string;
  action: string;
  data: any;
  secretId: string;
  secretKey: string;
  multipart?: boolean;
  headers?: Record<string, string>;
  timeout?: number;
  token?: string;
};

export async function cgiRequest({
  endpoint,
  version,
  path,
  method,
  url,
  data,
  action,
  credential,
  region,
  language,
  signMethod,
  timeout,
  headers = {},
}: CgiRequestProps): Promise<any> {
  const config = {
    method,
    headers,
    body: null,
    timeout,
  };

  const params = mergeData(data);
  params.Action = action;
  params.Nonce = Math.round(Math.random() * 65535);
  params.Timestamp = Math.round(Date.now() / 1000);
  params.Version = version;

  if (credential.secretId) params.SecretId = credential.secretId;
  if (region) params.Region = region;
  if (credential.token) params.Token = credential.token;
  if (language) params.Language = language;
  if (signMethod) params.SignatureMethod = signMethod;

  const signStr = formatSignString(params, method, endpoint, path);
  params.Signature = await sign(credential.secretKey, signStr, signMethod);

  if (method === 'GET') {
    url += `?${qs.stringify(params)}`;
  }
  if (method === 'POST') {
    config.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    config.body = qs.stringify(params);
  }

  return await fetch(url, config);
}

function formatSignString(params = {}, method: 'POST' | 'GET', endpoint: string, path: string): string {
  let strParam = '';
  const keys = Object.keys(params);
  keys.sort();

  for (const key in keys) {
    if (!keys?.[key]) {
      continue;
    }
    strParam += `&${keys[key]}=${params[keys[key]]}`;
  }

  const signStr = `${method + endpoint + path}?${strParam.slice(1)}`;
  return signStr;
}

export async function cgiRequestWithSignV3({
  service,
  version,
  region,
  language,
  method,
  url,
  action,
  data,
  secretId,
  secretKey,
  multipart = false,
  headers = {},
  timeout = 60000,
  token,
}: CgiRequestWithSignV3Props): Promise<any> {
  data = deepRemoveNull(data);
  const timestamp = parseInt(String(new Date().getTime() / 1000), 10);

  const config = {
    method,
    headers: Object.assign({}, headers, {
      Host: new URL(url).host,
      'X-TC-Action': action,
      'X-TC-Timestamp': String(timestamp),
      'X-TC-Version': version,
    }),
    body: null,
    timeout,
  };

  if (token) config.headers['X-TC-Token'] = token;
  if (region) config.headers['X-TC-Region'] = region;
  if (language) config.headers['X-TC-Language'] = language;

  let form = null;
  let payload = null;

  if (method === 'GET') {
    data = mergeData(data);
    url += `?${qs.stringify(data)}`;
    config.headers['Content-Type'] = 'application/x-www-form-urlencoded';
  }
  if (method === 'POST') {
    payload = data;
    if (multipart) {
      form = new FormData();
      for (const key in data) {
        form.append(key, data[key]);
      }
      config.body = form;
      config.headers = Object.assign({}, config.headers, form.getHeaders());
    } else {
      config.body = JSON.stringify(data);
      config.headers['Content-Type'] = 'application/json';
    }
  }

  const signature = await signV3({
    service,
    method,
    url,
    payload,
    timestamp,
    secretId,
    secretKey,
    multipart,
    boundary: form ? form.getBoundary() : null,
  });
  config.headers.Authorization = signature;
  return await fetch(url, config);
}

function deepRemoveNull(obj: any) {
  if (isArray(obj)) {
    return obj.map(deepRemoveNull);
  }
  if (isObject(obj)) {
    const result = {};
    for (const key in obj) {
      const value = obj[key];
      if (!isNull(value)) {
        result[key] = deepRemoveNull(value);
      }
    }
    return result;
  }
  return obj;
}

function isArray(x: any) {
  return Array.isArray(x);
}

function isNull(x: any) {
  return x === null;
}

function isObject(x: any) {
  return typeof x === 'object' && !isArray(x) && !isNull(x);
}
