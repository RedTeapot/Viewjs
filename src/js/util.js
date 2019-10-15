;(function(ctx, name){
	var globalLogger = ctx[name].Logger.globalLogger;

	/**
	 * 设定参数默认值
	 * @param {Object} ops 要设定默认值的目标
	 * @param {Object} dftOps 提供的默认值配置
	 * @param {Boolean} [overrideNull=false] 如果键已经存在且取值为null，是否使用默认值覆盖null值
	 */
	var setDftValue = function(ops, dftOps, overrideNull){
		if(arguments.length < 3)
			overrideNull = false;

		ops = ops || {};
		dftOps = dftOps || {};

		/* 参数不存在时，从默认参数中读取并赋值 */
		for(var p in dftOps)
			if(!(p in ops) || (p in ops && null == ops[p] && overrideNull))
				ops[p] = dftOps[p];

		return ops;
	};

	/**
	 * 为指定的对象附加指定名称的只读的属性
	 * @param {Object} obj 目标对象
	 * @param {String} name 属性名称
	 * @param {*} val 属性取值
	 */
	var defineReadOnlyProperty = function(obj, name, val){
		Object.defineProperty(obj, name, {value: val, configurable: false, writable: false, enumerable: true});
	};

	/**
	 * 尝试调用指定的方法
	 * @param {Function} func 待执行的方法
	 * @param {Object} ctx 方法执行时的this上下文
	 * @param {Arguments} args 方法参数列表对象
	 */
	var try2Apply = function(func, ctx, args){
		if(null == func || typeof func !== "function")
			return;

		try{
			func.apply(ctx, args);
		}catch(e){
			var isError = e instanceof Error || (e != null && typeof e === "object" && "stack" in e);
			var s = "Error occured while executing function: {}. {}" + (isError? " stack:\n{}": "");
			globalLogger.error(s, func.name, e, isError? e.stack: null);
		}
	};

	/**
	 * 尝试调用指定的方法
	 * @param {Function} func 待执行的方法
	 * @param {Object} [ctx] 方法执行时的this上下文
	 * @param {*} args... 方法参数列表
	 */
	var try2Call = function(func, ctx, args){
		if(null == func || typeof func !== "function")
			return undefined;
		
		try{
			var len = arguments.length;

			if(len === 1)
				return func();
			else if(len === 2)
				return func.call(ctx);
			else if(len === 3)
				return func.call(ctx, arguments[2]);
			else if(len === 4)
				return func.call(ctx, arguments[2], arguments[3]);
			else if(len === 5)
				return func.call(ctx, arguments[2], arguments[3], arguments[4]);
			else if(len === 6)
				return func.call(ctx, arguments[2], arguments[3], arguments[4], arguments[5]);
			else if(len === 7)
				return func.call(ctx, arguments[2], arguments[3], arguments[4], arguments[5], arguments[6]);
			else{
				var tmp = "", index = 2;
				for(var i = index; i < arguments.length; i++)
					tmp += ",arguments[" + i + "]";

				var rst;
				eval("rst = func.call(ctx" + tmp + ")");
				return rst;
			}
		}catch(e){
			console.error("Error occured while executing function: " + func.name, e, e.stack);
			return undefined;
		}
	};

	/**
	 * 判断给定的字符串是否是空字符串
	 * @param {String} str 要判断的字符串
	 * @param {Boolean} [trim=false] 是否在判断前执行前后空白符号的裁剪操作
	 */
	var isEmptyString = function(str, trim){
		if(arguments.length < 2)
			trim = false;

		if(null === str || undefined === str)
			return true;

		str = String(str);
		if(trim)
			str = str.trim();

		return str.length === 0;
	};

	/**
	 * 判断给定的对象是否是null或undefined
	 */
	var isNullOrUndefined = function(t){
		return null === t || undefined === t;
	};

	/**
	 * 判断给定的两个字符串是否相同
	 * @param {String} a 字符串1
	 * @param {String} b 字符串2
	 * @param {Boolean} [caseSensitive=true] 是否区分大小写
	 * @param {Boolean} [trim=true] 是否在判断前执行前后空白符号的裁剪操作
	 */
	var ifStringEquals = function(a, b, caseSensitive, trim){
		if(arguments.length < 4)
			trim = true;
		if(arguments.length < 3)
			caseSensitive = true;

		if(isNullOrUndefined(a)){
			if(isNullOrUndefined(b))
				return true;
			return false;
		}else{
			if(isNullOrUndefined(b))
				return false;

			if(trim){
				a = String(a).trim();
				b = String(b).trim();
			}
			if(!caseSensitive){
				a = a.toLowerCase();
				b = b.toLowerCase();
			}

			return a === b;
		}
	};

	/**
	 * 以“不区分大小写”的方式判断给定的两个字符串是否相同
	 * @param {String} a 字符串1
	 * @param {String} b 字符串2
	 * @param {Boolean} [trim=true] 是否在判断前执行前后空白符号的裁剪操作
	 */
	var ifStringEqualsIgnoreCase = function(a, b, trim){
		if(arguments.length < 3)
			trim = true;

		return ifStringEquals(a, b, false, trim);
	};

	/**
	 * 生成随机字符串
	 * @param {String} prefix 前缀
	 */
	var randomString = (function(){
		var alphabet = "0123456789abcdefghijklmnopqrstuvwxyz";

		return function(prefix){
			if(arguments.length < 1)
				prefix = "";
			
			var len = 10;

			var str = "";
			while(len-- > 0){
				var index = Math.floor(Math.random() * alphabet.length);
				str += alphabet.charAt(index);
			}

			return prefix + str;
		};
	})();

	/**
	 * 为给定的字符串进行URI编码
	 */
	var xEncodeURIComponent = function(t){
		return encodeURIComponent(String(t)).replace(/\+/gm, "%2B");
	};

	/**
	 * 获取唯一字符串
	 */
	var getUniqueString = (function(){
		var i = 0;

		return function(){
			var n = Date.now();
			var s = n.toString(36);
			var p = "00" + (i++).toString(36);
			p = p.substring(p.length - 2);

			return (s + p).toUpperCase();
		};
	})();

	/**
	 * 获取元素的运行时样式
	 * @param {HTMLElement} obj 要获取样式的元素
	 * @returns {*}
	 */
	var getComputedStyle = function(obj){
		if(window.getComputedStyle){
			return window.getComputedStyle(obj);
		}else{
			return obj.currentStyle;
		}
	};

	/** 设备环境信息组件 */
	var env = (function() {
		var ua = navigator.userAgent;
		var obj = {};

		var refresh = function(){
			ua = navigator.userAgent;

			obj.isUC = /(?:UCWEB|UCBrowser)/.test(ua);
			obj.isSafari = /(?:Safari)/.test(ua);
			obj.isOpera = /(?:Opera Mini)/.test(ua);
			obj.isTencent = /(?:MQQBrowser|QQ|MicroMessenger)/.test(ua);
			obj.isTencentMiniProgram = obj.isTencent && (/(?:miniprogram)/i.test(ua) || window["__wxjs_environment"] === 'miniprogram');

			obj.isIOS = /(?:Mac OS)/.test(ua);
			obj.isAndroid = /(?:Android)/.test(ua);
			obj.isWindowsPhone = /(?:Windows Phone)/.test(ua);

			obj.isIPad = obj.isIOS && /(?:iPad)/.test(ua);
			obj.isIPhone = obj.isIOS && /(?:iPhone)/.test(ua);

			obj.isTablet = /(?:Tablet|PlayBook)/.test(ua) || obj.isIPad;
			obj.isMobile = (/(?:Mobile)/.test(ua) && !obj.isIPad) || obj.isWindowsPhone;
			obj.isPc = !obj.isMobile && !obj.isTablet;

			obj.isHistoryPushPopSupported = ("pushState" in history) && (typeof history.pushState === "function");

			return obj;
		};

		obj.refresh = refresh;

		refresh();
		return obj;
	})();

	/**
	 * 从给定的字符串中解析参数
	 * @param {String} str 形如：a=1&b=2的字符串
	 * @returns {Object}
	 */
	var parseParams = function(str){
		if(isEmptyString(str, true))
			return null;

		var options = null;
		var kvPairs = str.split(/\s*&\s*/);
		if(0 !== kvPairs.length){
			options = {};
			kvPairs.forEach(function(pair){
				var s = pair.split(/\s*=\s*/);
				options[decodeURIComponent(s[0])] = decodeURIComponent(s[1]);
			});
		}

		return options;
	};

	/**
	 * 移除焦点
	 */
	var blurInputs = function(){
		var inputObjs = document.querySelectorAll("input, select, textarea, *[contentEditable]");
		for(var i = 0; i < inputObjs.length; i++)
			inputObjs[i].blur();
	};

	ctx[name].util = {
		setDftValue: setDftValue,
		defineReadOnlyProperty: defineReadOnlyProperty,
		try2Apply: try2Apply,
		try2Call: try2Call,
		isEmptyString: isEmptyString,
		isNullOrUndefined: isNullOrUndefined,
		ifStringEquals: ifStringEquals,
		ifStringEqualsIgnoreCase: ifStringEqualsIgnoreCase,
		randomString: randomString,
		xEncodeURIComponent: xEncodeURIComponent,
		getUniqueString: getUniqueString,
		getComputedStyle: getComputedStyle,
		parseParams: parseParams,
		blurInputs: blurInputs,

		env: env
	};
})(window, "View");