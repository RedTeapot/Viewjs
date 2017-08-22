;(function(){
	var menuObj = document.createElement("div"),
		mskObj = document.createElement("div");

	mskObj.style.cssText = "position: fixed; left: 0; top: 0; width: 100%; height: 100%; background: rgba(255, 255, 255, 0.3);";

	document.body.appendChild(mskObj);
	document.body.appendChild(menuObj);

	var views = [
		"doc_what-is-viewjs",
		"doc_how-to-use",
		"doc_application",
		"doc_what-is-viewport",
		"doc_default-viewport",
		"doc_active-viewport",
		"doc_pseudo-viewport",
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
	View.ready(function(){
		menuObj.classList.add("viewjs-doc-menu");
		views.forEach(function(viewId, i){
			var view = View.ofId(viewId);

			var itemObj = document.createElement("div");
			itemObj.classList.add("item");
			itemObj.innerHTML = (i + 1) + ". " + view.getTitle();
			itemObj.setAttribute("data-view-rel", view.getId());
			menuObj.appendChild(itemObj);

			var _menuObj = view.find("header .menu");
			if(null != _menuObj)
				Hammer(_menuObj).on("tap", show);
		});
	});

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
	};
})();