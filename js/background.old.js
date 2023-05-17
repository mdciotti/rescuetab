
// init may be defined later
window.addEventListener("load", function () { init(); }, false);


function getCurrentTab(callback) {
    chrome.tabs.query(
        { currentWindow: true, active: true },
        function (array) { callback(array[0]); }
    );
}

var settings = {};

// Replace HTML tags < >
function quote(s) {
  var s1 = s;
  s1 = s1.replace(new RegExp("<", "g"), "&lt;");
  s1 = s1.replace(new RegExp(">", "g"), "&gt;");
  return s1;
}

function setTabEntry(uid, tabId) {
	var now = (new Date()).getTime();
	var tab = JSON.parse(localStorage["tab-" + tabId]);

	localStorage.setItem("ClosedTab-"+ uid, JSON.stringify({
		id: tabId,
		timestamp: now,
		url: tab.url,
		index: tab.index,
		title: tab.title,
		incognito: tab.incognito
	}));
}

function testURL(url) {
	var validProtocols = /^(http:|https:|ftp:|file:)/;
	return url && validProtocols.test(url)
}

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
	// var insertThis = tab.url + "%%" + tab.index + "%%";
	// insertThis += tab.title != null ? quote(tab.title) : tab.url
	// insertThis += tab.incognito ? "%%1" : "%%0";
	// localStorage["TabList-" + tabId] = insertThis;
	if (testURL(tab.url)) {
		localStorage.setItem("tab-" + tabId, JSON.stringify({
			url: tab.url,
			index: tab.index,
			title: escapeText(tab.title),
			incognito: tab.incognito
		}));
	}
});

chrome.tabs.onRemoved.addListener(function (tabId, info)  {
	// Should we record this tab?
	// var splitValue = localStorage["TabList-" + tabId].split("%%");
	var closedTabURL = JSON.parse(localStorage["tab-" + tabId]).url;

	if (testURL(closedTabURL)) {
		// Check if tab already exists in the list
		var exists = -1;
		for (var i = parseInt(localStorage["uidCounter"]) - 1; i >= 0; i--) {
			if (localStorage.hasOwnProperty("ClosedTab-" + i)) {
				// var split = localStorage["ClosedTab-" + i].split("%%");
				var tab_i = JSON.parse(localStorage["ClosedTab-" + i]);
				if (tab_i.url === closedTabURL)
					exists = i;
				break;
			}
		}
		// var now = (new Date()).getTime();
		if (exists != -1) {
			// Update old closed tab
			// localStorage["ClosedTab-"+exists] = tabId + "%%" + now + "%%" + localStorage["TabList-"+tabId];
			setTabEntry(exists.toString(), tabId);
		} else {
			setTabEntry(localStorage["uidCounter"], tabId);
			var uidCounter = parseInt(localStorage["uidCounter"]) + 1;
			localStorage["uidCounter"] = uidCounter.toString();

			// Delete tabs that exceed maximum tab limit
			var limit = chrome.extension.getBackgroundPage().settings.tabLimit;
			if (parseInt(localStorage["closedTabCount"]) >= limit) {
				for (i = parseInt(localStorage["minimumTabInc"]); i < uidCounter; i++) {
					if (localStorage.hasOwnProperty("ClosedTab-" + i)) {
						localStorage["minimumTabInc"] = i.toString();
						localStorage.removeItem("ClosedTab-" + i);
						break;
					}
				}
			} else {
				localStorage["closedTabCount"] = (parseInt(localStorage["closedTabCount"]) + 1).toString();
			}
			setBadgeText();
		}
	}
	localStorage.removeItem("tab-" + tabId);
});


/*

chrome.tabs.onCreated.addListener(function(tab) {
	console.log("created: " + tab.id + " | " + tab.index + " | " + tab.url + " | " + tab.status)
});

chrome.tabs.onUpdated.addListener(function(tabId, info, tab) {
	console.log("updated: " + tab.id + " | " + tab.index + " | " + info.url)
});

chrome.tabs.onRemoved.addListener(function(tabId) {
	console.log("removed: " + tabId)
	chrome.tabs.get(tabId, function(tab) {
		console.log(tab.index);
	})
});


chrome.tabs.onAttached.addListener(function(tabId, info) {
	console.log("attached: " + tabId)
});

chrome.tabs.onDetached.addListener(function(tabId, info) {
	console.log("detached: " + tabId)
});

chrome.tabs.onMoved.addListener(function(tabId, info) {
	console.log("moved: " + tabId)
});

*/
