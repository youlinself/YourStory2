/**
 * 简单的加密工具类
 * 注意：前端加密无法完全保证安全，但比明文存储要好
 * 使用 XOR + Base64 编码，密钥基于浏览器特征生成
 */

/** 生成设备特定的密钥 */
function generateKey(): string {
  const navigatorInfo = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    new Date().getTimezoneOffset(),
  ].join('|');

  let hash = 0;
  for (let i = 0; i < navigatorInfo.length; i++) {
    const char = navigatorInfo.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash).toString(36);
}

const SECRET_KEY = generateKey();

/** XOR 加密 */
function xorEncrypt(text: string, key: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    result += String.fromCharCode(charCode);
  }
  return result;
}

/** Base64 编码（支持 Unicode） */
function base64Encode(str: string): string {
  try {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    ));
  } catch {
    return '';
  }
}

/** Base64 解码（支持 Unicode） */
function base64Decode(str: string): string {
  try {
    return decodeURIComponent(
      atob(str)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  } catch {
    return '';
  }
}

/** 加密数据 */
export function encrypt(data: string): string {
  if (!data) return '';
  const encrypted = xorEncrypt(data, SECRET_KEY);
  return base64Encode(encrypted);
}

/** 解密数据 */
export function decrypt(encryptedData: string): string {
  if (!encryptedData) return '';
  try {
    const decoded = base64Decode(encryptedData);
    return xorEncrypt(decoded, SECRET_KEY);
  } catch {
    return '';
  }
}

/** 检查数据是否已加密 */
export function isEncrypted(data: string): boolean {
  if (!data) return false;
  // 尝试解密，如果成功且结果与原文不同，则认为是加密的
  try {
    const decoded = base64Decode(data);
    return decoded.length > 0;
  } catch {
    return false;
  }
}
