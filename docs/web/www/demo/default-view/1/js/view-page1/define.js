;(function(){
	var viewId = "page1";
	var view = View.ofId(viewId);

	var h1Obj = view.find("h1");

	var showTime = function(){
		h1Obj.innerHTML = new Date().toString();
	};

	view.context.set("showTime", showTime);
})();