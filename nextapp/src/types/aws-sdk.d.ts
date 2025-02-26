declare module '@aws-sdk/signature-v4' {
  export interface SignatureV4Init {
    credentials: {
      accessKeyId: string;
      secretAccessKey: string;
      sessionToken?: string;
    };
    region: string;
    service: string;
    sha256: any;
    uriEscapePath?: boolean;
    applyChecksum?: boolean;
  }

  export interface SignableRequest {
    method: string;
    hostname: string;
    path?: string;
    query?: Record<string, string>;
    headers?: Record<string, string | string[]>;
    body?: string;
  }

  export interface SignedRequest {
    headers: Record<string, string | string[]>;
    body?: string;
  }

  export class SignatureV4 {
    constructor(options: SignatureV4Init);
    sign(request: SignableRequest): Promise<SignedRequest>;
  }
}

declare module '@aws-crypto/sha256-browser' {
  export class Sha256 {
    static hash(message: string | Uint8Array): Promise<Uint8Array>;
    static digest(message: string | Uint8Array): Promise<Uint8Array>;
  }
}

declare module '@aws-sdk/types' {
  export type HeaderBag = Record<string, string | string[]>;
} 