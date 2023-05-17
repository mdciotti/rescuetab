
var default_settings = {
	showBadge: true,
	saveHistory: true,
	tabLimit: 1000,
	tabsPerPage: 20
};

function escapeText(txt) {
	return txt.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function getClosedTab(id) {
	return JSON.parse(localStorage.getItem("ClosedTab-" + id));
}

function removeClosedTab(id) {
	localStorage.removeItem("ClosedTab-" + id);
	localStorage["closedTabCount"] = parseInt(localStorage["closedTabCount"]) - 1;
	setBadgeText();
}

function reopenClosedTab(id, closeWindow) { 
	var tab = getClosedTab(id);
	removeClosedTab(id);

	chrome.tabs.create({"url": tab.url, "index": tab.index, "selected": closeWindow});  

	if (closeWindow) window.close();
}

function setBadgeText() {
	var n = localStorage["closedTabCount"];
	if (settings.showBadge && parseInt(n) > 0)
		chrome.browserAction.setBadgeText({text: n});
	else
		chrome.browserAction.setBadgeText({text: ""});
}

function setMinUID() {
	var regex = /^ClosedTab/;
	var minUID = 1E99;
	var oneOrMoreMatches = false;

	for (key in localStorage) {
		if (localStorage.hasOwnProperty(key)) {
			if (regex.test(key)) {
				var uid = parseInt(key.substr(key.indexOf("-")));
				minUID = Math.min(uid, minUID);
				oneOrMoreMatches = oneOrMoreMatches || true;
			}
		}
	}
	localStorage.setItem("uidCounter", (oneOrMoreMatches ? minUID : 0).toString());
}

function init() {
	var allowClearing = true;

	if (!localStorage.hasOwnProperty("settings")) {
		localStorage.setItem("settings", JSON.stringify(default_settings));
		localStorage.setItem("minimumTabInc", "0");
		localStorage.setItem("uidCounter", "0");
		localStorage.setItem("closedTabCount", "0");
		allowClearing = false;
	}
	settings = JSON.parse(localStorage["settings"]);
	chrome.extension.getBackgroundPage().settings = settings;

	if (allowClearing && !settings.saveHistory) resetData();
	else setBadgeText();
}

function resetData() {
	localStorage.clear();

	localStorage.setItem("minimumTabInc", "0");
	localStorage.setItem("uidCounter", "0");
	localStorage.setItem("closedTabCount", "0");
	localStorage.setItem("settings", JSON.stringify(chrome.extension.getBackgroundPage().settings));

	setBadgeText();
}
