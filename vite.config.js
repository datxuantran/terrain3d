import { defineConfig } from "vite";
import virtual from "@rollup/plugin-virtual";

const svgContent = require("!raw-loader!./logo.svg");
console.log("SVG Content:", svgContent);

export default defineConfig({
	plugins: [
		virtual({
			"./logo.svg": `
        export default ${JSON.stringify(svgContent)};
      `,
		}),
	],
});
