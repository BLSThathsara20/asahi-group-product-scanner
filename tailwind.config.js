/** @type {import('tailwindcss').Config} */
export default {
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {
			colors: {
				asahi: {
					DEFAULT: "rgb(193 58 42)",
					50: "#fdf3f2",
					100: "#fce6e4",
					200: "#fad2ce",
					300: "#f5b2ab",
					400: "#ed857a",
					500: "#e15f51",
					600: "#c13a2a",
					700: "#a12f22",
					800: "#862b20",
					900: "#702922",
				},
			},
			animation: {
				"spin-slow": "spin 20s linear infinite",
				"slide-up": "slideUp 0.3s ease-out",
			},
			keyframes: {
				slideUp: {
					"0%": { transform: "translateY(100%)", opacity: "0" },
					"100%": { transform: "translateY(0)", opacity: "1" },
				},
			},
		},
	},
	plugins: [],
};
