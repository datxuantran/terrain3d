// Number of stops in the gradient
const numStops = 1000;

// RGB values for each color stop
const colors = [
	[0, 0, 255], // Blue
	[0, 255, 0], // Green
	[255, 255, 0], // Yellow
	[255, 165, 0], // Orange
	[255, 0, 0], // Red
];

function createGradient(colors, numStops) {
	const gradient = [];
	const colorSegments = colors.length - 1; // Number of segments between stops
	const segmentSize = numStops / colorSegments;

	for (let i = 0; i < numStops; i++) {
		const segmentIndex = Math.floor(i / segmentSize);
		const fraction = (i % segmentSize) / segmentSize;

		const startColor = colors[segmentIndex];
		const endColor = colors[segmentIndex + 1];

		// Interpolate between startColor and endColor
		const r = Math.round(
			startColor[0] + fraction * (endColor[0] - startColor[0])
		);
		const g = Math.round(
			startColor[1] + fraction * (endColor[1] - startColor[1])
		);
		const b = Math.round(
			startColor[2] + fraction * (endColor[2] - startColor[2])
		);

		gradient.push(`rgb(${r},${g},${b})`);
	}
	return gradient;
}

const rainBow = createGradient(colors, numStops);

export default function getColor(stop) {
	return rainBow[Math.floor(stop * numStops)];
}

// // Create div elements for each color in the gradientColors array
// rainBow.forEach((color) => {
// 	const div = document.createElement("div");
// 	div.style.width = "100px"; // Set the width of the colored div
// 	div.style.height = "50px"; // Set the height of the colored div
// 	div.style.backgroundColor = color; // Set the background color
// 	document.body.appendChild(div); // Append the div to the body of the HTML document
// });
