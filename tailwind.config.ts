import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {},
        fontFamily: {
            body: ["Cascadia Code"],
        },
    },
    daisyui: {
        themes: [
            {
                gruvbox: {
                    primary: "#83a598",
                    secondary: "#8ec07c",
                    accent: "#fabd2f",
                    neutral: "#928374",
                    "base-100": "#282828",
                    "base-200": "#3c3836",
                    "base-300": "#504945",
                    "base-content": "#fbf1c7",
                    info: "#83a598",
                    success: "#b8bb26",
                    warning: "#fabd2f",
                    error: "#fb4934",
                },
            },
        ],
    },
    plugins: [require("daisyui")],
};
export default config;
