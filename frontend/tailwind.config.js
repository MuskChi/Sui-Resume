
/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: '#3b82f6', // Keep existing primary
                'web3-dark': '#0f172a',
                'web3-card': '#1e293b',
                'web3-text': '#f8fafc',
                'web3-accent': '#8b5cf6', // Violet
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'hero-pattern': "url('/hero-pattern.svg')",
            }
        },
    },
    plugins: [],
}
