import CryptoJS from 'crypto-js';

/**
 * Calculate MD5 hash for chunk verification
 * @param chunk - Blob or File chunk to hash
 * @returns Promise<string> - MD5 hash (first 8 characters)
 */
export const calculateMD5Hash = async (chunk: Blob): Promise<string> => {
  try {
    // Convert blob to array buffer then to word array for crypto-js
    const arrayBuffer = await chunk.arrayBuffer();
    const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer);
    const hash = CryptoJS.MD5(wordArray);
    const hashHex = hash.toString(CryptoJS.enc.Hex);
    return hashHex.substring(0, 8); // First 8 characters as requested
  } catch (error) {
    console.warn('MD5 hashing failed, falling back to SHA-256:', error);
    // Fallback to SHA-256 if MD5 fails
    try {
      const buffer = await chunk.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return hashHex.substring(0, 8);
    } catch (sha256Error) {
      console.warn('SHA-256 hashing also failed, using simple checksum:', sha256Error);
      // Final fallback to simple checksum
      const arrayBuffer = await chunk.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let hash = 0;
      for (let i = 0; i < bytes.length; i++) {
        hash = ((hash << 5) - hash + bytes[i]) & 0xffffffff;
      }
      return Math.abs(hash).toString(16).padStart(8, '0');
    }
  }
};

/**
 * Calculate full MD5 hash (for file verification)
 * @param data - Blob, File, or ArrayBuffer to hash
 * @returns Promise<string> - Full MD5 hash
 */
export const calculateFullMD5Hash = async (data: Blob | ArrayBuffer): Promise<string> => {
  try {
    let arrayBuffer: ArrayBuffer;
    
    if (data instanceof ArrayBuffer) {
      arrayBuffer = data;
    } else {
      arrayBuffer = await data.arrayBuffer();
    }
    
    const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer);
    const hash = CryptoJS.MD5(wordArray);
    return hash.toString(CryptoJS.enc.Hex);
  } catch (error) {
    console.error('Full MD5 hashing failed:', error);
    throw new Error('Failed to calculate MD5 hash');
  }
};

/**
 * Verify chunk integrity by comparing hashes
 * @param chunk - The chunk to verify
 * @param expectedHash - The expected hash value
 * @returns Promise<boolean> - True if hashes match
 */
export const verifyChunkHash = async (chunk: Blob, expectedHash: string): Promise<boolean> => {
  try {
    const calculatedHash = await calculateMD5Hash(chunk);
    return calculatedHash === expectedHash;
  } catch (error) {
    console.error('Hash verification failed:', error);
    return false;
  }
};
