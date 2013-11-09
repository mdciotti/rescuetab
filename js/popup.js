
var settings = chrome.extension.getBackgroundPage().settings,
	currentPage = 0,
	keyPressTimer,
	filterRegEx;

var TabList = function (container) {
	this.tabs = {};
	this.container = container;
	return this;
};

TabList.prototype.add = function (uid, tab) {
	this.tabs["Tab-" + uid] = tab;
	this.render();
	return this;
};
TabList.prototype.getTab = function (uid) {
	return JSON.parse(localStorage["ClosedTab-" + uid]);
};
TabList.prototype.populate = function (begin, amount) {
	this.enumerate(function (uid) {
		this.add(uid, this.getTab(uid));
	}, begin, amount);
	return this;
};
TabList.prototype.find = function (search) {
	var matches = {};

	this.enumerate(function (uid) {
		var tab = this.getTab(uid);
		for (key in search) {
			if (search.hasOwnProperty(key)) {
				if (tab.hasOwnProperty(key)) {
					if (tab[key] === search[key]) {
						matches["Tab-" + uid] = tab;
						break;
					}
				}
			}
		}
	});
	return matches;
};
TabList.prototype.remove = function (tabId) {
	delete this.tabs["Tab-" + tabId];
	return this;
};
TabList.prototype.clear = function () {
	this.tabs = {};
	return this;
};
TabList.prototype.enumerate = function (callback, min_limit, amount) {
	var min_limit = typeof min_limit == "undefined" ? parseInt(localStorage["minimumTabInc"]) : min_limit;
	var max_limit = parseInt(localStorage["uidCounter"]);

	for (var uid = max_limit - 1, n = 0; uid >= min_limit && n < amount; uid--, n++) {
		if (localStorage.hasOwnProperty("ClosedTab-" + uid)) {
			callback.call(this, uid);
		}
	}
	return this;
};
TabList.prototype.render = function (tabs, page) {
	tabs = tabs || this.tabs;
	page = typeof page == "undefined" ? 0 : page;

	var count = parseInt(localStorage["closedTabCount"]);
	var tabContainer = this.container;

	// Clear list
	while (tabContainer.firstChild) {
		tabContainer.removeChild(tabContainer.firstChild);
	}

	var frag = document.createDocumentFragment();

	for (key in tabs) {
		if (tabs.hasOwnProperty(key)) {

			var tab = tabs[key];

			var link = document.createElement('a');
			link.href = "#";
			link.title = tab.url;
			link.addEventListener('click', item_click, false);

			var img = new Image();
			img.src = "chrome://favicon/" + tab.url;
			img.width = "16";
			img.height = "16";

			var linkTitle = document.createElement("span");
			linkTitle.className = "linkTitle";
			linkTitle.innerHTML = tab.title;

			var timeAgo = document.createElement("span");
			timeAgo.className = "timeAgo";
			timeAgo.innerText = makeTimeAgoText(tab.timestamp);

			link.appendChild(img);
			link.appendChild(linkTitle);
			link.appendChild(timeAgo);
			frag.appendChild(link);
		}
	}

	tabContainer.appendChild(frag);

	return this;
};
TabList.prototype.search = function (str) {
	str = str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
	str = stripVowelAccent(str);

	if (str.length == 0) this.render(null, 0);
	else this.render(this.find(str.toLowerCase().split(" ")), 0);

	return this;
};

function makeTimeAgoText(timestamp) {
	var timeTextz;
	var currentTime = (new Date()).getTime();

	var difference = currentTime - timestamp; 
	var hoursDifference = Math.floor(difference/1000/60/60); 
	difference = difference - hoursDifference*1000*60*60 
	var minutesDifference = Math.floor(difference/1000/60); 
	difference = difference - minutesDifference*1000*60 
	var secondsDifference = Math.floor(difference/1000); 

	if (hoursDifference < 1 && minutesDifference < 1 && secondsDifference < 60)
		timeTextz = secondsDifference + 's'; 
	else if (hoursDifference < 1)
		timeTextz = minutesDifference + 'm'; 
	else if (hoursDifference < 4)
		timeTextz = hoursDifference + 'h ' + minutesDifference + 'm'; 
	else if (hoursDifference < 24)
		timeTextz = hoursDifference + 'h'; 
	else {
		var daysDiff = Math.floor(hoursDifference / 24);
		timeTextz = daysDiff + 'd'; 
	}
	return timeTextz;
}

