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

    // Prefer an exact source PNG if provided by the user
    const pngSource = path.join(assetsDir, 'source-icon.png');
    const svgFallback = path.join(assetsDir, 'heart.svg');
    const sourcePath = fs.existsSync(pngSource) ? pngSource : svgFallback;
    if (!fs.existsSync(sourcePath)) {
        console.error('Missing assets/source-icon.png or assets/heart.svg');
        process.exit(1);
    }

    const outputs = [
        { file: 'apple-touch-icon.png', size: 180 },
        { file: 'icon-192.png', size: 192 },
        { file: 'icon-512.png', size: 512 }
    ];

    // Add generous safe-area padding so iOS rounded mask does not clip artwork
    const paddingRatio = 0.00; // 0% outer margin for full-bleed fit

    for (const { file, size } of outputs) {
        const outPath = path.join(assetsDir, file);
        const inner = Math.round(size * (1 - paddingRatio * 2));

        const base = sharp({
            create: {
                width: size,
                height: size,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            }
        }).png();

        const raster = await sharp(sourcePath)
            .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .png()
            .toBuffer();

        await base
            .composite([{ input: raster, left: Math.round(size * paddingRatio), top: Math.round(size * paddingRatio) }])
            .toFile(outPath);
        console.log(`Generated ${file}`);
    }
}

run().catch((e) => {
	console.error(e);
	process.exit(1);
});


