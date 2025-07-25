// 测试 TypeScript 问题

// @ts-ignore 滥用
const badCode = undefined.someProperty;

// 类型断言滥用
const forcedType = {} as any as string as number;

// 不安全的类型守卫
function isString(value: unknown): value is string {
  // 错误的类型守卫实现
  return true;
}

// Promise 未处理
async function fetchData() {
  fetch('/api/data'); // 未 await
  
  // 未捕获错误
  const response = await fetch('/api/other');
  const data = await response.json(); // 未检查 response.ok
  return data;
}

// 内存泄漏风险
let cache: any[] = [];
function addToCache(item: any) {
  cache.push(item); // 无限增长
}

// 硬编码的敏感信息
const API_KEY = 'sk-1234567890abcdef'; // 不应硬编码
const PASSWORD = 'admin123'; // 安全风险

export { fetchData, addToCache };