// Throttle function from underscore.js
function throttle(func, wait) {
	var context, args, timeout, result;
	var previous = 0;
	var later = function () {
		previous = new Date;
		timeout = null;
		result = func.apply(context, args);
	};
	return function () {
		var now = new Date;
		var remaining = wait - (now - previous);
		context = this;
		args = arguments;
		if (remaining <= 0) {
			clearTimeout(timeout);
			timeout = null;
			previous = now;
			result = func.apply(context, args);
		} else if (!timeout) {
			timeout = setTimeout(later, remaining);
		}
		return result;
	};
}

window.addEventListener('load', function () {

	// loadText();
	var tabContainer = document.querySelector("#recentlyClosed .tabContainer");

	tabList = new TabList(tabContainer);
	tabList.populate(0, 20);
	tabList.render();

	tabContainer.addEventListener('scroll', throttle(function () {
		var bottom = tabContainer.scrollTop + tabContainer.offsetHeight;
		console.log(bottom, tabContainer.scrollHeight);
		if (bottom >= tabContainer.scrollHeight - 32) {
			// tabList.clear();
			console.log("Loading...");
			tabList.populate(tabList.tabs.length, 10).render();;
		}
	}, 100), false);

	document.getElementById("delete").addEventListener("click", deleteTabs, false);
	document.getElementById("open").addEventListener("click", openTabs, false);
	document.getElementById("prev").addEventListener("click", previousPage, false);
	document.getElementById("next").addEventListener("click", nextPage, false);
	document.getElementById("opts").addEventListener("click", showOptions, false);
	document.getElementById("options").addEventListener("click", function (e) {
		if (e.target.id == "options") hideOptions();
	}, false);

	document.getElementById("search").addEventListener("keyup", function (e) {
		if (this.value == "") return;
		// console.log(e.keyCode);
		window.clearTimeout(keyPressTimer);
		keyPressTimer = window.setTimeout(searchFor, 200, this.value);
	}, false);
	document.getElementById("search").addEventListener("search", function (e) {
		// console.log(this.value);
		searchFor(this.value);
	}, false);

	// Options
	// document.getElementById("save").addEventListener("click", options_save, false);
	document.getElementById("clear").addEventListener("click", resetData, false);

	document.getElementById('tabLimit').addEventListener('change', function (event) {
		var curve = 5 + Math.floor((Math.pow(event.target.value, 5) / Math.pow(600, 5)) * 99994);
		document.getElementById('tabLimit-value').textContent = curve.toString();
		settings.tabLimit = curve;
		store_settings();
	}, false);

	document.getElementById('tabsPerPage').addEventListener('change', function (event) {
		document.getElementById('tabsPerPage-value').textContent = event.target.value;
		store_settings();
	}, false);
	document.getElementById('showBadge').addEventListener('change', function (event) {
		settings.showBadge = this.checked;
		setBadgeText();
		store_settings();
	});
	document.getElementById('saveHistory').addEventListener('change', function (event) {
		settings.saveHistory = this.checked;
		store_settings();
	});
	document.getElementById('tabsPerPage').addEventListener('change', function (event) {
		settings.tabsPerPage = parseInt(document.getElementById("tabsPerPage").value);
		store_settings();
	});

	options_loadState();

}, false);

function showOptions() {
	options_loadState();
	setState(document.getElementById("options"), "visible", true);
}
function hideOptions() {
	setState(document.getElementById("options"), "visible", false);
}

function options_loadState() {
	document.getElementById("showBadge").checked = settings.showBadge;
	document.getElementById("saveHistory").checked = settings.saveHistory;

	var limitValue = document.getElementById('tabLimit-value');
	// document.getElementById('tabLimit').value = NaN;
	limitValue.textContent = settings.tabLimit;

	var tabsPerPage = document.getElementById('tabsPerPage-value');
	document.getElementById('tabsPerPage').value = tabsPerPage.textContent = settings.tabsPerPage;
}

