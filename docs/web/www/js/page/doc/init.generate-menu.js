var views = [
	"doc_what-is-viewjs",
	"doc_how-to-use",
	"doc_application",
	"doc_what-is-viewport",
	"doc_default-viewport",
	"doc_active-viewport",
	"doc_pseudo-viewport",
	"doc_viewport-group",
	"doc_event-drive",
	"doc_os-detect",
	"doc_logger-output",
	"doc_viewport-configuration",
	"doc_viewport-context",
	"doc_viewjs-initializer",
	"doc_viewport-layout",
	"doc_viewport-title",
	"doc_viewport-directly-accessible",
	"doc_fallback-viewport",
	"doc_viewport-navigation",
	"doc_identify-browser-action",
	"doc_viewport-parameter",
	"doc_viewport-option",
	"doc_viewport-animation",
	"doc_query-element",
	"doc_notice",
	"doc_license",
	"doc_best-practise",
	"doc_contact-me",
	"doc_faq",
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