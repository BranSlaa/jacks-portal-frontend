'use client';

import { useNotification } from '@/context/NotificationContext';
import { useCallback } from 'react';

export const useNotifications = () => {
	const { addNotification, removeNotification } = useNotification();

	const showError = useCallback(
		(message: string, duration = 5000) => {
			if (!message) return null;
			return addNotification(message, 'error', duration);
		},
		[addNotification],
	);

	const showSuccess = useCallback(
		(message: string, duration = 5000) => {
			if (!message) return null;
			return addNotification(message, 'success', duration);
		},
		[addNotification],
	);

	const clearNotification = useCallback(
		(id: string | undefined) => {
			if (id) removeNotification(id);
		},
		[removeNotification],
	);

	return {
		showError,
		showSuccess,
		clearNotification,
	};
};
