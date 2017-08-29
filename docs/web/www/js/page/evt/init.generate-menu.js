var views = [
	"evt_View-beforechange",
	"evt_View-afterchange",
	"evt_View-instance-ready",
	"evt_View-instance-beforeenter",
	"evt_View-instance-enter",
	"evt_View-instance-afterenter",
	"evt_View-instance-leave",
];

;(function(){
	var menuObj = document.createElement("div"),
		navObj = document.createElement("nav"),
		menuItemsObj = document.createElement("div"),
		mskObj = document.createElement("div");

	navObj.innerHTML = '<span data-view-rel = "@doc.html">使用说明</span><span data-view-rel = "@attr.html">DOM属性参考手册</span><span data-view-rel = "@evt.html">事件参考手册</span><span data-view-rel = "@api.html">API</span><span data-view-rel = "@' + window.viewJsNewestZipFile + '">下载View.js(' + window.viewJsNewestVersion + ')</span>';

	menuItemsObj.classList.add("menu-items");
	menuObj.classList.add("viewjs-doc-menu");
	mskObj.style.cssText = "position: absolute; left: 0; top: 0; width: 100%; height: 100%; background: rgba(255, 255, 255, 0.3);";

	menuObj.appendChild(navObj);
	menuObj.appendChild(menuItemsObj);
	document.body.appendChild(mskObj);
	document.body.appendChild(menuObj);

	var show = function(){
		menuObj.style.display = "block";
		mskObj.style.display = "block";
	};

	var hide = function(){
		menuObj.style.display = "none";
		mskObj.style.display = "none";
	};

	var getCorrespondingItemObj = function(target){
		while(true){
			if(null != target && target.classList.contains("item") && String(target.tagName).toLowerCase() == "div")
				return target;

			target = target.parentNode;
			if(null == target || menuObj == target || document.body == target)
				return null;
		}
	};

	View.ready(function(){
		views.forEach(function(viewId, i){
			var view = View.ofId(viewId);

			var itemObj = document.createElement("div");
			itemObj.classList.add("item");
			itemObj.innerHTML = (i + 1) + ". " + view.getTitle();
			itemObj.setAttribute("data-view-rel", view.getId());
			menuItemsObj.appendChild(itemObj);

			var _menuObj = view.find("header .menu");
			if(null != _menuObj)
				Hammer(_menuObj).on("tap", viewJsDocMenu.show);

			var nextBtnObj = view.find(".btn.next");
			if(null != nextBtnObj){
				var targetViewId = views[i + 1];
				if(null != targetViewId)
					nextBtnObj.setAttribute("data-view-rel", targetViewId);
				else{
					nextBtnObj.style.display = "none";
					view.getLayoutAction()();
				}
			}
		});
	});

	View.on("beforechange", hide);
	Hammer(mskObj).on("tap", hide);

	window.viewJsDocMenu = {
		show: show,
		hide: hide,
		menuObj: menuObj
	};
})();