
function renderTab(ctx, key, index) {
	try {
		var el = document.createElement("div");
		el.classList.add("item");

		var img = new Image();
		img.src = "chrome://favicon/" + ctx.tab.url;
		img.classList.add("favicon");
		img.width = "16";
		img.height = "16";

		var title = document.createElement("a");
		title.classList.add("item-title");
		title.href = "#";
		title.title = ctx.tab.url;
		title.innerHTML = ctx.tab.title;
		title.addEventListener('click', function (e) {
			Tabs.restore(key);
			this.remove();
		}, false);

		var timeAgo = document.createElement("span");
		timeAgo.title = (new Date(ctx.lastModified * 1000)).toString();
		timeAgo.classList.add("time-ago");
		timeAgo.innerText = makeTimeAgoText(ctx.lastModified);

		el.appendChild(img);
		el.appendChild(title);
		el.appendChild(timeAgo);
		return el;
	} catch (e) {
		console.log(ctx);
		return document.createElement("div");
	}
}

function renderWindow(ctx, key) {
	var el = document.createElement("details");
	el.classList.add("item");
	// console.log(ctx);
	// ctx.window.tabs.forEach(function (tab) {
	// 	el.appendChild(renderTab(tab));
	// });
	var title = document.createElement("summary");
	title.classList.add("item-title");
	var link = document.createElement("a");
	link.innerHTML = key;
	link.href = "#";
	link.addEventListener('click', function (e) {
		Windows.restore(key);
	}, false);
	title.appendChild(link);

	// TODO: make tabs container

	var timeAgo = document.createElement("span");
	timeAgo.title = (new Date(ctx.lastModified * 1000)).toString();
	timeAgo.classList.add("time-ago");
	timeAgo.innerText = makeTimeAgoText(ctx.lastModified);

	el.appendChild(title);
	el.appendChild(timeAgo);
	return el;
}

function makeTimeAgoText(timestamp) {
	var elapsed;
	var currentTime = Math.floor(Date.now() / 1000);
	var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

	var difference = currentTime - timestamp;
	var hoursDifference = Math.floor(difference / 60 / 60);
	var daysDiff = Math.floor(hoursDifference / 24);
	difference -= hoursDifference * 60 * 60;
	var minutesDifference = Math.floor(difference / 60);
	difference -= minutesDifference * 60;
	var secondsDifference = Math.floor(difference);

	if (hoursDifference < 1 && minutesDifference < 1 && secondsDifference < 60)
		elapsed = secondsDifference + 's';
	else if (hoursDifference < 1)
		elapsed = minutesDifference + 'm';
	else if (hoursDifference < 4)
		elapsed = hoursDifference + 'h ' + minutesDifference + 'm'; 
	else if (hoursDifference < 24)
		elapsed = hoursDifference + 'h';
	else if (daysDiff < 7)
		elapsed = daysDiff + 'd'; 
	else {
		var then = new Date(timestamp*1000);
		var date = then.getDate();
		var month = months[then.getMonth()]
		elapsed = month + " " + date;
	}
	return elapsed;
}

function onTabStoreReady() {
	loadItems(Tabs, renderTab);
}

function onWindowStoreReady() {
	loadItems(Windows, renderWindow);
}

function renderAndAppend(parent, renderer) {
	return function append(item, key) {
		var el = renderer.call(null, item, key);
		parent.appendChild(el);
	};
}

function loadItems(type, renderer) {
	type.el = document.createElement("div");
	type.el.classList.add("list", type.className);
	type.forEach(renderAndAppend(type.el, renderer));
	document.getElementById("recently-closed").appendChild(type.el);
}

window.addEventListener("load", function () {
	// chrome.sessions.MAX_SESSION_RESULTS = 100;
	// chrome.sessions.getRecentlyClosed(function (arr) {
	// 	Tabs.el = document.querySelector("#recently-closed .tabContainer");
	// 	Tabs.tabs = arr;
	// 	Tabs.render();
	// });
	// console.log(Tabs);

}, false);
