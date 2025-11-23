import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSignAndExecuteTransaction, useSuiClient, useCurrentAccount } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { uploadBlob, getBlobUrl } from '../utils/walrus';

const PACKAGE_ID = "0xa7a9506263a1f291ad914eb010fd3df8bdc461b1eba465f3f88da154c1059e33";
const MODULE_NAME = "resume";
const SEND_MESSAGE_FUNC = "send_message";

export default function ProfileView() {
    const { id } = useParams();
    const suiClient = useSuiClient();
    const currentAccount = useCurrentAccount();
    const { mutate: signAndExecute } = useSignAndExecuteTransaction();

    const [profile, setProfile] = useState<any>(null);
    const [avatarUrl, setAvatarUrl] = useState<string>('');
    const [attachmentUrl, setAttachmentUrl] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [messageContent, setMessageContent] = useState('');
    const [sending, setSending] = useState(false);

    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        name: '',
        title: '',
        introduction: '',
        avatar: '',
        attachment: ''
    });

    useEffect(() => {
        const fetchProfile = async () => {
            if (!id) return;
            try {
                const object = await suiClient.getObject({
                    id,
                    options: { showContent: true }
                });

                if (object.data?.content?.dataType === 'moveObject') {
                    const fields = object.data.content.fields as any;
                    setProfile(fields);

                    // Helper to resolve URL or Blob ID
                    const resolveUrl = (input: string | null) => {
                        if (!input) return '';
                        if (input.startsWith('http') || input.startsWith('data:')) {
                            return input;
                        }
                        // Use getBlobUrl helper for Walrus Blob IDs
                        return getBlobUrl(input);
                    };

                    // Fetch Avatar
                    let avatarInput = '';
                    if (fields.avatar != '') {
                        if (fields.avatar.toLowerCase().startsWith('http')) {
                            avatarInput = fields.avatar;
                        } else {
                            // Assume it's a Walrus Blob ID
                            avatarInput = getBlobUrl(fields.avatar);
                        }

                    }
                    // resolveUrl handles the getBlobUrl call if needed, but let's be explicit here to match Feed.tsx
                    const finalAvatarUrl = avatarInput.toLowerCase().startsWith('http')
                        ? avatarInput
                        : avatarInput
                            ? getBlobUrl(avatarInput)
                            : `https://ui-avatars.com/api/?name=${fields.name}&background=random`;
                    setAvatarUrl(finalAvatarUrl);

                    // Fetch Attachment
                    let attachmentInput = '';
                    if (fields.attachment && typeof fields.attachment === 'object' && 'fields' in fields.attachment) {
                        if (fields.attachment.fields.vec.length > 0) {
                            const val = fields.attachment.fields.vec[0];
                            attachmentInput = typeof val === 'string' ? val : String(val);
                        }
                    }
                    setAttachmentUrl(resolveUrl(attachmentInput));

                    // Initialize edit form
                    setEditForm({
                        name: fields.name,
                        title: fields.title,
                        introduction: fields.introduction,
                        avatar: avatarInput,
                        attachment: attachmentInput
                    });
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [id, suiClient]);

    const handleUpdateProfile = async () => {
        if (!profile || !id) return;

        try {
            const txb = new Transaction();
            const UPDATE_PROFILE_FUNC = "update_profile";

            txb.moveCall({
                target: `${PACKAGE_ID}::${MODULE_NAME}::${UPDATE_PROFILE_FUNC}`,
                arguments: [
                    txb.object(id),
                    txb.pure.string(editForm.name),
                    txb.pure.string(editForm.title),
                    txb.pure.string(editForm.introduction),
                    txb.pure.option('string', editForm.avatar || null),
                    txb.pure.option('string', editForm.attachment || null),
                ],
            });

            signAndExecute(
                { transaction: txb },
                {
                    onSuccess: async () => {
                        alert('Profile updated successfully!');
                        setIsEditing(false);
                        // Reload page to fetch new data (simple way)
                        window.location.reload();
                    },
                    onError: (e: any) => {
                        console.error(e);
                        alert('Failed to update profile');
                    }
                }
            );
        } catch (e) {
            console.error(e);
            alert('Error updating profile');
        }
    };

    const handleSendMessage = async () => {
        if (!profile || !messageContent) return;

        // Check if wallet is connected
        if (!currentAccount) {
            alert('Please connect your wallet first');
            return;
        }

        setSending(true);

        try {
            // Upload to Walrus using Publisher API (no signer needed for testnet publisher)
            const blobId = await uploadBlob(messageContent);

            // 2. Send Transaction
            const txb = new Transaction();
            txb.moveCall({
                target: `${PACKAGE_ID}::${MODULE_NAME}::${SEND_MESSAGE_FUNC}`,
                arguments: [
                    txb.pure.address(profile.owner),
                    txb.pure.string(blobId),
                    txb.pure.bool(false), // isEncrypted = false
                    txb.object('0x6'), // Clock
                ],
            });

            signAndExecute(
                { transaction: txb },
                {
                    onSuccess: () => {
                        alert('Message sent successfully!');
                        setMessageContent('');
                    },
                    onError: (e: any) => {
                        console.error(e);
                        alert('Failed to send message');
                    }
                }
            );

        } catch (e) {
            console.error(e);
            alert('Error sending message');
        } finally {
            setSending(false);
        }
    };

    if (loading) return <div className="text-center mt-10 dark:text-white">Loading profile...</div>;
    if (!profile) return <div className="text-center mt-10 dark:text-white">Profile not found</div>;

    const isOwner = currentAccount?.address === profile.owner;

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            {/* Profile Header */}
            <div className="bg-white dark:bg-web3-card p-8 rounded-lg shadow border dark:border-gray-700 relative">
                {isOwner && (
                    <div className="absolute top-4 right-4">
                        {!isEditing ? (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="text-sm text-primary hover:text-blue-700 font-medium"
                            >
                                Edit Profile
                            </button>
                        ) : (
                            <div className="space-x-2">
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="text-sm text-gray-500 hover:text-gray-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpdateProfile}
                                    className="text-sm text-primary hover:text-blue-700 font-bold"
                                >
                                    Save
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {isEditing ? (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                            <input
                                type="text"
                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-800 dark:text-white sm:text-sm p-2 border"
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                            <input
                                type="text"
                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-800 dark:text-white sm:text-sm p-2 border"
                                value={editForm.title}
                                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Avatar URL or Walrus ID</label>
                            <input
                                type="text"
                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-800 dark:text-white sm:text-sm p-2 border"
                                value={editForm.avatar}
                                onChange={(e) => setEditForm({ ...editForm, avatar: e.target.value })}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center space-x-6">
                        {avatarUrl ? (
                            <img
                                src={avatarUrl}
                                alt="Avatar"
                                className="h-24 w-24 rounded-full object-cover border-2 border-primary"
                                onError={(e) => {
                                    // Fallback if image fails to load (e.g. invalid blob ID)
                                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${profile.name}`;
                                }}
                            />
                        ) : (
                            <div className="h-24 w-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-3xl text-gray-500 dark:text-gray-400">
                                {profile.name ? profile.name.charAt(0) : '?'}
                            </div>
                        )}
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{profile.name}</h2>
                            <p className="text-xl text-primary mt-1">{profile.title}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-mono">{profile.owner}</p>
                            <a
                                href={`https://suiscan.xyz/testnet/object/${id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-gray-400 hover:text-primary mt-1 block font-mono transition-colors"
                            >
                                NFT ID: {id} ↗
                            </a>
                        </div>
                    </div>
                )}

                <div className="mt-8">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Introduction</h3>
                    {isEditing ? (
                        <textarea
                            rows={6}
                            className="mt-2 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-800 dark:text-white sm:text-sm p-2 border"
                            value={editForm.introduction}
                            onChange={(e) => setEditForm({ ...editForm, introduction: e.target.value })}
                        />
                    ) : (
                        <p className="mt-2 text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{profile.introduction}</p>
                    )}
                </div>

                <div className="mt-6">
                    {isEditing ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Attachment URL or Walrus ID</label>
                            <input
                                type="text"
                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-800 dark:text-white sm:text-sm p-2 border"
                                value={editForm.attachment}
                                onChange={(e) => setEditForm({ ...editForm, attachment: e.target.value })}
                            />
                        </div>
                    ) : (
                        attachmentUrl && (
                            <a
                                href={attachmentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                                <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                View Full Resume
                            </a>
                        )
                    )}
                </div>
            </div>

            {/* Message Section */}
            <div className="bg-white dark:bg-web3-card p-8 rounded-lg shadow border dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Contact Candidate</h3>
                <div className="space-y-4">
                    <textarea
                        className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-800 dark:text-white p-2 border"
                        rows={4}
                        placeholder="Write a message..."
                        value={messageContent}
                        onChange={(e) => setMessageContent(e.target.value)}
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={sending || !messageContent}
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
                    >
                        {sending ? 'Sending...' : 'Send Message'}
                    </button>
                </div>
            </div>
        </div>
    );
}
