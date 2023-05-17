function onTabStoreReady() {
	chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
		if (removeInfo.isWindowClosing) return;
		
		// can no longer access tab details with chrome.tabs.get, so:
		chrome.sessions.getRecentlyClosed({maxResults: 1}, function (arr) {
			console.log(arr[0]);
			Tabs.add(arr[0]);
		});

	});
}

function onWindowStoreReady() {
	chrome.windows.onRemoved.addListener(function (windowId) {
		
		// can no longer access tab details with chrome.tabs.get, so:
		chrome.sessions.getRecentlyClosed({maxResults: 1}, function (arr) {
			console.log(arr[0]);
			Windows.add(arr[0]);
		});

	});
}
