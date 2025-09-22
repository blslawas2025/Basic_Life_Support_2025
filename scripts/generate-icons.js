const fs = require('fs');
const path = require('path');

async function ensureSharp() {
	try {
		require.resolve('sharp');
		return true;
	} catch (e) {
		console.error('Dependency "sharp" is not installed. Please run: npm install --save-dev sharp');
		process.exit(1);
	}
}

async function run() {
	await ensureSharp();
	const sharp = require('sharp');
	const assetsDir = path.join(process.cwd(), 'assets');
	if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir);

	const svgPath = path.join(assetsDir, 'heart.svg');
	if (!fs.existsSync(svgPath)) {
		console.error('Missing assets/heart.svg. Add your SVG icon to proceed.');
		process.exit(1);
	}

	const outputs = [
		{ file: 'apple-touch-icon.png', size: 180 },
		{ file: 'icon-192.png', size: 192 },
		{ file: 'icon-512.png', size: 512 }
	];

	for (const { file, size } of outputs) {
		const outPath = path.join(assetsDir, file);
		await sharp(svgPath)
			.resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
			.png()
			.toFile(outPath);
		console.log(`Generated ${file}`);
	}
}

run().catch((e) => {
	console.error(e);
	process.exit(1);
});