function store_settings() {
	localStorage["settings"] = JSON.stringify(settings);
	localStorage["minimumTabInc"] = 0;
	chrome.extension.getBackgroundPage().settings = settings;
}

// function trigger(element, eventType) {
// 	event = document.createEvent("HTMLEvents");
// 	event.initEvent(eventType, true, true);
// 	element.dispatchEvent(event)
// }

function item_click(e) {
	if (e.button == 1) {
		e.preventDefault();
		e.stopPropagation();
	}
	reopenClosedTab(id, e.button != 1);
	// loadText();
}

function createLink(id, url) {
	var link = document.createElement('a');
	link.href = "#";
	link.title = url;
	link.addEventListener('click', function (e) {
		if (e.button == 1) {
			e.preventDefault();
			e.stopPropagation();
		}
		reopenClosedTab(id, e.button != 1);
		loadText();
	}, false);
	return link;
}

function setState(el, state, value) {
	var hasClass = el.classList.contains(state);

	if (value) {
		if (!hasClass)
			el.classList.add(state);
	} else {
		if (hasClass)
			el.classList.remove(state);
	}
}

function loadText(filterStrings) {
	var n = parseInt(localStorage["closedTabCount"]);
	filterStrings = filterStrings || [];

	var closedTabs = document.querySelector("#recentlyClosed .tabContainer");
	closedTabs.innerHTML = "";

	var isSearch = filterStrings.length > 0;
	// setState(document.getElementById("delete"), "visible", isSearch);
	document.getElementById("open").disabled = !isSearch;
	document.getElementById("delete").disabled = !isSearch;
	setState(document.getElementById("prev"), "visible", !isSearch && n > 0);
	setState(document.getElementById("next"), "visible", !isSearch && n > 0);
	
	if (n > 0) displayPopup(filterStrings);
	setState(document.querySelector("#recentlyClosed .tabContainer"), "empty", n == 0);
}

function displayPopup(filterStrings) {
	filterStrings = filterStrings || [];

	var items_to_display = filterStrings.length > 0 ? 1000 : settings.tabsPerPage;

	nowtime = new Date();
	currentTime = nowtime.getTime();

	var min_limit = parseInt(localStorage["minimumTabInc"]);

	for (var j = 0, uid = parseInt(localStorage["uidCounter"]) - 1; uid >= 0 && j < currentPage * items_to_display; uid--) {
		if (localStorage.hasOwnProperty("ClosedTab-" + uid)) j++;
	}

	for (j = 0; uid >= min_limit && j < items_to_display; uid--) {
		if (localStorage.hasOwnProperty("ClosedTab-" + uid)) {
			var closedTabTitle = JSON.parse(localStorage["ClosedTab-" + uid]).title;
			var closedTabURL = JSON.parse(localStorage["ClosedTab-" + uid]).url;
			if (filterStrings.length > 0)
				var hasMatch = closedTabTitle.multiFind(filterStrings) || closedTabURL.multiFind(filterStrings);
			else
				var hasMatch = false;

			if (filterStrings.length == 0 || filterStrings.length > 0 && hasMatch) {
				displayTabEntry(uid, filterStrings);
				j++;
			}
		}
	}

	if (filterStrings.length == 0) {
		setState(document.getElementById("prev"), "visible", currentPage > 0);

		var hasMorePages = parseInt(localStorage["closedTabCount"]) > (currentPage + 1) * settings.tabsPerPage;
		setState(document.getElementById("next"), "visible", hasMorePages);

	} else {
		setState(document.querySelector("#recentlyClosed .tabContainer"), "noresults", j == 0);
	}
}

function displayTabEntry(id, filterStrings) {
	filterStrings = filterStrings || [];

	var tab = getClosedTab(id);

	var text_link = createLink(id, tab.url);

	var img = new Image();
	img.src = "chrome://favicon/" + tab.url;
	img.width = "16";
	img.height = "16";

	if (filterStrings.length > 0)
		tab.title = tab.title.markMatches(filterStrings);
	
	var linkTitle = document.createElement("span");
	linkTitle.innerHTML = tab.title;
	linkTitle.className = "linkTitle";

	var timeAgo = document.createElement("span");
	timeAgo.className = "timeAgo";
	timeAgo.innerText = makeTimeAgoText(tab.timestamp);
	
	text_link.appendChild(img);
	text_link.appendChild(linkTitle);
	text_link.appendChild(timeAgo);
	document.querySelector("#recentlyClosed .tabContainer").appendChild(text_link);
}

