const fs = require('fs');
const path = require('path');

function ensureAppleTouchIcon(distDir) {
	const srcCandidates = [
		path.join(process.cwd(), 'assets', 'apple-touch-icon.png'),
		path.join(process.cwd(), 'assets', 'icon.png')
	];
	const target = path.join(distDir, 'apple-touch-icon.png');

	for (const candidate of srcCandidates) {
		if (fs.existsSync(candidate)) {
			fs.copyFileSync(candidate, target);
			return true;
		}
	}
	return false;
}

function injectAppleTouchLink(indexHtmlPath) {
	if (!fs.existsSync(indexHtmlPath)) return false;
	const html = fs.readFileSync(indexHtmlPath, 'utf8');
	if (html.includes('rel="apple-touch-icon"')) return true; // already injected

	const linkTag = '\n    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />';
	const updated = html.replace('</head>', `${linkTag}</head>`);
	fs.writeFileSync(indexHtmlPath, updated, 'utf8');
	return true;
}

function run() {
	const distDir = path.join(process.cwd(), 'dist');
	if (!fs.existsSync(distDir)) {
		console.error('dist/ not found. Did the export step run?');
		process.exit(1);
	}

	ensureAppleTouchIcon(distDir);
	injectAppleTouchLink(path.join(distDir, 'index.html'));

	// Android/Chrome PWA manifest and icons
	const manifest = {
		name: 'basic-life-support-2025',
		short_name: 'BLS 2025',
		start_url: '/',
		display: 'standalone',
		background_color: '#ffffff',
		theme_color: '#ffffff',
		icons: [
			{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
			{ src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
		]
	};

	const icon192Src = path.join(process.cwd(), 'assets', 'icon-192.png');
	const icon512Src = path.join(process.cwd(), 'assets', 'icon-512.png');
	const icon192Target = path.join(distDir, 'icon-192.png');
	const icon512Target = path.join(distDir, 'icon-512.png');

	if (fs.existsSync(icon192Src)) {
		fs.copyFileSync(icon192Src, icon192Target);
	}
	if (fs.existsSync(icon512Src)) {
		fs.copyFileSync(icon512Src, icon512Target);
	}

	fs.writeFileSync(
		path.join(distDir, 'manifest.webmanifest'),
		JSON.stringify(manifest, null, 2),
		'utf8'
	);

	const indexPath = path.join(distDir, 'index.html');
	if (fs.existsSync(indexPath)) {
		const html = fs.readFileSync(indexPath, 'utf8');
		if (!html.includes('rel="manifest"')) {
			const link = '\n    <link rel="manifest" href="/manifest.webmanifest" />';
			const updated = html.replace('</head>', `${link}</head>`);
			fs.writeFileSync(indexPath, updated, 'utf8');
		}
	}
}

run();


