const toggleDarkMode = () => {
	const darkModeEnabled = !(localStorage.getItem('darkMode') === 'true');
	localStorage.setItem('darkMode', darkModeEnabled);
	document.documentElement.setAttribute('class', darkModeEnabled ? 'dark-mode' : '');
}