function searchFor(string) {
	// string = string.replace(/(\%)/g, "%25");
	string = string.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
	string = stripVowelAccent(string);

	// if ((filterStrings==null && string=="") || (filterStrings!=null && string==filterStrings.join(" "))) return;
	// if (string.length == 0) return;

	currentPage = 0;

	if (string == "") loadText();
	else loadText(string.toLowerCase().split(" "));
}

function nextPage() {
	if (parseInt(localStorage["closedTabCount"]) > (currentPage + 1) * settings.tabsPerPage) {
		currentPage++;
		loadText();
	}
}

function previousPage() {
	if (currentPage > 0) {
		currentPage--;
		loadText();
	}
}

// function clearTabs() {
// 	var searchBox = document.getElementById("search");
// 	if (searchBox.value != "") {
// 		searchBox.value = "";
// 	} else {
// 		resetData();
// 		window.close();
// 	}
// }

function openTabs () {
	if (document.getElementById("open").disabled) return;
	var searchBox = document.getElementById("search");
	var filterStrings = searchBox.value.split(" ");
	if (filterStrings.length == 0) return;
	for (var id = parseInt(localStorage["uidCounter"]) - 1; id >= 0; id--) {
		if (existsAndHasMatch(id, filterStrings))
			reopenClosedTab(id, false);
	}
	window.close();
	// loadText();
	// // setMinUID();
	// searchBox.value = "";
}

function deleteTabs() {
	if (document.getElementById("delete").disabled) return;
	var searchBox = document.getElementById("search");
	var filterStrings = searchBox.value.split(" ");
	if (filterStrings.length == 0) return;
	for (var id = parseInt(localStorage["uidCounter"]) - 1; id >= 0; id--) {
		if (existsAndHasMatch(id, filterStrings))
			removeClosedTab(id);
	}
	loadText();
	// setMinUID();
	searchBox.value = "";
	// setBadgeText();
}

function existsAndHasMatch(uid, filterStrings) {
	if (localStorage.hasOwnProperty("ClosedTab-" + uid)) {
		var tab = JSON.parse(localStorage["ClosedTab-" + uid]);
		return tab.title.multiFind(filterStrings) || tab.url.multiFind(filterStrings);
	} else {
		return false;
	}
}

function stripVowelAccent(str) {
	var rExps = [
		/[\xC0-\xC2]/g, /[\xE0-\xE2]/g,
		/[\xC8-\xCA]/g, /[\xE8-\xEB]/g,
		/[\xCC-\xCE]/g, /[\xEC-\xEE]/g,
		/[\xD2-\xD4]/g, /[\xF2-\xF4]/g,
		/[\xD9-\xDB]/g, /[\xF9-\xFB]/g
	];

	var repChar = ['A','a','E','e','I','i','O','o','U','u'];

	for (var i = 0, n = rExps.length; i < n; i++)
		str = str.replace(rExps[i], repChar[i]);

	return str;
}

String.prototype.multiFind = function (strings) {
	var str = this, i;
	str = stripVowelAccent(str);
	str = str.toLowerCase();
	var foundAmount = 0;
	for (i = 0; i < strings.length; i++) {
		if (str.indexOf(strings[i]) != -1) foundAmount++;
	}
	return (foundAmount == strings.length);
};
String.prototype.markMatches = function (strings) {
	var str_real = this, i;
	var str = str_real;
	str = stripVowelAccent(str);
	str = str.toLowerCase();
	var position = -1;
	for (i = 0; i < strings.length; i++ ) {
		position = str.indexOf(strings[i]);
		if (position != -1) {
			str_real = str_real.substr(0, position) + "<mark>" + str_real.substr(position, strings[i].length) + "</mark>" + str_real.substr(position + strings[i].length); 
			str = stripVowelAccent(str_real).toLowerCase();
		}
		//str = str.replace(new RegExp('(' + strings[i] + ')','gi'), replaceBy);
	}
	return str_real;
};
