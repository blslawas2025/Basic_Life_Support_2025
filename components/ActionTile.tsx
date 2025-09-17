import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { spacing, radius } from '../styles/theme';
import { useResponsive } from '../utils/responsiveHelpers';

interface ActionTileProps {
	iconName: keyof typeof Ionicons.glyphMap;
	iconColor: string;
	title: string;
	subtitle: string;
	onPress: () => void;
}

export default function ActionTile({ iconName, iconColor, title, subtitle, onPress }: ActionTileProps) {
	const { getResponsiveFontSize, getResponsiveSize } = useResponsive();
	return (
		<TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
			<LinearGradient colors={["rgba(255, 255, 255, 0.1)", "rgba(255, 255, 255, 0.05)"]} style={styles.gradient}>
				<View style={styles.header}>
					<View style={[styles.iconWrap, { backgroundColor: iconColor + '20', width: getResponsiveSize(32, 36, 40), height: getResponsiveSize(32, 36, 40), borderRadius: getResponsiveSize(16, 18, 20) }]}>
						<Ionicons name={iconName as any} size={getResponsiveSize(18, 20, 22)} color={iconColor} />
					</View>
					<View style={styles.content}>
						<Text style={[styles.title, { fontSize: getResponsiveFontSize(14, 16, 18) }]}>{title}</Text>
						<Text style={[styles.subtitle, { fontSize: getResponsiveFontSize(11, 12, 14), lineHeight: getResponsiveFontSize(14, 16, 18) }]}>{subtitle}</Text>
					</View>
				</View>
				<View style={styles.footer}>
					<Text style={[styles.button, { fontSize: getResponsiveFontSize(12, 14, 16) }]}>Open</Text>
					<Ionicons name="chevron-forward" size={16} color="#ffffff" />
				</View>
			</LinearGradient>
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	card: {
		borderRadius: radius.md,
		borderWidth: 1,
		borderColor: 'rgba(255, 255, 255, 0.1)',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.2,
		shadowRadius: 8,
		elevation: 6,
		marginBottom: spacing.sm,
	},
	gradient: {
		padding: spacing.md,
		borderRadius: radius.md,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: spacing.sm,
	},
	iconWrap: {
		width: 36,
		height: 36,
		borderRadius: 18,
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: spacing.sm,
	},
	content: {
		flex: 1,
	},
	title: {
		fontSize: 16,
		fontWeight: '700',
		color: '#ffffff',
		marginBottom: 2,
	},
	subtitle: {
		fontSize: 12,
		fontWeight: '500',
		color: 'rgba(255, 255, 255, 0.7)',
		lineHeight: 16,
	},
	footer: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	button: {
		fontSize: 14,
		fontWeight: '600',
		color: '#00d4ff',
	},
});
