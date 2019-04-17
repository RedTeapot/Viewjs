/**
 * 视图切换动画
 */
;(function(){
	var timer;

	/* 浏览器支持前进后退判断 */
	var historyPushPopSupported = ("pushState" in history) && (typeof history.pushState == "function");
	View.setSwitchAnimation(function(srcElement, tarElement, type, render){
		"hide2left, hide2right, show2left, show2right, fade-in, fade-out".split(/\s*,\s*/).forEach(function(className){
			srcElement.classList.remove(className);
			tarElement.classList.remove(className);
		});

		clearTimeout(timer);
		timer = setTimeout(function(){
			render();

			var isNav = type == View.SWITCHTYPE_VIEWNAV,
				isChange = type == View.SWITCHTYPE_VIEWCHANGE,
				isHistoryBack = type == View.SWITCHTYPE_HISTORYBACK,
				isHistoryForward = type == View.SWITCHTYPE_HISTORYFORWARD;

			if(!historyPushPopSupported || isChange){
				srcElement.classList.add("fade-out");
				tarElement.classList.add("fade-in");
			}else if(isHistoryForward || isNav){
				srcElement.classList.add("hide2left");
				tarElement.classList.add("show2left");
			}else{
				srcElement.classList.add("hide2right");
				tarElement.classList.add("show2right");
			}
		}, 0);
	});
})();