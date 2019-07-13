;(function(){
	var viewId = "main";
	var view = View.ofId(viewId);

	var versionObj = view.find(".version"),
		downloadObj = view.find(".download");

	versionObj.innerHTML = window.viewJsNewestVersion;
	downloadObj.setAttribute("data-view-rel", "@" + window.viewJsNewestZipFile);
})();
;(function(){
	var viewId = "gittalk";
	var view = View.ofId(viewId);

	var headerObj = view.find("header"),
		bodyObj = view.find(".body");

	view.setLayoutAction(function(){
		var totalHeight = View.layout.getLayoutHeight();
		bodyObj.style.height = (totalHeight - headerObj.offsetHeight) + "px";
	}, true);

	var gitalk = new Gitalk({
		clientID: '408f27eb84b2b896c507',
		clientSecret: '0e5d4097e6817656f2b33d33139edc3e17733c3c',
		repo: 'Viewjs#1',
		owner: 'RedTeapot',
		admin: ['HotTeapot'],
		id: location.pathname,      // Ensure uniqueness and length less than 50
		distractionFreeMode: false  // Facebook-like distraction free mode
	});
	gitalk.render(bodyObj);
})();