# capi-web-sdk-common

## 概述

基于 [tencentcloud-sdk-nodejs](https://github.com/TencentCloud/tencentcloud-sdk-nodejs)，封装 TencentCloud Api Web SDK Common 版本，提供在 Web Standard 环境下的直接请求腾讯云 API 的能力。

## 构建

```bash
npm install

npm run build:esm
npm run build:cjs
```

## 使用

```js
import { CapiClient } from 'capi-web-sdk-common';

const capiEndpoint = 'xxx.tencentcloudapi.com';
const capiVersion = 'xxxx-xx-xx';

const capiConfig = {
  region: 'ap-xxxxx',
  credential: {
    secretId: 'xxxxx',
    secretKey: 'xxxxx',
  },
  profile: {
    signMethod: 'TC3-HMAC-SHA256',
    language: 'en-US',
    httpProfile: {
      reqMethod: 'POST',
      reqTimeout: 30,
    },
  },
};

const capiClient = new CapiClient(capiEndpoint, capiVersion, capiConfig);

const response = await capiClient.request('xxxxx', {});
```