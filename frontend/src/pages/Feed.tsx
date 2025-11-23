import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useSuiClient } from '@mysten/dapp-kit';
import { getBlobUrl } from '../utils/walrus';

const REGISTRY_ID = "0xb07d245f4a3754d0c50a2a6a797df9b5edfac76d932930fe6a9b9bd7eac2cd79";

// Rich Mock Data
const MOCK_PROFILES = [
    {
        id: "0x2",
        name: "Vitalik Buterin",
        title: "Co-founder of Ethereum",
        bio: "Researcher and developer. Interested in math, cryptography, and mechanism design.",
        skills: ["Solidity", "Cryptography", "Mechanism Design", "Writing"],
        verified: true,
        avatar: "https://ui-avatars.com/api/?name=Vitalik+Buterin&background=627EEA&color=fff",
        isMock: true
    },
    {
        id: "0x3",
        name: "Satoshi Nakamoto",
        title: "Creator of Bitcoin",
        bio: "A purely peer-to-peer version of electronic cash would allow online payments to be sent directly from one party to another.",
        skills: ["C++", "Cryptography", "Economics", "Privacy"],
        verified: true,
        avatar: "https://ui-avatars.com/api/?name=Satoshi+Nakamoto&background=F7931A&color=fff",
        isMock: true
    },
    {
        id: "0x4",
        name: "Alice Chen",
        title: "Senior Move Developer",
        bio: "Specializing in Sui Move smart contracts and DeFi protocols. Contributor to multiple open source projects.",
        skills: ["Move", "Rust", "DeFi", "Smart Contracts"],
        verified: false,
        avatar: "https://ui-avatars.com/api/?name=Alice+Chen&background=random",
        isMock: true
    },
    {
        id: "0x5",
        name: "Bob Smith",
        title: "Web3 Product Designer",
        bio: "Crafting intuitive user experiences for decentralized applications. Bridging the gap between Web2 and Web3.",
        skills: ["UI/UX", "Figma", "Frontend", "React"],
        verified: false,
        avatar: "https://ui-avatars.com/api/?name=Bob+Smith&background=random",
        isMock: true
    },
    {
        id: "0x6",
        name: "Charlie Lee",
        title: "Blockchain Architect",
        bio: "Designing scalable and secure blockchain infrastructure. Passionate about layer 1 protocols.",
        skills: ["Architecture", "Go", "Distributed Systems"],
        verified: true,
        avatar: "https://ui-avatars.com/api/?name=Charlie+Lee&background=random",
        isMock: true
    }
];

