;(function(){
	var menuObj = document.createElement("div"),
		mskObj = document.createElement("div");

	mskObj.style.cssText = "position: fixed; left: 0; top: 0; width: 100%; height: 100%; background: transparent;";

	document.body.appendChild(mskObj);
	document.body.appendChild(menuObj);

	View.ready(function(){
		var views = View.listAll();
		menuObj.classList.add("viewjs-doc-menu");
		views.forEach(function(view){
			var itemObj = document.createElement("div");
			itemObj.classList.add("item");
			itemObj.innerHTML = view.getTitle();
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