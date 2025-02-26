declare module 'crypto-js' {
  interface WordArray {
    words: number[];
    sigBytes: number;
    toString(encoder?: any): string;
    concat(wordArray: WordArray): WordArray;
    clamp(): void;
  }

  interface Encoder {
    parse(str: string): WordArray;
    stringify(wordArray: WordArray): string;
  }

  interface EncoderStatic {
    Hex: Encoder;
    Latin1: Encoder;
    Utf8: Encoder;
    Base64: Encoder;
  }

  interface LibStatic {
    WordArray: {
      create: (words?: number[] | WordArray, sigBytes?: number) => WordArray;
    };
  }

  export function SHA256(message: string | WordArray): WordArray;
  export function HmacSHA256(message: string | WordArray, key: string | WordArray): WordArray;
  
  export const lib: LibStatic;
  export const enc: EncoderStatic;
} 