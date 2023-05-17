
var Tabs = (function () {

	var tabStore = new IDBStore({
		dbVersion: 1,
		storeName: 'tabs',
		storePrefix: 'RescueTab-',
		keyPath: 'id',
		autoIncrement: true,
		onStoreReady: onTabStoreReady,
		onError: function (err) {
			throw err;
		}
	});

	function Tabs() {
		this.tabs = [];
		this.el = null;
		this.className = "tabs";
	}

	Tabs.prototype.restore = function (key) {
		tabStore.get(key, function (ctx) {
			chrome.sessions.restore(ctx.tab.sessionId);
		}, function (err) {
			throw err;
		});

		tabStore.remove(key);
	};

	Tabs.prototype.add = function (tab) {
		tabStore.put(tab, function (id) {
			// console.log("Inserted '" + id + "' into the tabStore");
		}, function (err) { throw err; });
	};

	Tabs.prototype.forEach = function (iterator, ctx) {
		var ctx = ctx || window;
		var index = 0;
		tabStore.iterate(function (tab, cursor, trans) {
			if (tab === null) return;
			iterator.call(ctx, tab, cursor.key, index++);
		}, {order: "DESC"});
	};

	return new Tabs();

})();

var Windows = (function () {

	var windowStore = new IDBStore({
		dbVersion: 1,
		storeName: 'windows',
		storePrefix: 'RescueTab-',
		keyPath: 'id',
		autoIncrement: true,
		onStoreReady: onWindowStoreReady,
		onError: function (err) {
			throw err;
		}
	});

	function Windows() {
		this.windows = [];
		this.el = null;
		this.className = "windows";
	}

	Windows.prototype.add = function (win) {
		windowStore.put(win, function (id) {
			// console.log("Inserted '" + id + "' into the windowStore");
		}, function (err) { throw err; });
	};

	Windows.prototype.restore = function (key) {
		windowStore.get(key, function (win) {
			chrome.sessions.restore(win.sessionId);
		}, function (err) {
			throw err;
		});

		windowStore.remove(key);
	};

	Windows.prototype.forEach = function (iterator, ctx) {
		ctx = ctx || window;
		windowStore.iterate(function (win, cursor, trans) {
			if (win === null) return;
			iterator.call(ctx, win, cursor.key);
		}, {order: "DESC"});
	};

	return new Windows();

})();
