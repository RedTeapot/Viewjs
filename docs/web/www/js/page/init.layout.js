;(function(){
	/* 根据屏幕宽度动态调整尺寸大小 */
	document.documentElement.style.fontSize = (function(){
		var ratio = document.documentElement.clientWidth / 320;
		ratio = ratio > 1.3? 1.3: ratio;

		return Math.floor(ratio * 100) + "px";
	})();

	View.layout.setExpectedWidthHeightRatio(320 / 568).init().doLayout();

	View.ready(function(){
		View.listAll().forEach(function(view){
			view.setLayoutAction(function(){
				var totalHeight = View.layout.getLayoutHeight();

				var headerObj = view.find("header"),
					bodyObj = view.find(".body"),
					footerObj = view.find("footer");

				bodyObj.style.height = Math.floor(totalHeight - headerObj.offsetHeight - (null == footerObj? 0: footerObj.offsetHeight)) + "px";
			}, true);
		});
	});
})();

;(function(){
    var bp = document.createElement('script');
    var curProtocol = window.location.protocol.split(':')[0];
	bp.src = (curProtocol.toLowerCase() === 'https') ? 'https://zz.bdstatic.com/linksubmit/push.js': 'http://push.zhanzhang.baidu.com/push.js';
    document.body.appendChild(bp);
})();