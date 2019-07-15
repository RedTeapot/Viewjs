;(function(){
	var viewId = "page1";
	var view = View.ofId(viewId);

	var showTime = view.context.get("showTime");

	view.on("enter", function(){
		setInterval(showTime, 1000);
		showTime();
	});
})();