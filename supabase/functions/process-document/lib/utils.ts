
// 修复栈溢出问题的安全 base64 编码函数
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 8192; // 使用较小的块大小避免栈溢出
  
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.slice(i, i + chunkSize);
    // deno-lint-ignore no-explicit-any
    binary += String.fromCharCode.apply(null, Array.from(chunk) as any[]);
  }
  
  return btoa(binary);
}
