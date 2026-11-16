/**
 * Browser side of the device-key handshake: converts the server's JSON
 * options into what navigator.credentials expects, and the answer back.
 */

type JsonDescriptor = { id: string; type: string; transports?: string[] };

export interface CreationOptionsJSON {
    publicKey: {
        challenge: string;
        user: { id: string; name: string; displayName: string };
        excludeCredentials?: JsonDescriptor[];
        [key: string]: unknown;
    };
}

export interface RequestOptionsJSON {
    publicKey: {
        challenge: string;
        allowCredentials?: JsonDescriptor[];
        [key: string]: unknown;
    };
}

export interface CreatedKey {
    clientDataJSON: string;
    attestationObject: string;
}

export interface SignedChallenge {
    id: string;
    clientDataJSON: string;
    authenticatorData: string;
    signature: string;
}

export function base64UrlToBuffer(value: string): ArrayBuffer {
    let base64 = value.replace(/-/g, '+').replace(/_/g, '/');

    while (base64.length % 4) {
        base64 += '=';
    }

    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }

    return bytes.buffer;
}

export function bufferToBase64Url(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';

    for (const byte of bytes) {
        binary += String.fromCharCode(byte);
    }

    return btoa(binary)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

export type SupportProblem = 'insecure' | 'unsupported' | null;

/** Why this browser can't use device keys, or null when it can. */
export function supportProblem(): SupportProblem {
    if (typeof window === 'undefined') {
        return null;
    }

    if (!window.isSecureContext) {
        return 'insecure';
    }

    if (!window.PublicKeyCredential || !navigator.credentials) {
        return 'unsupported';
    }

    return null;
}

const toDescriptor = (d: JsonDescriptor): PublicKeyCredentialDescriptor => ({
    ...d,
    id: base64UrlToBuffer(d.id),
    type: 'public-key',
    transports: d.transports as AuthenticatorTransport[] | undefined,
});

/** navigator.credentials.create(): makes a new key inside this device. */
export async function createDeviceKey(
    options: CreationOptionsJSON,
): Promise<CreatedKey> {
    const publicKey = {
        ...options.publicKey,
        challenge: base64UrlToBuffer(options.publicKey.challenge),
        user: {
            ...options.publicKey.user,
            id: base64UrlToBuffer(options.publicKey.user.id),
        },
        excludeCredentials: (options.publicKey.excludeCredentials ?? []).map(
            toDescriptor,
        ),
    } as unknown as PublicKeyCredentialCreationOptions;

    const credential = (await navigator.credentials.create({
        publicKey,
    })) as PublicKeyCredential | null;

    if (!credential) {
        throw new DOMException('No key was created.', 'NotAllowedError');
    }

    const response = credential.response as AuthenticatorAttestationResponse;

    return {
        clientDataJSON: bufferToBase64Url(response.clientDataJSON),
        attestationObject: bufferToBase64Url(response.attestationObject),
    };
}

/** navigator.credentials.get(): the device signs the server's challenge. */
export async function signWithDeviceKey(
    options: RequestOptionsJSON,
): Promise<SignedChallenge> {
    const publicKey = {
        ...options.publicKey,
        challenge: base64UrlToBuffer(options.publicKey.challenge),
        allowCredentials: options.publicKey.allowCredentials?.map(toDescriptor),
    } as unknown as PublicKeyCredentialRequestOptions;

    const credential = (await navigator.credentials.get({
        publicKey,
    })) as PublicKeyCredential | null;

    if (!credential) {
        throw new DOMException('No key was used.', 'NotAllowedError');
    }

    const response = credential.response as AuthenticatorAssertionResponse;

    return {
        id: bufferToBase64Url(credential.rawId),
        clientDataJSON: bufferToBase64Url(response.clientDataJSON),
        authenticatorData: bufferToBase64Url(response.authenticatorData),
        signature: bufferToBase64Url(response.signature),
    };
}

export type KeyErrorKind = 'cancelled' | 'exists' | 'security' | 'other';

/**
 * Browsers deliberately don't say whether a key exists, so "no key on this
 * device" and "prompt closed" both arrive as NotAllowedError ("cancelled").
 */
export function keyErrorKind(error: unknown): KeyErrorKind | null {
    if (!(error instanceof DOMException)) {
        return null;
    }

    switch (error.name) {
        case 'NotAllowedError':
        case 'AbortError':
            return 'cancelled';
        case 'InvalidStateError':
            return 'exists';
        case 'SecurityError':
            return 'security';
        default:
            return 'other';
    }
}
