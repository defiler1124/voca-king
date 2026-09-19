/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // VOCA KING 브랜드 컬러
        'vk-deepblue': '#1B2A5B',
        'vk-gold': '#FFCA57',
        'vk-accent': '#D32F3F',
        // 레벨별 컬러
        'lv1': '#D32F3F',
        'lv2': '#A84D00',
        'lv3': '#8F6600',
        'lv4': '#00726A',
        'lv5': '#0B8850',
        'lv6': '#6552E0',
        'lv7': '#C22B76',
        'lv8': '#00705F',
        'lv9': '#4433C8',
        'lv10': '#4A5468',
        'lv11': '#B01050',
      },
    },
  },
  plugins: [],
}
