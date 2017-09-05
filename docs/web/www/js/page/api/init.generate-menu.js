var views = [
	"api_View-ofId",
	"api_View-ifExists",
	"api_View-listAll",
	"api_View-listAllGroups",
	"api_View-setAsDefault",
	"api_View-isDirectlyAccessible",
	"api_View-setIsDirectlyAccessible",
	"api_View-getActiveView",
	"api_View-getDefaultView",
	"api_View-setSwitchAnimation",
	"api_View-getSwitchAnimation",
	"api_View-getActiveViewOptions",
	"api_View-hasActiveViewOption",
	"api_View-getActiveViewOption",
	"api_View-implIsPortrait",
	"api_View-navTo",
	"api_View-changeTo",
	"api_View-back",
	"api_View-forward",
	"api_View-setDocumentTitle",
	"api_View-onceHistoryBack",
	"api_View-beforeInit",
	"api_View-ready",
	"api_View-setInitializer",
	"api_View-on",
	"api_View-off",
	"api_View-fire",
	"api_View-attrs",
	"api_View-instance-on",
	"api_View-instance-off",
	"api_View-instance-fire",
	"api_View-instance-getLatestEventData",
	"api_View-instance-getContext",
	"api_View-instance-clearContext",
	"api_View-instance-getId",
	"api_View-instance-getDomElement",
	"api_View-instance-find",
	"api_View-instance-findAll",
	"api_View-instance-setLayoutAction",
	"api_View-instance-getLayoutAction",
	"api_View-instance-hasParameter",
	"api_View-instance-getParameter",
	"api_View-instance-seekParameter",
	"api_View-instance-isReady",
	"api_View-instance-isActive",
	"api_View-instance-isDefault",
	"api_View-instance-isDirectlyAccessible",
	"api_View-instance-setAsDirectlyAccessible",
	"api_View-instance-setTitle",
	"api_View-instance-getTitle",
	"api_View-instance-setFallbackViewId",
	"api_View-instance-getFallbackView",
	"api_View-instance-attrs",
	"api_ViewConfigurationSet-instance-has",
	"api_ViewConfigurationSet-instance-get",
	"api_ViewConfigurationSet-instance-applyAll",
	"api_ViewConfigurationSet-instance-listAll",
	"api_ViewConfiguration-instance-getName",
	"api_ViewConfiguration-instance-getValue",
	"api_ViewConfiguration-instance-setValue",
	"api_ViewConfiguration-instance-getApplication",
	"api_ViewConfiguration-instance-setApplication",
	"api_ViewConfiguration-instance-apply",
	"api_ViewConfiguration-instance-reflectToDom",
	"api_ViewContext-instance-has",
	"api_ViewContext-instance-set",
	"api_ViewContext-instance-get",
	"api_ViewContext-instance-remove",
	"api_ViewContext-instance-clear",
	"api_Logger-ofName",
	"api_Logger-isGloballyEnabled",
	"api_Logger-setIsGloballyEnabled",
	"api_Logger-instance-isEnabled",
	"api_Logger-instance-setIsEnabled",
	"api_Logger-instance-getName",
	"api_Logger-instance-debug",
	"api_Logger-instance-info",
	"api_Logger-instance-warn",
	"api_Logger-instance-error",
	"api_Logger-instance-log",
	"api_layout-getLayoutWidth",
	"api_layout-getLayoutHeight",
	"api_layout-getBrowserWidth",
	"api_layout-getBrowserHeight",
	"api_layout-isLayoutPortrait",
	"api_layout-isLayoutLandscape",
	"api_layout-isBrowserPortrait",
	"api_layout-isBrowserLandscape",
	"api_layout-getLayoutWidthHeightRatio",
	"api_layout-getBrowserWidthHeightRatio",
	"api_layout-getExpectedWidthHeightRatio",
	"api_layout-setExpectedWidthHeightRatio",
	"api_layout-init",
	"api_layout-doLayout",
	"api_layout-addLayoutChangeListener",
	"api_layout-removeLayoutChangeListener",
];

;(function(){
	var menuObj = document.createElement("div"),
		navObj = document.createElement("nav"),
		menuItemsObj = document.createElement("div"),
		mskObj = document.createElement("div");

	navObj.innerHTML = '<span data-view-rel = "@doc.html">使用说明</span><span data-view-rel = "@attr.html">DOM属性参考手册</span><span data-view-rel = "@evt.html">事件参考手册</span><span data-view-rel = "@api.html">API</span><span data-view-rel = "@' + window.viewJsNewestZipFile + '">下载View.js(' + window.viewJsNewestVersion + ')</span>';

	menuItemsObj.classList.add("menu-items");
	menuObj.classList.add("viewjs-doc-menu");
	mskObj.style.cssText = "z-index: 2; position: absolute; left: 0; top: 0; width: 100%; height: 100%; background: rgba(255, 255, 255, 0.3);";

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