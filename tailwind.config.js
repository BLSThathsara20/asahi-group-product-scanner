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
				"slide-up": "slideUp 0.25s ease-out",
				"slide-down": "slideDown 0.2s ease-in forwards",
				"dropdown-in": "dropdownIn 0.15s ease-out",
				"dropdown-out": "dropdownOut 0.12s ease-in forwards",
				"vibrate": "vibrate 0.5s ease-in-out infinite",
			},
			keyframes: {
				vibrate: {
					"0%, 100%": { transform: "rotate(0deg)" },
					"10%, 30%, 50%, 70%, 90%": { transform: "rotate(-12deg)" },
					"20%, 40%, 60%, 80%": { transform: "rotate(12deg)" },
				},
				slideUp: {
					"0%": { transform: "translateY(100%)", opacity: "0" },
					"100%": { transform: "translateY(0)", opacity: "1" },
				},
				slideDown: {
					"0%": { transform: "translateY(0)", opacity: "1" },
					"100%": { transform: "translateY(100%)", opacity: "0" },
				},
				dropdownIn: {
					"0%": { opacity: "0", transform: "scale(0.96)" },
					"100%": { opacity: "1", transform: "scale(1)" },
				},
				dropdownOut: {
					"0%": { opacity: "1", transform: "scale(1)" },
					"100%": { opacity: "0", transform: "scale(0.96)" },
				},
			},
		},
	},
	plugins: [],
};
