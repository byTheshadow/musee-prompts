// 本地零知识加密/解密模块
function encryptData(text, password) {
  if (!password) return text;
  return CryptoJS.AES.encrypt(text, password).toString();
}

function decryptData(ciphertext, password) {
  if (!password) return null;
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, password);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    return originalText || null;
  } catch (e) {
    return null;
  }
}
