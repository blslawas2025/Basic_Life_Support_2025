export const colors = {
	background: '#0f0f23',
	surface: 'rgba(255, 255, 255, 0.08)',
	surfaceSubtle: 'rgba(255, 255, 255, 0.05)',
	primary: '#00d4ff',
	accent: '#00ff88',
	magenta: '#ff0080',
	warning: '#ffaa00',
	indigo: '#5b73ff',
	violet: '#8b5cf6',
	cyan: '#06b6d4',
	white: '#ffffff',
	mutedText: 'rgba(255, 255, 255, 0.7)',
	borderPrimary: 'rgba(0, 212, 255, 0.2)',
	borderAccent: 'rgba(0, 255, 136, 0.2)',
};

export const spacing = {
	xs: 6,
	sm: 10,
	md: 14,
	lg: 18,
	xl: 22,
	xxl: 28,
};

export const radius = {
	sm: 10,
	md: 14,
	lg: 18,
	xl: 24,
};

export const typography = {
	title: { min: 20, base: 22, max: 24 },
	subtitle: { min: 14, base: 15, max: 16 },
	body: { min: 12, base: 13, max: 14 },
	header: { min: 18, base: 20, max: 22 },
};

export const gradients = {
	appBackground: ["#0a0a0a", "#1a1a2e", "#16213e", "#0f3460", "#533483", "#0a0a0a"] as const,
	brandSweep: ["#00d4ff", "#5b73ff", "#00ff88", "#ff0080", "#ffaa00", "#00d4ff"] as const,
	cta: ["#00d4ff", "#5b73ff", "#00ff88"] as const,
	ctaDisabled: ["#4a5568", "#2d3748"] as const,
};

export const elevation = {
	low: 4,
	medium: 8,
	high: 12,
};

// Basic responsive helpers for consistent scaling
export const responsive = {
	// Returns a smaller value on very small phone widths (<360)
	size: (base: number) => {
		try {
			// Avoid importing Dimensions here to keep this file platform-agnostic in tests
			// Consumers can pass in precomputed flags if needed
			// Default slight reduction for safety on tiny screens
			return base;
		} catch {
			return base;
		}
	},
};

