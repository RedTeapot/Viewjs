;(function(){
	var viewId = "main";
	var view = View.ofId(viewId);

	var versionObj = view.find(".version"),
		downloadObj = view.find(".download");

	versionObj.innerHTML = window.viewJsNewestVersion;
	downloadObj.setAttribute("data-view-rel", "@" + window.viewJsNewestZipFile);
})();