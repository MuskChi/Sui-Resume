// Walrus SDK Implementation
import { WalrusClient } from '@mysten/walrus';

// Getter function for walrus client - lazy initialization to avoid module-level errors
let walrusClientInstance: WalrusClient | null = null;
function getWalrusClient(): WalrusClient {
    if (!walrusClientInstance) {
        walrusClientInstance = new WalrusClient({
            suiRpcUrl: 'https://fullnode.testnet.sui.io:443',
            network: 'testnet',
            wasmUrl: '/walrus_wasm_bg.wasm', // Explicitly point to the WASM file
            uploadRelay: {
                host: 'https://upload.walrus-testnet.walrus.space',
                sendTip: {
                    max: 1000000  // Maximum tip in MIST (0.001 WAL)
                }
            }
        });
    }
    return walrusClientInstance;
}

/**
 * Upload blob to Walrus using the Publisher API (HTTP)
 * Note: We use direct HTTP call because the SDK's upload relay configuration 
 * for testnet is unstable/undocumented, and direct storage node interaction 
 * requires complex resource management.
 * @param content - Content to upload (string or Blob)
 * @returns Blob ID
 */
export async function uploadBlob(content: string | Blob): Promise<string> {
    console.log("Uploading to Walrus using Publisher API...");

    try {
        const PUBLISHER_URL = "https://publisher.walrus-testnet.walrus.space";

        // Prepare body
        let body: string | Blob | ArrayBuffer;
        if (typeof content === 'string') {
            body = content;
        } else {
            body = content;
        }

        // Use direct HTTP upload to Publisher
        // This is the most reliable method for Testnet currently
        const response = await fetch(`${PUBLISHER_URL}/v1/blobs?epochs=100`, {
            method: "PUT",
            body: body,
        });

        if (!response.ok) {
            throw new Error(`Upload failed with status: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        console.log("Walrus Upload Response:", result);

        // The publisher returns { newlyCreated: { blobObject: { blobId: "..." } } } 
        // or { alreadyCertified: { blobId: "..." } }
        let blobId: string;

        if (result.newlyCreated) {
            blobId = result.newlyCreated.blobObject.blobId;
        } else if (result.alreadyCertified) {
            blobId = result.alreadyCertified.blobId;
        } else {
            throw new Error("Unexpected response format from Walrus Publisher");
        }

        return blobId;
    } catch (err) {
        console.error("Walrus Upload Error:", err);
        throw err;
    }
}

/**
 * Read blob from Walrus using the official SDK
 * @param blobId - Blob ID to retrieve
 * @returns Content as string
 */
export async function readBlob(blobId: string): Promise<string> {
    console.log("Reading from Walrus using SDK...", blobId);

    try {
        // Use SDK to read blob - returns Uint8Array directly
        const bytes = await getWalrusClient().readBlob({ blobId });

        // Convert Uint8Array to string
        const text = new TextDecoder().decode(bytes);
        return text;
    } catch (err) {
        console.error("Walrus Read Error:", err);
        throw new Error(`Failed to read blob ${blobId}: ${err}`);
    }
}

/**
 * Get the URL for a blob (for display purposes like images)
 * @param blobId - Blob ID
 * @returns Aggregator URL
 */
export function getBlobUrl(blobId: string): string {
    return `https://aggregator.walrus-testnet.walrus.space/v1/${blobId}`;
}
