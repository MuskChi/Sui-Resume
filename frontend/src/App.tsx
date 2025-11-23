import { Routes, Route, Link } from 'react-router-dom';
import { ConnectButton } from '@mysten/dapp-kit';
import CreateProfile from './pages/CreateProfile';
import ProfileView from './pages/ProfileView';
import Feed from './pages/Feed';
import ThemeToggle from './components/ThemeToggle';

export default function App() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-web3-dark transition-colors duration-200">
            <nav className="bg-white dark:bg-web3-card shadow-sm border-b dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <Link to="/" className="flex-shrink-0 flex items-center">
                                <span className="text-2xl font-bold text-primary bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">SuiResume</span>
                            </Link>
                            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                                <Link to="/" className="border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 hover:text-gray-700 dark:hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                    Home
                                </Link>
                                <Link to="/create" className="border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 hover:text-gray-700 dark:hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                    Mint Resume
                                </Link>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <ThemeToggle />
                            <ConnectButton />
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <Routes>
                    <Route path="/" element={
                        <div className="text-center mt-10 px-4">
                            <h1 className="text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight sm:text-6xl mb-6">
                                <span className="block">Web3 Decentralized</span>
                                <span className="block text-primary bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">Resume Platform</span>
                            </h1>
                            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500 dark:text-gray-400">
                                SuiResume is the premier Web3 Decentralized Resume Platform.
                                Mint your resume as a dynamic NFT, store your data on Walrus, and own your professional history.
                                No gatekeepers, just you and your reputation.
                            </p>
                            <div className="mt-10 flex justify-center gap-6">
                                <Link to="/create" className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-full shadow-lg text-white bg-primary hover:bg-blue-700 transform hover:scale-105 transition-all duration-200">
                                    Start Now - Mint Resume
                                </Link>
                                <Link to="/feed" className="inline-flex items-center px-8 py-4 border border-gray-300 dark:border-gray-600 text-lg font-medium rounded-full shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transform hover:scale-105 transition-all duration-200">
                                    Explore Talent
                                </Link>
                            </div>

                            <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-3">
                                <div className="p-6 bg-white dark:bg-web3-card rounded-xl shadow-md">
                                    <div className="text-4xl mb-4">💎</div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">NFT Resume</h3>
                                    <p className="text-gray-500 dark:text-gray-400">Your profile is a true digital asset. Verifiable, portable, and owned by you.</p>
                                </div>
                                <div className="p-6 bg-white dark:bg-web3-card rounded-xl shadow-md">
                                    <div className="text-4xl mb-4">🗄️</div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Walrus Storage</h3>
                                    <p className="text-gray-500 dark:text-gray-400">Decentralized storage for your avatars and attachments. Unstoppable data.</p>
                                </div>
                                <div className="p-6 bg-white dark:bg-web3-card rounded-xl shadow-md">
                                    <div className="text-4xl mb-4">🔒</div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Privacy First</h3>
                                    <p className="text-gray-500 dark:text-gray-400">End-to-end control over your data. Connect and communicate securely.</p>
                                </div>
                            </div>
                        </div>
                    } />
                    <Route path="/create" element={<CreateProfile />} />
                    <Route path="/feed" element={<Feed />} />
                    <Route path="/profile/:id" element={<ProfileView />} />
                </Routes>
            </main>
        </div>
    );
}
