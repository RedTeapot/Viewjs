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
		mskObj = document.createElement("div");

	menuObj.classList.add("viewjs-doc-menu");
	mskObj.style.cssText = "position: fixed; left: 0; top: 0; width: 100%; height: 100%; background: rgba(255, 255, 255, 0.3);";

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

	View.on("beforechange", hide);
	Hammer(mskObj).on("tap", hide);

	window.viewJsDocMenu = {
		show: show,
		hide: hide,
		menuObj: menuObj
	};
})();
;(function(){
	View.ready(function(){
		views.forEach(function(viewId, i){
			var view = View.ofId(viewId);

			var itemObj = document.createElement("div");
			itemObj.classList.add("item");
			itemObj.innerHTML = (i + 1) + ". " + view.getTitle();
			itemObj.setAttribute("data-view-rel", view.getId());
			viewJsDocMenu.menuObj.appendChild(itemObj);

			var _menuObj = view.find("header .menu");
			if(null != _menuObj)
				Hammer(_menuObj).on("tap", viewJsDocMenu.show);

			var nextBtnObj = view.find(".btn.next");
			if(null != nextBtnObj){
				var targetViewId = views[i + 1];
				if(null != targetViewId)
					Hammer(nextBtnObj).on("tap", function(){
						View.navTo(targetViewId);
					});
				else{
					nextBtnObj.style.display = "none";
					view.getLayoutAction()();
				}
			}
		});
	});
})();