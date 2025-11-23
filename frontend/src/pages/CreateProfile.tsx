import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { getBlobUrl } from '../utils/walrus';

// Replace with actual package ID after deployment
const PACKAGE_ID = "0xa7a9506263a1f291ad914eb010fd3df8bdc461b1eba465f3f88da154c1059e33";
const REGISTRY_ID = "0xb07d245f4a3754d0c50a2a6a797df9b5edfac76d932930fe6a9b9bd7eac2cd79";
const MODULE_NAME = "resume";
const CREATE_PROFILE_FUNC = "create_profile";

export default function CreateProfile() {
    const navigate = useNavigate();
    const suiClient = useSuiClient();
    const { mutate: signAndExecute } = useSignAndExecuteTransaction();
    const [formData, setFormData] = useState({
        name: '',
        title: '',
        introduction: '',
        avatar: '',      // Stores URL or Blob ID
        attachment: ''   // Stores URL or Blob ID
    });
    const [avatarPreview, setAvatarPreview] = useState<string>(''); // For displaying avatar preview
    const [isLoading, setIsLoading] = useState(false);

    // Helper to resolve URL or Blob ID to displayable URL
    const resolveUrl = (input: string) => {
        if (!input) return '';
        if (input.startsWith('http') || input.startsWith('data:')) {
            return input;
        }
        // Use getBlobUrl helper for Walrus Blob IDs
        return getBlobUrl(input);
    };

    // Update avatar preview when user manually enters a URL
    const handleAvatarInputChange = (value: string) => {
        setFormData({ ...formData, avatar: value });
        setAvatarPreview(resolveUrl(value));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const txb = new Transaction();

            txb.moveCall({
                target: `${PACKAGE_ID}::${MODULE_NAME}::${CREATE_PROFILE_FUNC}`,
                arguments: [
                    txb.object(REGISTRY_ID),
                    txb.pure.string(formData.name),
                    txb.pure.string(formData.title),
                    txb.pure.string(formData.introduction),
                    txb.pure.option('string', formData.avatar || null),
                    txb.pure.option('string', formData.attachment || null),
                ],
            });

            // 4. Execute Transaction
            signAndExecute(
                { transaction: txb },
                {
                    onSuccess: async (result) => {
                        console.log('Profile created', result);
                        try {
                            const tx = await suiClient.waitForTransaction({
                                digest: result.digest,
                                options: {
                                    showObjectChanges: true,
                                }
                            });

                            const createdObject = tx.objectChanges?.find(
                                (change: any) => change.type === 'created' && change.objectType.includes('::Resume')
                            );

                            if (createdObject && 'objectId' in createdObject) {
                                alert('Profile created successfully! Redirecting...');
                                navigate(`/profile/${createdObject.objectId}`);
                            } else {
                                // Fallback: just redirect to home or try to find any created object
                                const anyCreated = tx.objectChanges?.find((c: any) => c.type === 'created');
                                if (anyCreated && 'objectId' in anyCreated) {
                                    navigate(`/profile/${anyCreated.objectId}`);
                                } else {
                                    alert('Profile created, but could not find the new profile ID.');
                                }
                            }
                        } catch (e) {
                            console.error("Error waiting for transaction", e);
                            alert('Profile created, but failed to fetch details.');
                        }
                    },
                    onError: (error) => {
                        console.error('Error creating profile', error);
                        alert('Failed to create profile. Please try again.');
                    }
                }
            );

        } catch (error) {
            console.error(error);
            alert('An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto bg-white dark:bg-web3-card p-8 rounded-lg shadow border dark:border-gray-700">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Mint Your Web3 Resume</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name *</label>
                    <input
                        type="text"
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-800 dark:text-white sm:text-sm p-2 border"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Current Role / Title *</label>
                    <input
                        type="text"
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-800 dark:text-white sm:text-sm p-2 border"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Introduction *</label>
                    <textarea
                        required
                        rows={6}
                        placeholder="Introduce yourself..."
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-800 dark:text-white sm:text-sm p-2 border"
                        value={formData.introduction}
                        onChange={(e) => setFormData({ ...formData, introduction: e.target.value })}
                    />
                </div>

                {/* Avatar Input */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Avatar URL or Walrus ID</label>

                    {/* Avatar Preview */}
                    {avatarPreview && (
                        <div className="mt-2 mb-3">
                            <img
                                src={avatarPreview}
                                alt="Avatar Preview"
                                className="h-24 w-24 rounded-full object-cover border-2 border-primary"
                                onError={(e) => {
                                    console.error("Failed to load avatar preview");
                                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=Avatar`;
                                }}
                            />
                        </div>
                    )}

                    <input
                        type="text"
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-800 dark:text-white sm:text-sm p-2 border"
                        placeholder="https://... or Walrus Blob ID"
                        value={formData.avatar}
                        onChange={(e) => handleAvatarInputChange(e.target.value)}
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Enter an HTTPS URL or a Walrus Blob ID.</p>
                </div>

                {/* Attachment Input */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Attachment URL or Walrus ID</label>
                    <input
                        type="text"
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-800 dark:text-white sm:text-sm p-2 border"
                        placeholder="https://... or Walrus Blob ID"
                        value={formData.attachment}
                        onChange={(e) => setFormData({ ...formData, attachment: e.target.value })}
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Enter an HTTPS URL or a Walrus Blob ID.</p>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
                >
                    {isLoading ? 'Minting Resume...' : 'Mint Resume'}
                </button>
            </form>
        </div>
    );
}
