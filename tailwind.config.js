/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
        "./public/index.html"
    ],
    theme: {
        extend: {
            colors: {
                'device-available': '#10b981',
                'device-rented': '#ef4444',
                'device-rooted': '#f59e0b',
            }
        },
    },
    plugins: [],
}