import { browser } from '$app/environment';

export function createAppState() {
	let isOnline = $state(true);
	let theme = $state('light');
	
	function setOnlineStatus(status: boolean) {
		isOnline = status;
	}

	function toggleTheme() {
		theme = theme === 'light' ? 'dark' : 'light';
	}

	if (browser) {
		window.addEventListener('online', () => setOnlineStatus(true));
		window.addEventListener('offline', () => setOnlineStatus(false));
	}

	return {
		get isOnline() { return isOnline; },
		get theme() { return theme; },
		toggleTheme,
		setOnlineStatus
	};
}

export const appState = createAppState();
