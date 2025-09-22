const fs = require('fs');
const path = require('path');

async function run() {
	const svgPath = path.join(process.cwd(), 'assets', 'heart.svg');
	const outPath = path.join(process.cwd(), 'assets', 'source-icon.png');
	// If a precise PNG already exists, do not overwrite it
	if (fs.existsSync(outPath)) {
		console.log('assets/source-icon.png exists, skipping generation from SVG');
		return;
	}
	if (!fs.existsSync(svgPath)) {
		console.error('Missing assets/heart.svg');
		process.exit(1);
	}
	const sharp = require('sharp');
	await sharp(svgPath)
		.resize(1024, 1024, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
		.png()
		.toFile(outPath);
	console.log('Created assets/source-icon.png');
}

run().catch((e) => {
	console.error(e);
	process.exit(1);
});