export default function Feed() {
    const suiClient = useSuiClient();
    const [filter, setFilter] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [realProfiles, setRealProfiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfiles = async () => {
            try {
                // 1. Get Registry to find all profile IDs
                const registryObj = await suiClient.getObject({
                    id: REGISTRY_ID,
                    options: { showContent: true }
                });

                if (registryObj.data?.content?.dataType === 'moveObject') {
                    const fields = registryObj.data.content.fields as any;
                    const profileIds = fields.profiles || [];

                    if (profileIds.length > 0) {
                        // 2. Batch fetch all profiles
                        const objects = await suiClient.multiGetObjects({
                            ids: profileIds,
                            options: { showContent: true }
                        });

                        const parsedProfiles = objects.map((obj: any) => {
                            if (obj.data?.content?.dataType === 'moveObject') {
                                const f = obj.data.content.fields as any;
                                console.log("Raw Profile Data:", f);
                                console.log("Avatar Field:", f.avatar);

                                // Resolve Avatar
                                let avatarUrl = '';
                                if (f.avatar.toLowerCase().startsWith('http')) {
                                    avatarUrl = f.avatar;
                                } else {
                                    // Assume it's a Walrus Blob ID
                                    avatarUrl = getBlobUrl(f.avatar);
                                }
                                console.log("Resolved Avatar URL:", avatarUrl);

                                return {
                                    id: obj.data.objectId,
                                    name: f.name,
                                    title: f.title,
                                    bio: f.introduction,
                                    skills: ["Sui User"], // Default skill for real users
                                    verified: true, // On-chain = Verified
                                    avatar: avatarUrl || `https://ui-avatars.com/api/?name=${f.name}&background=random`,
                                    isMock: false
                                };
                            }
                            return null;
                        }).filter(Boolean);

                        setRealProfiles(parsedProfiles);
                    }
                }
            } catch (error) {
                console.error("Error fetching profiles:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfiles();
    }, [suiClient]);

    // Combine and Filter
    const allProfiles = [...realProfiles, ...MOCK_PROFILES];

    const filteredProfiles = allProfiles.filter(profile => {
        // 1. Tag Filter
        if (filter !== 'All') {
            // Simple mapping for mocks, real users default to 'All' or check skills
            const isDev = profile.skills.some((s: string) => ['Solidity', 'Move', 'Rust', 'C++', 'Go', 'Engineering'].includes(s));
            const isDesigner = profile.skills.some((s: string) => ['UI/UX', 'Figma', 'Product'].includes(s));
            const isFounder = profile.skills.some((s: string) => ['Mechanism Design', 'Economics'].includes(s) || profile.title.includes('Founder') || profile.title.includes('Creator'));

            if (filter === 'Developers' && !isDev) return false;
            if (filter === 'Designers' && !isDesigner) return false;
            if (filter === 'Founders' && !isFounder) return false;
        }

        // 2. Search Filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            return (
                profile.name.toLowerCase().includes(term) ||
                profile.title.toLowerCase().includes(term) ||
                profile.bio.toLowerCase().includes(term) ||
                profile.skills.some((s: string) => s.toLowerCase().includes(term))
            );
        }

        return true;
    });

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header Section */}
            <div className="text-center mb-12">
                <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl mb-4">
                    Top Web3 Talent
                </h1>
                <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
                    Discover and connect with the brightest minds in the decentralized ecosystem. Verified on-chain.
                </p>
            </div>

            {/* Search and Filter */}
            <div className="mb-10 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="relative w-full sm:w-96">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition duration-150 ease-in-out"
                        placeholder="Search by name, skill, or role..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto">
                    {['All', 'Developers', 'Designers', 'Founders'].map((tag) => (
                        <button
                            key={tag}
                            onClick={() => setFilter(tag)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${filter === tag
                                ? 'bg-primary text-white'
                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                                }`}
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            </div>

            {/* Profile Grid */}
            {loading ? (
                <div className="text-center py-20 text-gray-500">Loading blockchain data...</div>
            ) : (
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {filteredProfiles.map((profile) => (
                        <Link key={profile.id} to={`/profile/${profile.id}`} className="block group h-full">
                            <div className={`h-full bg-white dark:bg-web3-card rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border ${profile.isMock ? 'border-gray-100 dark:border-gray-700' : 'border-primary/30 dark:border-primary/30'} overflow-hidden flex flex-col transform hover:-translate-y-1`}>
                                <div className="p-6 flex-1">
                                    <div className="flex items-start justify-between mb-4">
                                        <img
                                            src={profile.avatar}
                                            alt={profile.name}
                                            className="h-16 w-16 rounded-full border-2 border-white dark:border-gray-700 shadow-sm object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${profile.name}`;
                                            }}
                                        />
                                        {profile.verified && (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                                Verified
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors mb-1">
                                        {profile.name}
                                    </h3>
                                    <p className="text-sm font-medium text-primary mb-3">{profile.title}</p>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 line-clamp-3">
                                        {profile.bio}
                                    </p>

                                    <div className="flex flex-wrap gap-2 mt-auto">
                                        {profile.skills.map((skill: string) => (
                                            <span key={skill} className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                                    <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                        {profile.id.substring(0, 6)}...{profile.id.substring(profile.id.length - 4)}
                                    </span>
                                    <span className="text-sm font-medium text-primary group-hover:underline">
                                        View Profile &rarr;
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
