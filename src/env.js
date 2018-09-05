;(function(ctx, name){
	/** 设备环境信息组件 */
	var env = (function() {
		var ua = navigator.userAgent,

			isQB = /(?:MQQBrowser|QQ)/.test(ua),
			isUC = /(?:UCWEB|UCBrowser)/.test(ua),
			isSafari = /(?:Safari)/.test(ua),
			isOpera= /(?:Opera Mini)/.test(ua),

			isIOS = /(?:Mac OS)/.test(ua),
			isAndroid = /(?:Android)/.test(ua),
			isWindowsPhone = /(?:Windows Phone)/.test(ua),

			isIPad = isIOS && /(?:iPad)/.test(ua),
			isIPhone = isIOS && /(?:iPhone)/.test(ua),

			isTablet = /(?:Tablet|PlayBook)/.test(ua) || isIPad,
			isMobile = (/(?:Mobile)/.test(ua) && !isIPad) || isWindowsPhone,
			isPc = !isMobile && !isTablet;

		return {
			isQB: isQB,
			isUC: isUC,
			isSafari: isSafari,
			isOpera: isOpera,

			isIOS: isIOS,
			isAndroid: isAndroid,
			isWindowsPhone: isWindowsPhone,

			isIPad: isIPad,
			isIPhone: isIPhone,

			isTablet: isTablet,
			isMobile: isMobile,
			isPc: isPc
		};
	})();


	ctx[name].env = env;
})(window, "View");