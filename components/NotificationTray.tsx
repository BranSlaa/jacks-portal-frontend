'use client';

import React, { FC } from 'react';
import { useNotification, Notification } from '@/context/NotificationContext';

const NotificationTray: FC = () => {
	const { notifications, removeNotification } = useNotification();

	if (!notifications.length) return null;

	return (
		<div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
			{notifications.map((notification: Notification) => (
				<div
					key={notification.id}
					className={`p-4 rounded-md shadow-md transition-all duration-300 flex justify-between items-start ${
						notification.type === 'error'
							? 'bg-red-50 text-red-800 dark:bg-red-900/90 dark:text-red-200 border border-red-200 dark:border-red-800'
							: 'bg-green-50 text-green-800 dark:bg-green-900/90 dark:text-green-200 border border-green-200 dark:border-green-800'
					}`}
				>
					<p>{notification.message}</p>
					<button
						onClick={() => removeNotification(notification.id)}
						className="ml-4 text-sm opacity-70 hover:opacity-100"
					>
						✕
					</button>
				</div>
			))}
		</div>
	);
};

export default NotificationTray;
