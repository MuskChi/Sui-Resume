// ECIES Encryption using Web Crypto API (P-256)
// In a real production app, we would use a library like 'ecies-25519' or similar,
// but Web Crypto is standard and built-in.

// For this demo, we will generate a keypair for the user on the fly if they don't have one,
// and store it in localStorage. In a real app, this would come from the wallet or a deterministic signature.

export async function getOrCreateKeyPair(): Promise<CryptoKeyPair> {
    const storedKey = localStorage.getItem('sui_link_key');
    if (storedKey) {
        // Import logic would go here, but for simplicity in this demo we regenerate if not in memory
        // Real implementation would serialize/deserialize JWK
    }

    const keyPair = await window.crypto.subtle.generateKey(
        {
            name: "ECDH",
            namedCurve: "P-256",
        },
        true,
        ["deriveKey", "deriveBits"]
    );
    return keyPair;
}

// Export public key to string (for sharing)
export async function exportPublicKey(key: CryptoKey): Promise<string> {
    const exported = await window.crypto.subtle.exportKey("jwk", key);
    return JSON.stringify(exported);
}

export async function importPublicKey(jwkStr: string): Promise<CryptoKey> {
    const jwk = JSON.parse(jwkStr);
    return await window.crypto.subtle.importKey(
        "jwk",
        jwk,
        {
            name: "ECDH",
            namedCurve: "P-256",
        },
        true,
        []
    );
}

export async function encryptMessage(content: string, recipientPublicKeyJwk: string): Promise<string> {
    try {
        const recipientKey = await importPublicKey(recipientPublicKeyJwk);

        // Generate ephemeral key for this message
        const ephemeralKeyPair = await window.crypto.subtle.generateKey(
            { name: "ECDH", namedCurve: "P-256" },
            true,
            ["deriveKey"]
        );

        // Derive shared secret
        const sharedSecret = await window.crypto.subtle.deriveKey(
            { name: "ECDH", public: recipientKey },
            ephemeralKeyPair.privateKey,
            { name: "AES-GCM", length: 256 },
            true,
            ["encrypt"]
        );

        // Encrypt content
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const encoded = new TextEncoder().encode(content);

        const ciphertext = await window.crypto.subtle.encrypt(
            { name: "AES-GCM", iv },
            sharedSecret,
            encoded
        );

        // Pack: Ephemeral Pub Key + IV + Ciphertext
        const ephemeralPub = await exportPublicKey(ephemeralKeyPair.publicKey);

        const payload = {
            ephem: ephemeralPub,
            iv: Array.from(iv),
            data: Array.from(new Uint8Array(ciphertext))
        };

        return "ECIES::" + btoa(JSON.stringify(payload));
    } catch (e) {
        console.error("Encryption failed", e);
        return "ENCRYPTION_FAILED";
    }
}

export async function decryptMessage(encryptedContent: string, privateKey: CryptoKey): Promise<string> {
    if (!encryptedContent.startsWith("ECIES::")) return encryptedContent;

    try {
        const payloadStr = atob(encryptedContent.split("::")[1]);
        const payload = JSON.parse(payloadStr);

        const ephemeralKey = await importPublicKey(payload.ephem);
        const iv = new Uint8Array(payload.iv);
        const data = new Uint8Array(payload.data);

        // Derive shared secret
        const sharedSecret = await window.crypto.subtle.deriveKey(
            { name: "ECDH", public: ephemeralKey },
            privateKey,
            { name: "AES-GCM", length: 256 },
            true,
            ["decrypt"]
        );

        const decrypted = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv },
            sharedSecret,
            data
        );

        return new TextDecoder().decode(decrypted);
    } catch (e) {
        console.error("Decryption failed", e);
        return "DECRYPTION_FAILED";
    }
}
