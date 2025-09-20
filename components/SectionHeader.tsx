import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography } from '../styles/theme';

interface SectionHeaderProps {
	title: string;
	iconName: keyof typeof Ionicons.glyphMap;
	gradientColors: string[];
}

export default function SectionHeader({ title, iconName, gradientColors }: SectionHeaderProps) {
	return (
		<View style={styles.container}>
			<LinearGradient colors={gradientColors as any} style={styles.iconWrap}>
				<Ionicons name={iconName as any} size={20} color="#ffffff" />
			</LinearGradient>
			<Text style={styles.title}>{title}</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: spacing.sm,
		paddingVertical: spacing.xs,
	},
	iconWrap: {
		width: 32,
		height: 32,
		borderRadius: 16,
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: spacing.sm,
	},
	title: {
		fontSize: typography.subtitle.base,
		fontWeight: '600',
		color: '#ffffff',
		letterSpacing: 0.3,
		flex: 1,
	},
});

