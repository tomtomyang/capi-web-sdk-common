export function mergeData(data: any, prefix = '') {
  const res = {} as any;
  for (const key in data) {
    if (data[key] === null || data[key] === undefined) {
      continue;
    }
    if (data[key] instanceof Array || data[key] instanceof Object) {
      Object.assign(res, mergeData(data[key], `${prefix + key}.`));
    } else {
      res[prefix + key] = data[key];
    }
  }
  return res;
}