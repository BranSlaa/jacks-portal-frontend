'use client';

import React, {
	createContext,
	useContext,
	useState,
	useCallback,
	useEffect,
} from 'react';

export type NotificationType = 'error' | 'success';

export interface Notification {
	id: string;
	message: string;
	type: NotificationType;
	duration?: number;
}

interface NotificationContextType {
	notifications: Notification[];
	addNotification: (
		message: string,
		type: NotificationType,
		duration?: number,
	) => void;
	removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
	undefined,
);

export const NotificationProvider = ({
	children,
}: {
	children: React.ReactNode;
}) => {
	const [notifications, setNotifications] = useState<Notification[]>([]);

	const addNotification = useCallback(
		(message: string, type: NotificationType, duration = 5000) => {
			if (!message) return;

			const id = crypto.randomUUID();
			setNotifications(prev => [
				...prev,
				{ id, message, type, duration },
			]);

			return id;
		},
		[],
	);

	const removeNotification = useCallback((id: string) => {
		setNotifications(prev =>
			prev.filter(notification => notification.id !== id),
		);
	}, []);

	useEffect(() => {
		const timers: NodeJS.Timeout[] = [];

		notifications.forEach(notification => {
			if (notification.duration) {
				const timer = setTimeout(() => {
					removeNotification(notification.id);
				}, notification.duration);

				timers.push(timer);
			}
		});

		return () => {
			timers.forEach(timer => clearTimeout(timer));
		};
	}, [notifications, removeNotification]);

	return (
		<NotificationContext.Provider
			value={{ notifications, addNotification, removeNotification }}
		>
			{children}
		</NotificationContext.Provider>
	);
};

export const useNotification = () => {
	const context = useContext(NotificationContext);

	if (context === undefined) {
		throw new Error(
			'useNotification must be used within a NotificationProvider',
		);
	}

	return context;
};
