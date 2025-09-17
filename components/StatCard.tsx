import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { spacing, radius } from '../styles/theme';
import { useResponsive } from '../utils/responsiveHelpers';

interface StatCardProps {
	iconName: keyof typeof Ionicons.glyphMap;
	iconColor: string;
	value: string | number;
	label: string;
	gradient: [string, string];
}

export default function StatCard({ iconName, iconColor, value, label, gradient }: StatCardProps) {
	const { getResponsiveFontSize, getResponsiveSize } = useResponsive();
	return (
		<View style={styles.card}>
			<LinearGradient colors={gradient} style={styles.gradient}>
				<View style={styles.iconRow}>
					<View style={styles.iconWrap}>
						<Ionicons name={iconName as any} size={getResponsiveSize(18, 20, 22)} color={iconColor} />
					</View>
				</View>
				<Text style={[styles.value, { fontSize: getResponsiveFontSize(18, 20, 22) }]}>{value}</Text>
				<Text style={[styles.label, { fontSize: getResponsiveFontSize(10, 12, 14) }]}>{label}</Text>
			</LinearGradient>
		</View>
	);
}

const styles = StyleSheet.create({
	card: {
		borderRadius: radius.md,
		overflow: 'hidden',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.15,
		shadowRadius: 8,
		elevation: 6,
	},
	gradient: {
		padding: spacing.md,
		alignItems: 'center',
	},
	iconRow: {
		marginBottom: spacing.sm,
		width: '100%',
	},
	iconWrap: {
		alignSelf: 'flex-start',
	},
	value: {
		fontSize: 22,
		fontWeight: '900',
		color: '#ffffff',
		marginBottom: 4,
	},
	label: {
		fontSize: 12,
		fontWeight: '600',
		color: 'rgba(255, 255, 255, 0.8)',
		textAlign: 'center',
	},
});
