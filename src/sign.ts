type SignV3Props = {
  service: string;
  url: string;
  method: 'GET' | 'POST';
  payload: any;
  timestamp: number;
  secretId: string;
  secretKey: string;
  multipart: boolean;
  boundary: any;
};

const signMethodMap = {
  HmacSHA1: 'SHA-1',
  HmacSHA256: 'SHA-256',
};

export async function sign(secretKey: string, signStr: string, signMethod: 'HmacSHA1' | 'HmacSHA256'): Promise<string> {
  if (signMethodMap?.[signMethod]) {
    const encoder = new TextEncoder();
    const algorithm = { name: 'HMAC', hash: signMethodMap[signMethod] };

    const signKey = await crypto.subtle.importKey('raw', encoder.encode(secretKey), algorithm, false, [
      'sign',
      'verify',
    ]);
    const signature = await crypto.subtle.sign(algorithm.name, signKey, encoder.encode(signStr));
    const hashString = String.fromCharCode(...new Uint8Array(signature));
    const hmac = btoa(hashString);

    return hmac;
  }
  throw new Error('signMethod error!');
}

export async function signV3({
  service,
  method,
  url,
  payload,
  timestamp,
  secretId,
  secretKey,
  multipart,
  boundary,
}: SignV3Props) {
  const urlObj = new URL(url);

  let signedHeaders = '';
  let headers = '';

  if (method === 'GET') {
    signedHeaders = 'content-type';
    headers = 'content-type:application/x-www-form-urlencoded\n';
  }
  if (method === 'POST') {
    signedHeaders = 'content-type';
    if (multipart) {
      headers = `content-type:multipart/form-data; boundary=${boundary}\n`;
    } else {
      headers = 'content-type:application/json\n';
    }
  }

  signedHeaders += ';host';
  headers += `host:${urlObj.hostname}\n`;

  const path = urlObj.pathname;
  const queryString = urlObj.search.slice(1);

  let payloadHash = null;

  /**
   * TODO: multipart not support, crypto.subtle.digest do not support incremental updates
   * issue: https://github.com/w3c/webcrypto/issues/73
   * jssha: https://github.com/Caligatio/jsSHA
   */
  if (method === 'POST' && multipart) {
    /**
      const hash = crypto.createHash('sha256');
      hash.update(`--${boundary}`);
      for (const key in payload) {
        const content = payload[key];
        if (Buffer.isBuffer(content)) {
          hash.update(
            `\r\nContent-Disposition: form-data; name="${key}"\r\nContent-Type: application/octet-stream\r\n\r\n`,
          );
          hash.update(content);
          hash.update('\r\n');
        } else if (typeof content === 'string') {
          hash.update(`\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n`);
          hash.update(`${content}\r\n`);
        }
        if (typeof content === 'string') {
          hash.update(`\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n`);
          hash.update(`${content}\r\n`);
        }
        hash.update(`--${boundary}`);
      }
      hash.update('--\r\n');
      payloadHash = hash.digest('hex');
    */
  } else {
    const payloadStr = payload ? JSON.stringify(payload) : '';
    payloadHash = await getHashSHA256(payloadStr, 'hex');
  }

  const date = getDate(timestamp);
  const formatString = [method, path, queryString, headers, signedHeaders, payloadHash].join('\n');
  const formatStringHash = await getHashSHA256(formatString, 'hex');

  const stringToSign = ['TC3-HMAC-SHA256', timestamp, `${date}/${service}/tc3_request`, formatStringHash].join('\n');

  const secretDate = await getHmacSHA256(date, `TC3${secretKey}`);
  const secretService = await getHmacSHA256(service, secretDate);
  const secretSigning = await getHmacSHA256('tc3_request', secretService);
  const signature = await getHmacSHA256(stringToSign, secretSigning, 'hex');

  return `TC3-HMAC-SHA256 Credential=${secretId}/${date}/${service}/tc3_request, SignedHeaders=${signedHeaders}, Signature=${signature}`;
}

async function getHmacSHA256(str: string, secretKey: string | ArrayBuffer, encoding?: string) {
  const encoder = new TextEncoder();
  const algorithm = { name: 'HMAC', hash: 'SHA-256' };

  const resKey = await crypto.subtle.importKey(
    'raw',
    typeof secretKey === 'string' ? encoder.encode(secretKey) : secretKey,
    algorithm,
    false,
    ['sign', 'verify'],
  );
  const resSignature = await crypto.subtle.sign(algorithm.name, resKey, encoder.encode(str));

  if (encoding === 'hex') {
    const resHashArray = Array.from(new Uint8Array(resSignature));
    const resHex = resHashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    return resHex;
  }

  return resSignature;
}

async function getHashSHA256(str: string | ArrayBuffer, encoding?: string) {
  const encoder = new TextEncoder();
  const hash = 'SHA-256';

  const resDigest = await crypto.subtle.digest(hash, typeof str === 'string' ? encoder.encode(str) : str);

  if (encoding === 'hex') {
    const resHashArray = Array.from(new Uint8Array(resDigest));
    const resHex = resHashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    return resHex;
  }

  return resDigest;
}

function getDate(timestamp: number) {
  const date = new Date(timestamp * 1000);
  const year = date.getUTCFullYear();
  const month = `0${date.getUTCMonth() + 1}`.slice(-2);
  const day = `0${date.getUTCDate()}`.slice(-2);
  return `${year}-${month}-${day}`;
}
