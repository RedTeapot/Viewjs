/**
 * View.js v1.6.2
 * author: Billy, wmjhappy_ok@126.com
 * license: MIT
 *
 * -- 2019-12-17 15:30
 */
;(function(ctx, name){
	if(name in ctx){
		console.error("Plugin name: 'View' has already been used");
		return;
	}

	ctx[name] = {};
})(window, "View");
;(function(ctx, name){
	/**
	 * @constructor
	 *
	 * 事件
	 * @param type {String} 事件类型（名称）
	 * @param data {*} 需要传递至监听器的数据
	 */
	var Event = function(type, data){
		this.type = type;
		this.timestamp = new Date().getTime();
		this.data = data;

		Object.freeze && Object.freeze(this);
	};

	/**
	 * 为指定的对象添加事件驱动机制
	 * @param {Object} obj 要添加事件驱动机制的对象
	 * @param {Object} ctx 监听器触发时的this上下文
	 */
	var eventDrive = function(obj, ctx){
		/* 所有事件处理器。key为事件类型字符串（全小写），value为对应添加的事件处理器数组 */
		var eventHandlers = {};

		var build = function(type){
			eventHandlers[type] = eventHandlers[type] || [];
		};

		/**
		 * 添加事件监听器
		 * @param {String} type 事件类型。可以同时传入多个类型，多个类型之间使用英文半角逗号分隔
		 * @param {Function} handler 事件处理器
		 */
		obj.on = function(type, handler){
			var types = String(type).replace(/(\s*,){2,}/, ",").toLowerCase().split(/\s*,\s*/);
			types.forEach(function(_type){
				build(_type);
				if(eventHandlers[_type].indexOf(handler) !== -1)
					return;

				/* 加入列表 */
				eventHandlers[_type].push(handler);
			});
		};

		/**
		 * 移除事件监听器
		 * @param {String} type 事件类型。可以同时传入多个类型，多个类型之间使用英文半角逗号分隔
		 * @param {Function} handler 事件处理器
		 */
		obj.off = function(type, handler){
			var types = String(type).replace(/(\s*,){2,}/, ",").toLowerCase().split(/\s*,\s*/);
			types.forEach(function(_type){
				build(_type);
				var index = eventHandlers[_type].indexOf(handler);
				if(index === -1)
					return;

				/* 加入列表 */
				eventHandlers[_type].splice(index, 1);
			});
		};

		/**
		 * 触发事件
		 * @param {String} type 事件类型。可以同时传入多个类型，多个类型之间使用英文半角逗号分隔
		 * @param data {*} 附加的数据。亦即，需要传递至监听器的数据
		 * @param [async=true] {Boolean} 是否以异步的方式执行处理器
		 */
		obj.fire = function(type, data, async){
			if(arguments.length < 3)
				async = true;

			var types = String(type).replace(/(\s*,){2,}/, ",").toLowerCase().split(/\s*,\s*/);
			types.forEach(function(_type){
				/* 创建事件 */
				var event = new Event(_type, data);

				/* 触发监听器 */
				var t = function(){
					build(_type);
					for(var i = 0; i < eventHandlers[_type].length; i++){
						var handler = eventHandlers[_type][i];
						if(typeof handler != "function")
							continue;

						try{
							handler.call(ctx, event)
						}catch(e){
							console.error(e, e.stack);
						}
					}
				};

				if(async)
					setTimeout(t, 0);
				else
					t();
			});
		};
	};


	ctx[name].eventDrive = eventDrive;
})(window, "View");
;(function(ctx, name){
	/** 日志输出组件 */
	var Logger = (function(){
		/**
		 * 填充字符串中的占位符："{}"。使用“\\”进行转义，以输出字符串：“{}”
		 * @param {String} arguments[0] 包含有占位符的源字符串
		 * @param {Any} arguments[1...n] 占位符取值。将使用String()方法转换输出
		 */
		var fillPlaceholders = function(){
			if(arguments.length == 0)
				return;

			var args = arguments;
			var str = " " + String(arguments[0]);
			var index = 1;
			str = str.replace(/([^\\])\{\}/g, function($0, $1){
				var value = (args.length - 1) < index? "{}": String(getNotion(args[index]));
				index++;
				return $1 + value;
			});
			str = str.replace(/\\\{\}/g, "{}");
			return str.substring(1);
		};

		/** 获取当前时间 */
		var getTime = function(){
			var time = new Date();
			var year = time.getFullYear();
			var month =  "0" + String(time.getMonth() + 1);
			month = month.substring(month.length - 2);
			var date =  "0" + String(time.getDate());
			date = date.substring(date.length - 2);
			var hours = "0" + String(time.getHours());
			hours = hours.substring(hours.length - 2);
			var minutes = "0" + String(time.getMinutes());
			minutes = minutes.substring(minutes.length - 2);
			var seconds = "0" + String(time.getSeconds());
			seconds = seconds.substring(seconds.length - 2);

			return month + date + " " + hours + ":" + minutes + ":" + seconds;
		};

		/**
		 * 获取指定对象的简略表达方式
		 */
		var getNotion = function(obj){
			if(null == obj)
				return null;

			if((typeof obj == "number") || (typeof obj == "string") || (typeof obj == "boolean"))
				return obj;
			else if(typeof obj == "function")
				return "function " + obj.name + "(){...}";
			else if(typeof obj == "object" && !Array.isArray(obj)){
				if(String(obj) != "[object Object]")/* 优先使用toString方法 */
					return String(obj);
				else{
					var _s = JSON.stringify(obj);
					if(_s != "{}")
						return _s;

					try{
						var tmp = {};
						for(var p in obj)
							tmp[p] = getNotion(obj[p]);
						return JSON.stringify(tmp);
					}catch(e){
						return _s;
					}
				}
			}else if(obj instanceof Array)
				return "[" + obj.map(function(ele){
					return getNotion(ele);
				}).join(", ") + "]";
			else
				return obj;
		};

		/** 获取日志前缀 */
		var getLogPrefix = function(name){
			return getTime() + " [" + name + "]: ";
		};

		var loggers = {};

		/** 获取，及设置日志输出状态全局状态的方法 */
		var isGloballyEnabled, setIsGloballyEnabled;
		;(function(){
			var flag = true;

			isGloballyEnabled = function(){
				return flag;
			};

			setIsGloballyEnabled = function(v){
				flag = v;
			};
		})();

		/**
		 * @constructor
		 * 日志输出组件
		 */
		var Logger = function(name){
			var isEnabled = true;

			/**
			 * 判断日志组件是否启用
			 * @return {Boolean} 当前对象日志输出是否启用
			 */
			this.isEnabled = function(){
				return isGloballyEnabled() && isEnabled;
			};

			/**
			 * 设置日志输出的启用状态
			 * @param {Boolean} v 是否启用
			 */
			this.setIsEnabled = function(v){
				isEnabled = v;
				return this;
			};

			/**
			 * 获取日志组件名称
			 */
			this.getName = function(){
				return name;
			};

			this.debug = function(){
				if(!this.isEnabled())
					return;

				var msg = fillPlaceholders.apply(null, arguments);
				console.debug(getLogPrefix(name) + msg);
			};

			this.info = function(){
				if(!this.isEnabled())
					return;

				var msg = fillPlaceholders.apply(null, arguments);
				console.info(getLogPrefix(name) + msg);
			};

			this.warn = function(){
				if(!this.isEnabled())
					return;

				var msg = fillPlaceholders.apply(null, arguments);
				console.warn(getLogPrefix(name) + msg);
			};

			this.error = function(){
				if(!this.isEnabled())
					return;

				var msg = fillPlaceholders.apply(null, arguments);
				console.error(getLogPrefix(name) + msg);
			};

			this.log = function(){
				if(!this.isEnabled())
					return;

				var msg = fillPlaceholders.apply(null, arguments);
				console.log(getLogPrefix(name) + msg);
			};
		};

		/**
		 * 获取指定名称的logger。如果相同名称的实例已经存在，则返回既有的实例。如果不存在，则自动创建一个
		 * @param {String} name 名称
		 */
		var ofName = function(name){
			if(name in loggers)
				return loggers[name];

			var instance = new Logger(name);
			loggers[name] = instance;

			return instance;
		};
		Logger.ofName = ofName;

		Logger.isGloballyEnabled = isGloballyEnabled;
		Logger.setIsGloballyEnabled = setIsGloballyEnabled;

		return Logger;
	})();

	Logger.globalLogger = Logger.ofName("View");

	ctx[name].Logger = Logger;
})(window, "View");
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

	/**
	 * 判断给定的对象是否包含指定名称的样式类
	 */
	var hasClass = function(obj, clazz){
		if(isEmptyString(clazz, true))
			return false;

		if(obj.classList && obj.classList.contains)
			return obj.classList.contains(clazz);

		return new RegExp("\\b" + clazz + "\\b", "gim").test(obj.className);
	};

	/**
	 * 为指定的对象添加样式类
	 */
	var addClass = function(obj, clazz){
		if(isEmptyString(clazz, true) || hasClass(obj, clazz))
			return;

		if(obj.classList && obj.classList.add){
			obj.classList.add(clazz);
			return;
		}

		obj.className = (obj.className.trim() + " " + clazz).trim();
	};

	/**
	 * 为指定的对象删除样式类
	 */
	var removeClass = function(obj, clazz){
		if(isEmptyString(clazz, true) || !hasClass(obj, clazz))
			return;

		if(obj.classList && obj.classList.remove){
			obj.classList.remove(clazz);
			return;
		}

		clazz = String(clazz).toLowerCase();
		var arr = obj.className.split(/\s+/), str = "";
		for(var i = 0; i < arr.length; i++){
			var tmp = arr[i];
			if(isEmptyString(tmp, true))
				continue;

			if(tmp.toLowerCase() === clazz)
				continue;

			str += " " + tmp;
		}
		if(str.length > 0)
			str = str.substring(1);
		obj.className = str.trim();
	};

	/**
	 * 为指定的对象切换样式类
	 * @param {HTMLElement} obj DOM元素
	 * @param {String} clazz 样式类名称
	 * @returns {Boolean} 切换后是否含有此样式类
	 */
	var toggleClass = function(obj, clazz){
		if(hasClass(obj, clazz)){
			removeClass(obj, clazz);
			return false;
		}else{
			addClass(obj, clazz);
			return true;
		}
	};

	/**
	 * 判断给定的字符串是否以另外一个字符串开头
	 * @param {String} target 要判断的目标字符串
	 * @param {String} str
	 * @returns {boolean}
	 */
	var startsWith = function(target, str){
		if(null === str || undefined === str)
			return false;

		str = String(str);
		var len = str.length;

		if(this.length < len)
			return false;

		return target.substring(0, len) === str;
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

		hasClass: hasClass,
		addClass: addClass,
		removeClass: removeClass,
		toggleClass: toggleClass,

		startsWith: startsWith,

		env: env
	};
})(window, "View");
;(function(ctx, name){
	var util = ctx[name].util,
		Logger = ctx[name].Logger;

	var globalLogger = Logger.globalLogger;

	var docEle = document.documentElement;
	var currentWindowWidth = 0,
		currentWindowHeight = 0,

		currentDocWidth = 0,
		currentDocHeight = 0,

		isCurrentlyPortrait = null,
		isCurrentlyViewingInPCMode = null;

	var interval = 20;
	var changeCallbacks = [];

	/**
	 * 判断当前设备是否处于竖屏模式（宽度小于等于高度）
	 */
	var isPortrait = function(){
		return currentWindowWidth <= currentWindowHeight;
	};

	/**
	 * 添加方向切换时执行的事件句柄。该句柄只有在界面重绘完成时才会被执行
	 */
	var addChangeListener = function(callback){
		if(changeCallbacks.indexOf(callback) !== -1)
			return;

		changeCallbacks.push(callback);
	};

	/**
	 * 执行监听回调
	 */
	var execResolutionChangeCallbacks = function(e){
		for(var i = 0; i < changeCallbacks.length; i++)
			util.try2Call(changeCallbacks[i], null, e);
	};

	/**
	 * 更新状态
	 */
	var updateState = function(){
		var _currentDocWidth = docEle.clientWidth,
			_currentDocHeight = docEle.clientHeight;

		var _currentWindowWidth = window.innerWidth || _currentDocWidth,
			_currentWindowHeight = window.innerHeight || _currentDocHeight;

		var _isCurrentlyPortrait = isPortrait();

		util.env.refresh();
		var _isCurrentlyViewingInPCMode = util.env.isPc;

		/* 检测变化 */
		var ifChanges = false, changeDesc = [];

		/* 使用开发工具时，浏览模式的改变 */
		if(_isCurrentlyViewingInPCMode !== isCurrentlyViewingInPCMode){
			ifChanges = true;
			changeDesc.push("env");
		}

		/* 宽度的变化 */
		if(Math.abs(_currentWindowWidth - currentWindowWidth) > 0.5){
			ifChanges = true;
			changeDesc.push("width");
		}else if(_currentWindowHeight - currentWindowHeight > 0.5){/* 宽度不变，高度变大（虚拟键盘的消失）。暂不处理虚拟键盘弹出，导致浏览窗口变小的现象（对于固定显示在底部的元素，处理后效果较差，效果等同于绝对定位） */
			ifChanges = true;
			changeDesc.push("height+");
		}

		currentDocWidth = _currentDocWidth;
		currentDocHeight = _currentDocHeight;

		currentWindowWidth = _currentWindowWidth;
		currentWindowHeight = _currentWindowHeight;

		isCurrentlyPortrait = _isCurrentlyPortrait;
		isCurrentlyViewingInPCMode = _isCurrentlyViewingInPCMode;

		if(ifChanges){
			globalLogger.debug("Resolution changes. Changed aspects: {}", changeDesc);
			execResolutionChangeCallbacks();
		}
	};

	updateState();
	setInterval(updateState, interval);

	var obj = {
		addChangeListener: addChangeListener
	};
	Object.freeze && Object.freeze(obj);

	ctx[name].resolution = obj;
})(window, "View");
;(function(ctx, name){
	var globalLogger = ctx[name].Logger.globalLogger,
		util = ctx[name].util,
		resolution = ctx[name].resolution;

	var attr$view_container = "data-view-container";

	/** 布局工具组件 */
	var layout = (function(){
		/** 蓝图宽高比。默认为iPhone5的宽高比。用于在PC环境下布局 */
		var expectedWidthHeightRatio = 320 / 568;

		/** 视口尺寸发生变化时是否自动布局 */
		var autoReLayoutWhenResize = true;

		/** 布局发生变化时要执行的方法 */
		var layoutChangeListeners = [];

		/* 是否已经完成初始化 */
		var isInitialized = false;

		/** 空方法 */
		var emptyFunc = function doNothing(){};

		var obj = {};
		var docEle = document.documentElement;

		/**
		 * 查找View容器
		 * View容器是声明了attr$view_container属性的元素。如果没有元素声明该属性，则返回document.body
		 */
		var getViewContainerObj = function(){
			var obj = docEle.querySelector("[" + attr$view_container + "]");
			return obj || document.body;
		};

		/**
		 * 获取布局宽度
		 */
		var getLayoutWidth = function(){
			var containerObj = getViewContainerObj();
			var style = util.getComputedStyle(containerObj);
			var paddingLeft = Number(style.paddingLeft.replace(/px/, "")),
				paddingRight = Number(style.paddingRight.replace(/px/, ""));
			if(isNaN(paddingLeft))
				paddingLeft = 0;
			if(isNaN(paddingRight))
				paddingRight = 0;
			return containerObj.clientWidth - paddingLeft - paddingRight;
		};

		/**
		 * 获取布局高度
		 */
		var getLayoutHeight = function(){
			var containerObj = getViewContainerObj();
			var style = util.getComputedStyle(containerObj);
			var paddingTop = Number(style.paddingTop.replace(/px/, "")),
				paddingBottom = Number(style.paddingBottom.replace(/px/, ""));
			if(isNaN(paddingTop))
				paddingTop = 0;
			if(isNaN(paddingBottom))
				paddingBottom = 0;
			return containerObj.clientHeight - paddingTop - paddingBottom;
		};

		/**
		 * 获取浏览器宽度
		 */
		var getBrowserWidth = function(){
			return window.innerWidth || docEle.clientWidth;
		};

		/**
		 * 获取浏览器高度
		 */
		var getBrowserHeight = function(){
			return window.innerHeight || docEle.clientHeight;
		};

		/**
		 * 判断当前布局方向是否是竖屏方向
		 */
		var isLayoutPortrait = function(){
			return getLayoutWidth() <= getLayoutHeight();
		};

		/**
		 * 判断当前布局方向是否是横屏方向
		 */
		var isLayoutLandscape = function(){
			return !isLayoutPortrait();
		};

		/**
		 * 判断当前浏览器方向是否是竖屏方向
		 */
		var isBrowserPortrait = function(){
			return getBrowserWidth() <= getBrowserHeight();
		};

		/**
		 * 判断当前浏览器方向是否是横屏方向
		 */
		var isBrowserLandscape = function(){
			return !isBrowserPortrait();
		};

		/**
		 * 获取当前布局尺寸的宽高比
		 */
		var getLayoutWidthHeightRatio = function(){
			return getBrowserWidth() / getBrowserHeight();
		};

		/**
		 * 获取当前浏览器窗口尺寸的宽高比
		 */
		var getBrowserWidthHeightRatio = function(){
			return getBrowserWidth() / getBrowserHeight();
		};

		/**
		 * 获取蓝图的宽高比（用于在PC横屏布局下以手机版面布局）
		 */
		var getExpectedWidthHeightRatio = function(){
			return expectedWidthHeightRatio;
		};

		/**
		 * 设置蓝图的宽高比
		 * @param {Number} ratio 蓝图的宽高比
		 */
		var setExpectedWidthHeightRatio = function(ratio){
			expectedWidthHeightRatio = ratio;
			return obj;
		};

		/**
		 * 以手机版式下的竖屏模式（宽小于高）进行布局。this：视图容器DOM元素
		 * @param {Number} width 布局空间的宽度
		 * @param {Number} height 布局空间的高度
		 */
		var layoutAsMobilePortrait_dft = function(width, height){
			var viewContainerObj = this;
			var s = viewContainerObj.style;

			s.width = width + "px";
			s.height = height + "px";
		};
		var layoutAsMobilePortrait = layoutAsMobilePortrait_dft;

		/**
		 * 以手机版式下的横屏模式（宽大于高）进行布局。this：视图容器DOM元素
		 * @param {Number} width 布局空间的宽度
		 * @param {Number} height 布局空间的高度
		 */
		var layoutAsMobileLandscape_dft = layoutAsMobilePortrait;
		var layoutAsMobileLandscape = layoutAsMobileLandscape_dft;

		/**
		 * 以平板版式下的竖屏模式（宽小于高）进行布局。this：视图容器DOM元素
		 * @param {Number} width 布局空间的宽度
		 * @param {Number} height 布局空间的高度
		 */
		var layoutAsTabletPortrait_dft = layoutAsMobilePortrait;
		var layoutAsTabletPortrait = layoutAsTabletPortrait_dft;

		/**
		 * 以平板版式下的横屏模式（宽大于高）进行布局。this：视图容器DOM元素
		 * @param {Number} width 布局空间的宽度
		 * @param {Number} height 布局空间的高度
		 */
		var layoutAsTabletLandscape_dft = layoutAsMobileLandscape;
		var layoutAsTabletLandscape = layoutAsTabletLandscape_dft;

		/**
		 * 以PC版式下的竖屏模式（宽小于高）进行布局。this：视图容器DOM元素
		 * @param {Number} width 布局空间的宽度
		 * @param {Number} height 布局空间的高度
		 */
		var layoutAsPcPortrait_dft = layoutAsMobilePortrait;
		var layoutAsPcPortrait = layoutAsPcPortrait_dft;

		/**
		 * 以PC版式下的横屏模式（宽大于高）进行布局。this：视图容器DOM元素
		 * @param {Number} width 布局空间的宽度
		 * @param {Number} height 布局空间的高度
		 */
		var layoutAsPcLandscape_dft = layoutAsMobileLandscape;
		var layoutAsPcLandscape = layoutAsPcLandscape_dft;

		/**
		 * 以手机版式进行布局（自动判断横竖屏）
		 */
		var layoutAsMobile = function(){
			var width = getBrowserWidth(), height = getBrowserHeight();
			var f = isBrowserLandscape()? layoutAsMobileLandscape: layoutAsMobilePortrait;
			util.try2Call(f, getViewContainerObj(), width, height);
		};

		/**
		 * 以平板版式进行布局（自动判断横竖屏）
		 */
		var layoutAsTablet = function(){
			var width = getBrowserWidth(), height = getBrowserHeight();
			var f = isBrowserLandscape()? layoutAsTabletLandscape: layoutAsTabletPortrait;
			util.try2Call(f, getViewContainerObj(), width, height);
		};

		/**
		 * 以PC版式进行布局（自动判断横竖屏）
		 */
		var layoutAsPC = function(){
			var width = getBrowserWidth(), height = getBrowserHeight();
			if(isBrowserPortrait())
				util.try2Call(layoutAsPcPortrait, getViewContainerObj(), width, height);
			else if(layoutAsPcLandscape === layoutAsPcLandscape_dft){/* 没有指定自定义的PC横屏布局办法，则以蓝图手机版式布局 */
				width = height * expectedWidthHeightRatio;
				util.try2Call(layoutAsMobilePortrait, getViewContainerObj(), width, height);
			}else
				util.try2Call(layoutAsPcLandscape, getViewContainerObj(), width, height);
		};

		/**
		 * 添加“布局发生改变”事件监听器
		 */
		var addLayoutChangeListener = function(listener){
			if(layoutChangeListeners.indexOf(listener) !== -1)
				return;

			layoutChangeListeners.push(listener);
			return obj;
		};

		/**
		 * 移除“布局发生改变”事件监听器
		 */
		var removeLayoutChangeListener = function(listener){
			var index = layoutChangeListeners.indexOf(listener);
			if(index === -1)
				return;

			layoutChangeListeners.splice(index, 1);
			return obj;
		};

		/**
		 * 根据初始化时设置的各个模式下的浏览方式，结合设备当前的浏览方向和设备类型自动进行布局
		 * @param {Boolean} [async=true] 是否以异步的方式完成布局
		 */
		var doLayout = (function(){
			var width = getLayoutWidth(),
				height = getLayoutHeight();

			return function(async){
				if(arguments.length < 1)
					async = true;

				if(util.env.isPc)
					layoutAsPC();
				else if(util.env.isTablet)
					layoutAsTablet();
				else
					layoutAsMobile();

				var newWidth = getLayoutWidth(),
					newHeight = getLayoutHeight();
				var browserWidth = getBrowserWidth(),
					browserHeight = getBrowserHeight();

				var ifLayoutChanges = Math.abs(width - newWidth) >= 0.1 || Math.abs(height - newHeight) >= 0.1;
				if(ifLayoutChanges){
					var action = function(){
						//globalLogger.debug("Layout changes. Layout: {} * {}, browser: {} * {}", newWidth, newHeight, browserWidth, browserHeight);
						for(var i = 0; i < layoutChangeListeners.length; i++){
							var cb = layoutChangeListeners[i];
							if(typeof cb != "function")
								continue;

							util.try2Call(cb, null, newWidth, newHeight, browserWidth, browserHeight);
						}
					};

					if(async)
						setTimeout(action, 0);
					else
						action();
				}

				return obj;
			};
		})();

		/**
		 * 初始化
		 * @param {Object} ops 初始化参数
		 * @param {Boolean} [ops.autoReLayoutWhenResize=true] 当视口尺寸发生变化时，是否自动重新布局
		 * @param {Function} [ops.layoutAsMobilePortrait] 手机以竖屏方式使用应用时的布局方式
		 * @param {Function} [ops.layoutAsMobileLandscape] 手机以横屏方式使用应用时的布局方式
		 * @param {Function} [ops.layoutAsTabletPortrait] 平板以竖屏方式使用应用时的布局方式
		 * @param {Function} [ops.layoutAsTabletLandscape] 平板以横屏方式使用应用时的布局方式
		 * @param {Function} [ops.layoutAsPcPortrait] PC桌面以竖屏方式使用应用时的布局方式
		 * @param {Function} [ops.layoutAsPcLandscape] PC桌面以横屏方式使用应用时的布局方式
		 */
		var init = function(ops){
			if(isInitialized){
				globalLogger.warn("Layout was initialized already");
				return obj;
			}

			isInitialized = true;
			ops = util.setDftValue(ops, {
				autoReLayoutWhenResize: true,

				layoutAsMobilePortrait: layoutAsMobilePortrait,
				layoutAsMobileLandscape: layoutAsMobileLandscape,
				layoutAsTabletLandscape: layoutAsTabletLandscape,
				layoutAsTabletPortrait: layoutAsTabletPortrait,
				layoutAsPcPortrait: layoutAsPcPortrait,
				layoutAsPcLandscape: layoutAsPcLandscape
			});

			autoReLayoutWhenResize = !!ops.autoReLayoutWhenResize;
			if(autoReLayoutWhenResize)
				resolution.addChangeListener(doLayout);

			if(typeof ops.layoutAsMobilePortrait === "function")
				layoutAsMobilePortrait = ops.layoutAsMobilePortrait;
			if(typeof ops.layoutAsMobileLandscape === "function")
				layoutAsMobileLandscape = ops.layoutAsMobileLandscape;
			if(typeof ops.layoutAsTabletPortrait === "function")
				layoutAsTabletPortrait = ops.layoutAsTabletPortrait;
			if(typeof ops.layoutAsTabletLandscape === "function")
				layoutAsTabletLandscape = ops.layoutAsTabletLandscape;
			if(typeof ops.layoutAsPcPortrait === "function")
				layoutAsPcPortrait = ops.layoutAsPcPortrait;
			if(typeof ops.layoutAsPcLandscape === "function")
				layoutAsPcLandscape = ops.layoutAsPcLandscape;

			return obj;
		};

		var extend = util.setDftValue;
		extend(obj, {
			getLayoutWidth: getLayoutWidth,
			getLayoutHeight: getLayoutHeight,
			getBrowserWidth: getBrowserWidth,
			getBrowserHeight: getBrowserHeight,
			isLayoutPortrait: isLayoutPortrait,
			isLayoutLandscape: isLayoutLandscape,
			isBrowserPortrait: isBrowserPortrait,
			isBrowserLandscape: isBrowserLandscape,
			getLayoutWidthHeightRatio: getLayoutWidthHeightRatio,
			getBrowserWidthHeightRatio: getBrowserWidthHeightRatio,
			getExpectedWidthHeightRatio: getExpectedWidthHeightRatio,
			setExpectedWidthHeightRatio: setExpectedWidthHeightRatio,

			init: init,
			doLayout: doLayout,

			addLayoutChangeListener: addLayoutChangeListener,
			removeLayoutChangeListener: removeLayoutChangeListener
		});

		Object.freeze && Object.freeze(obj);

		return obj;
	})();


	ctx[name].layout = layout;
})(window, "View");
;(function(ctx, name){
	var util = ctx[name].util;

	/** 触摸支持组件 */
	var touch = (function(){
		var MOBILE_REGEX = /mobile|tablet|ip(ad|hone|od)|android/i,
			SUPPORT_TOUCH = ('ontouchstart' in window),
			IS_MOBILE = MOBILE_REGEX.test(navigator.userAgent);

		/* 添加的依附于DOM元素的，用于记录其相关取值的属性名称 */
		var touchAttributeName = "  __com.soft.plugin.touch#" + new Date().getTime() + "__  ";

		/**
		 * 定位至指定的命名空间。如果命名空间不存在，则顺序创建
		 * @param obj {Object} 创建空间的对象
		 * @param name {String} 要创建的空间（空间之间以“.”分割，如："a.b.c"）
		 */
		var mapNamespace = function(obj, name){
			obj = obj || {};
			obj[name] = obj[name] || {};
			return obj[name];
		};

		/**
		 * 添加“轻触”事件监听器
		 * @param target {HTMLElement} 要添加监听事件的元素
		 * @param callback {Function} 事件触发时执行的回调函数
		 * @param options {JsonObject} 控制选项
		 * @param options.timespan {Integer} 轻触开始和轻触结束之间的最大事件间隔。单位：毫秒
		 * @param options.delta {JsonObject} 轻触操作在触摸屏上产生的位移
		 * @param options.delta.x {Integer} 允许的最大横向位移
		 * @param options.delta.y {Integer} 允许的最大纵向位移
		 * @param options.useCapture {Boolean} 是否在捕获阶段监听事件
		 */
		var addTapListener = function(target, callback, options){
			/* 如果浏览器不支持触摸事件，则改用click */
			if(!IS_MOBILE){
				target.addEventListener? target.addEventListener("click", callback): target.attachEvent("onclick", callback);
				return;
			}

			/* 在元素上创建空间，用于存储相关信息 */
			var tapNamespace = mapNamespace(target, touchAttributeName + ".tap");
			tapNamespace.callbacks = tapNamespace.callbacks || [];

			/* 如果事件已经添加，则直接返回 */
			if(tapNamespace.callbacks.indexOf(callback) != -1)
				return;

			/* 添加回调函数至响应队列中 */
			tapNamespace.callbacks.push(callback);

			/* 选项配置 */
			options = util.setDftValue(options, {timespan: 500, delta: {}, useCapture: false});
			options.delta = util.setDftValue(options.delta, {x: 10, y: 15});

			/* 保留添加的touchstart, touchend回调函数引用，以支持事件移除 */
			var metaNamespace = mapNamespace(target, touchAttributeName + ".tap.meta");
			/* 轻触开始 */
			if(null == metaNamespace.touchstart){
				metaNamespace.touchstart = function(e){
					var touch = e.changedTouches? e.changedTouches[0]: e;
					tapNamespace.startX = touch.screenX;
					tapNamespace.startY = touch.screenY
					tapNamespace.startTimestamp = Date.now();
				};
				target.addEventListener("touchstart", metaNamespace.touchstart);
			}
			/* 轻触结束 */
			if(null == metaNamespace.touchend){
				metaNamespace.touchend = function(e){
					var touch = e.changedTouches? e.changedTouches[0]: e;
					tapNamespace.stopX = touch.screenX;
					tapNamespace.stopY = touch.screenY;
					tapNamespace.stopTimestamp = Date.now();

					var timespan = tapNamespace.stopTimestamp - tapNamespace.startTimestamp,
						deltaX = Math.abs(tapNamespace.stopX - tapNamespace.startX),
						deltaY = Math.abs(tapNamespace.stopY - tapNamespace.startY);

					/* 仅当误差在允许的范围内时才调用回调函数 */
					if(timespan <= options.timespan && deltaX <= options.delta.x && deltaY <= options.delta.y){
						for(var i = 0; i < tapNamespace.callbacks.length; i++)
							util.try2Call(tapNamespace.callbacks[i], target, e);
					}
				};
				target.addEventListener("touchend", metaNamespace.touchend, options.useCapture);
			}
		};

		/**
		 * 移除添加的轻触事件监听器
		 * @param ops {JsonObject} 配置选项
		 * @param target {HTMLElement} 要移除事件的元素
		 * @param callback {Function} 要移除的回调函数
		 * @param useCapture {Boolean} 是否在捕获阶段监听事件
		 */
		var removeTapListener = function(target, callback, useCapture){
			/* 如果浏览器不支持触摸事件，则改用click */
			if(!IS_MOBILE){
				target.removeEventListener? target.removeEventListener("click", callback): target.detachEvent("onclick", callback);
				return;
			}

			if(!target.hasOwnProperty(touchAttributeName))
				return;

			/* 判断回调函数是否存在 */
			var tapNamespace = mapNamespace(target, touchAttributeName + ".tap");
			var index = tapNamespace.callbacks.indexOf(callback);
			if(index == -1){
				return;
			}

			/* 移除回调函数 */
			tapNamespace.callbacks.splice(index, 1);

			/* 如果所有回调函数都被移除，则清除所有数据 */
			if(tapNamespace.callbacks.length == 0){
				/* 移除添加的touchstart，touchend回调函数 */
				var metaNamespace = mapNamespace(target, touchAttributeName + ".tap.meta");
				target.removeEventListener("touchstart", metaNamespace.touchstart);
				target.removeEventListener("touchend", metaNamespace.touchend, useCapture);

				delete target[touchAttributeName].tap;
			}
		};

		return {
			addTapListener: addTapListener,
			removeTapListener: removeTapListener
		};
	})();


	ctx[name].touch = touch;
})(window, "View");
;(function(ctx, name){
	var util = ctx[name].util;

	/**
	 * 视图上下文
	 */
	var ViewContext = function ViewContext(){
		var obj = {};

		/**
		 * 判定上下文中是否含有指定名称的键
		 * @param {String} name 名称
		 * @returns {Boolean}
		 */
		this.has = function(name){
			return name in obj;
		};

		/**
		 * 设置属性。如果相同名称的属性已经存在，则覆盖。
		 * @param {String} name 属性名称
		 * @param {*} value 属性取值
		 * @returns {ViewContext}
		 */
		this.set = function(name, value){
			obj[name] = value;
			return this;
		};

		/**
		 * 获取指定名称的属性。如果属性不存在，则返回undefined
		 * @param {String} name 属性名称
		 * @returns {*}
		 */
		this.get = function(name){
			return obj[name];
		};

		/**
		 * 移除指定名称的属性，并返回既有的属性值
		 * @param {String} name 属性名称
		 * @returns {*} 既有取值
		 */
		this.remove = function(name){
			var value = obj[name];
			delete obj[name];
			return value;
		};

		/**
		 * 清空所有属性
		 * @returns {ViewContext}
		 */
		this.clear = function(){
			for(var p in obj)
				delete obj[p];
			return this;
		};

		/**
		 * 列举所有属性名
		 * @returns {String[]}
		 */
		this.listKeys = function(){
			return Object.keys(obj);
		};

		/**
		 * 获取属性个数
		 * @returns {Number}
		 */
		this.size = function(){
			var c = 0;
			for(var p in obj)
				c++;

			return c;
		};

		Object.freeze(this);
	};


	ctx[name].ViewContext = ViewContext;
})(window, "View");
;(function(ctx, name){
	var globalLogger = ctx[name].Logger.globalLogger;
	var NOT_SUPPLIED = {};

	/**
	 * 视图配置
	 * @param {String} _name 配置项名称
	 * @param {String} viewId 关联的视图编号
	 * @param {String} viewNamespace 视图隶属的命名空间
	 */
	var ViewConfiguration = function ViewConfiguration(_name, viewId, viewNamespace){
		var name = _name,/* 配置项名称 */
			value = NOT_SUPPLIED,/* 配置项取值 */
			application;/* 配置项应用方法 */

		/**
		 * 获取配置项名称
		 */
		this.getName = function(){
			return name;
		};

		/**
		 * 获取配置项取值
		 * @param {*} dftValue 配置值没有指定时的默认值
		 */
		this.getValue = function(dftValue){
			if(NOT_SUPPLIED === value){
				if(arguments.length < 1)
					return undefined;

				return dftValue;
			}else
				return value;
		};

		/**
		 * 设置配置项取值
		 * @param {*} _value 要设定的配置项取值
		 * @param {Boolean} [ifOverride=false] 如果已经设置过配置项取值，是否使用新取值覆盖既有取值。如果配置项取值尚未设置过，则无论是否覆盖，均执行赋值动作
		 * @returns {ViewConfiguration}
		 */
		this.setValue = function(_value, ifOverride){
			if(arguments.length < 2)
				ifOverride = false;

			if(ifOverride || NOT_SUPPLIED === value)
				value = _value;

			return this;
		};

		/**
		 * 获取配置的应用方法
		 */
		this.getApplication = function(){
			return application;
		};

		/**
		 * 设置配置的应用方法
		 * @param {Function} _application 应用方法
		 * @returns {ViewConfiguration}
		 */
		this.setApplication = function(_application){
			if(typeof _application != "function"){
				globalLogger.warn("Application action should be of type: 'Function'");
				return this;
			}

			application = _application;
			return this;
		};

		/**
		 * 应用配置。其中this指向的上下文为当前的配置项
		 * @returns {ViewConfiguration}
		 */
		this.apply = function(){
			if(typeof application == "function"){
				var v = NOT_SUPPLIED === value? undefined: value;

				try{
					application.call(this, v);
				}catch(e){
					globalLogger.error("Fail to apply configuration: {} = {} for view of id: '{}' namespace: '{}'\n{}", _name, String(v), viewId, viewNamespace, e);

					if(e instanceof Error)
						console.error(e, e.stack);
					else
						console.error(e);
				}
			}

			return this;
		};

		/**
		 * 将配置以"data-viewconfig_[name]=[value]"的方式附加至视图的DOM元素上
		 * @returns {ViewConfiguration}
		 */
		this.reflectToDom = function(){
			if(null == viewId || "" === viewId.trim())
				return this;

			if(!View.ifExists(viewId, viewNamespace)){
				globalLogger.warn("No view of id '{}' in namespace: '{}' found to reflect config: {}={}", viewId, viewNamespace, this.getName(), this.getValue());
				return this;
			}

			if(typeof this.getValue() === "function" || Array.isArray(this.getValue)){
				globalLogger.warn("Invalid value to reflect to dom:");
				console.warn(this.getValue());
				return this;
			}

			var viewObj = View.ofId(viewId, viewNamespace).getDomElement();
			viewObj.setAttribute("data-viewconfig_" + this.getName(), String(this.getValue()));
			return this;
		};

		Object.freeze(this);
	};


	ctx[name].ViewConfiguration = ViewConfiguration;
})(window, "View");
;(function(ctx, name){
	var util = ctx[name].util;
	var ViewConfiguration = ctx[name].ViewConfiguration;

	/**
	 * 视图配置集合
	 * @param {String} viewId 关联的视图编号
	 * @param {String} viewNamespace 视图隶属的命名空间
	 */
	var ViewConfigurationSet = function ViewConfigurationSet(viewId, viewNamespace){
		/** 配置项集合。key：配置项名称；value：ViewConfiguration */
		var configs = {};

		/**
		 * 判断特定名称的配置项是否存在
		 * @param {String} key 配置项名称
		 */
		this.has = function(key){
			return key in configs;
		};

		/**
		 * 获取指定名称对应的配置项，如果对应的配置项不存在，则自动创建一个
		 * @param {String} key 配置项名称
		 */
		this.get = function(key){
			var c;
			if(key in configs)
				c = configs[key];
			else{
				c = new ViewConfiguration(key, viewId, viewNamespace);
				configs[key] = c;
			}

			return c;
		};

		/**
		 * 应用所有配置
		 */
		this.applyAll = function(){
			var items = Object.keys(configs).map(function(k){
				return configs[k];
			});
			if(0 === items.length)
				return this;

			setTimeout(function(){
				for(var i = 0; i < items.length; i++){
					var c = items[i];
					util.try2Call(c.apply, c);
				}
			}, 0);

			return this;
		};

		/**
		 * 列举所有的配置项名称
		 */
		this.listAll = function(){
			return Object.keys(configs);
		};
	};


	ctx[name].ViewConfigurationSet = ViewConfigurationSet;
})(window, "View");
;(function(ctx, name){
	var util = ctx[name].util,
		globalLogger = ctx[name].Logger.globalLogger;

	var prefix = "ViewState_";
	var flag = util.randomString(prefix);

	var defaultNamespace = "default";

	var stack = [], pos = -1;

	/**
	 * 使用给定的视图编号和视图选项构造地址栏字符串
	 */
	var concatViewOptions = function(viewId, namespace, options){
		var nspc = util.isEmptyString(namespace, true) || defaultNamespace === namespace? "": ("@" + String(namespace));

		/** 视图编号与参数集合之间的分隔符 */
		var sep = "!";

		var str = String(viewId) + nspc;
		var paramKeys = null == options? []: Object.keys(options);
		var tmp = paramKeys.reduce(function(start, e){
			return start + "&" + util.xEncodeURIComponent(e) + "=" + util.xEncodeURIComponent(options[e]);
		}, "");

		if(tmp.length > 0)
			str += sep + tmp.substring(1);

		return str;
	};

	/**
	 * 浏览状态
	 * @param {String} viewId 视图ID
	 * @param {String} viewNamespace 视图隶属的命名空间
	 * @param {String} [timeBasedUniqueString=util.getUniqueString()] 基于时间戳的浏览操作流水号
	 * @param {Object} options 选项集合
	 */
	var ViewState = function(viewId, viewNamespace, timeBasedUniqueString, options){
		if(arguments.length < 3)
			options = null;
		if(arguments.length < 2)
			timeBasedUniqueString = util.getUniqueString();
		timeBasedUniqueString = timeBasedUniqueString || util.getUniqueString();

		util.defineReadOnlyProperty(this, "viewId", viewId);
		util.defineReadOnlyProperty(this, "viewNamespace", viewNamespace);
		util.defineReadOnlyProperty(this, "sn", timeBasedUniqueString);
		util.defineReadOnlyProperty(this, "options", options);
		util.defineReadOnlyProperty(this, "flag", flag);

		this.toString = function(){
			return JSON.stringify(this);
		};

		this.clone = function(){
			return JSON.parse(this.toString());
		};
	};

	/**
	 * 判断特定的对象是否是ViewState的实例
	 * @param {Object} obj 要判断的对象
	 */
	ViewState.isConstructorOf = function(obj){
		if(null == obj || typeof obj !== "object")
			return false;

		return obj.hasOwnProperty("viewId") && obj.hasOwnProperty("sn") && util.startsWith(obj.flag, prefix);
	};

	/**
	 * 向history中添加view浏览历史
	 * @param {String} viewId 视图ID
	 * @param {String} viewNamespace 视图隶属的命名空间
	 * @param {String} [timeBasedUniqueString=util.getUniqueString()] 基于时间戳的视图压入堆栈的唯一标识
	 * @param {Object} [options=null] 选项集合
	 */
	ViewState.pushViewState = function(viewId, viewNamespace, timeBasedUniqueString, options){
		if(arguments.length < 4)
			options = null;
		if(arguments.length < 3)
			timeBasedUniqueString = util.getUniqueString();
		if(arguments.length < 2 || util.isEmptyString(viewNamespace, true))
			viewNamespace = defaultNamespace;

		timeBasedUniqueString = timeBasedUniqueString || util.getUniqueString();

		var state = new ViewState(viewId, viewNamespace, timeBasedUniqueString, options).clone();
		globalLogger.log("↓ {}", JSON.stringify(state));

		if(util.env.isHistoryPushPopSupported)
			history.pushState(state, "", "#" + concatViewOptions(viewId, viewNamespace, options));
		else
			location.hash = concatViewOptions(viewId, viewNamespace, options);

		stack.splice(pos + 1, stack.length);
		stack.push(state);
		pos++;
		outputStack();

		View.currentState = state;
	};

	/**
	 * 更新history中最后一个view浏览历史
	 * @param {String} viewId 视图ID
	 * @param {String} viewNamespace 视图隶属的命名空间
	 * @param {String} [timeBasedUniqueString=util.getUniqueString()] 基于时间戳的视图更新堆栈的唯一标识
	 * @param {Object} [options=null] 选项集合
	 */
	ViewState.replaceViewState = function(viewId, viewNamespace, timeBasedUniqueString, options){
		if(arguments.length < 4)
			options = null;
		if(arguments.length < 3)
			timeBasedUniqueString = util.getUniqueString();
		if(arguments.length < 2 || util.isEmptyString(viewNamespace, true))
			viewNamespace = defaultNamespace;

		timeBasedUniqueString = timeBasedUniqueString || util.getUniqueString();

		var state = new ViewState(viewId, viewNamespace, timeBasedUniqueString, options).clone();
		globalLogger.log("% {}", JSON.stringify(state));

		if(util.env.isHistoryPushPopSupported)
			history.replaceState(state, "", "#" + concatViewOptions(viewId, viewNamespace, options));
		else
			location.hash = concatViewOptions(viewId, viewNamespace, options);

		if(0 === stack.length){
			stack.push(state);
			pos++;
		}else{
			var previous = stack[pos - 1],
				next = stack[pos + 1];
			if(null != previous && previous.sn === timeBasedUniqueString){/* 通过浏览器执行回退操作 */
				pos--;
			}else if(null != next && next.sn === timeBasedUniqueString){/* 通过浏览器执行前进操作 */
				pos++;
			}else{
				stack[pos] = state;
			}
			outputStack();
		}

		View.currentState = state;
	};

	/**
	 * 获取堆栈大小
	 * @returns {Number}
	 */
	ViewState.getStackSize = function(){
		return stack.length;
	};

	/**
	 * 根据当前位置确定是否可以向前返回
	 * @returns {Boolean}
	 */
	ViewState.ifCanGoBack = function(){
		return pos > 0;
	};

	var outputStack = function(){
		globalLogger.debug("View state stack: {}, {}", stack.map(function(v){return v.sn}), pos);
	};

	ctx[name].ViewState = ViewState;
})(window, "View");
;(function(ctx, name){
	var util = ctx[name].util,
		layout = ctx[name].layout,
		globalLogger = ctx[name].Logger.globalLogger;

	var docEle = document.documentElement;
	var doNothing = function doNothing(){};

	var instances = {};

	var previousWidth = -1,
		previousHeight = -1,

		currentWidth = 0,
		currentHeight = 0;

	/**
	 * 视图布局
	 * @param {String} viewId 关联的视图编号
	 * @param {String} viewNamespace 视图隶属的命名空间
	 */
	var ViewLayout = function(viewId, viewNamespace){
		var layoutAction = doNothing,/** 布局动作 */
		layoutWhenLayoutChanges = true,/** 设备方向改变时，是否执行布局动作 */
		layoutCushionTime = 50;/** 布局连续发生改变时，缓冲布局动作执行的时长。单位：毫秒 */

		/**
		 * 设置布局方法
		 * @param {Function} _layoutAction 布局方法
		 * @returns {ViewLayout}
		 */
		this.setLayoutAction = function(_layoutAction){
			if(typeof _layoutAction != "function"){
				globalLogger.error("Layout action should be of type: 'Function'");
				return this;
			}

			if(layoutAction !== _layoutAction){
				layoutAction = _layoutAction;
			}

			return this;
		};

		/**
		 * 获取布局方法
		 * @returns {Function}
		 */
		this.getLayoutAction = function(){
			return layoutAction;
		};

		/**
		 * 执行布局动作
		 * @returns {ViewLayout}
		 */
		this.doLayout = function(){
			if(typeof layoutAction != "function")
				return this;

			if(Math.abs(currentWidth - previousWidth) > 0 || Math.abs(currentHeight - previousHeight) > 0)
				docEle.offsetWidth, docEle.offsetHeight;

			layoutAction();

			previousWidth = currentWidth;
			previousHeight = currentHeight;

			return this;
		};

		/**
		 * 设置布局缓冲时长
		 * @param {Number} v 缓冲时长。设置0以代表不缓冲立即执行。单位：毫秒
		 * @returns {ViewLayout}
		 */
		this.setLayoutCushionTime = function(v){
			if(null == v || isNaN(v = Number(v)) || v < 0){
				globalLogger.error("Invalid layout cushion time. Should be a digit greater than or equal to 0");
				return this;
			}

			layoutCushionTime = v;
			return this;
		};

		/**
		 * 获取设置的布局缓冲时长
		 * @returns {Number}
		 */
		this.getLayoutCushionTime = function(){
			return layoutCushionTime;
		};

		/**
		 * 设置布局选项：是否在外层布局发生改变时执行布局动作
		 * @param {Boolean} v 布局空间发生变化时是否自动执行布局动作
		 * @returns {ViewLayout}
		 */
		this.setIfLayoutWhenLayoutChanges = function(v){
			layoutWhenLayoutChanges = !!v;
			return this;
		};

		var self = this;
		var timer;
		layout.addLayoutChangeListener(function(newWidth, newHeight){
			if(!layoutWhenLayoutChanges)
				return;

			if(!View.ofId(viewId, viewNamespace).isActive())
				return;

			globalLogger.debug("Layout changes, doing layout for view of id: '{}' namespace: '{}'. Width: {}, height: {}", viewId, viewNamespace, newWidth, newHeight);

			currentWidth = newWidth;
			currentHeight = newHeight;

			clearTimeout(timer);
			if(layoutCushionTime > 0)
				timer = setTimeout(function(){
					self.doLayout();
				}, layoutCushionTime);
			else
				self.doLayout();
		});
	};

	/**
	 * 获取指定编号的视图对应的视图布局。如果实例并不存在，则自动创建一个
	 */
	ViewLayout.ofId = function(id, namespace){
		var str = id + "@" + namespace;
		if(str in instances)
			return instances[str];

		var inst = new ViewLayout(id, namespace);
		instances[str] = inst;

		return inst;
	};

	ctx[name].ViewLayout = ViewLayout;
})(window, "View");
;(function(ctx, name){
	var util = ctx[name].util;

	/**
	 * 操作状态
	 * @param {String} serialNumber 操作流水
	 * @param {String} [timeBasedUniqueString=util.getUniqueString()] 基于时间戳的操作流水号
	 */
	var OperationState = (function(){
		var prefix = "OperationState_";
		var flag = util.randomString(prefix);

		var Clazz = function(serialNumber, timestamp){
			if(arguments.length < 2)
				timeBasedUniqueString = util.getUniqueString();
			timeBasedUniqueString = timeBasedUniqueString || util.getUniqueString();

			util.defineReadOnlyProperty(this, "serialNumber", serialNumber);
			util.defineReadOnlyProperty(this, "sn", timeBasedUniqueString);
			util.defineReadOnlyProperty(this, "flag", flag);

			this.toString = function(){
				return JSON.stringify(this);
			};

			this.clone = function(){
				return JSON.parse(this.toString());
			};
		};

		/**
		 * 判断特定的对象是否是ViewState的实例
		 * @param {JsonObject} obj 要判断的对象
		 */
		Clazz.isConstructorOf = function(obj){
			if(null == obj || typeof obj != "object")
				return false;

			return obj.hasOwnProperty("serialNumber") && obj.hasOwnProperty("sn") && util.startsWith(obj.flag, prefix);
		};

		/* 最近一次操作的状态 */
		var currentState = null;

		/* 操作集合 */
		var callbacks = {};

		/**
		 * 压入操作堆栈
		 */
		Clazz.pushState = function(serialNumber, callback){
			var state = new OperationState(serialNumber).clone();

			history.pushState(state, "", "");
			currentState = state;

			callbacks[serialNumber] = callback;
		};

		window.addEventListener("popstate", function(e){
			if(Clazz.isConstructorOf(currentState)){
				var isBack = e.state && e.state.sn && e.state.sn < currentState.sn;
				var callback = callbacks[currentState.serialNumber];
				if(isBack && null != callback){
					util.try2Call(callback);
					delete callbacks[currentState.serialNumber];
				}
			}

			var state = e.state;
			currentState = Clazz.isConstructorOf(state)? state: null;
		});

		return Clazz;
	})();


	ctx[name].OperationState = OperationState;
})(window, "View");
;(function(ctx, name){
	var util = ctx[name].util,
		Logger = ctx[name].Logger;

	var globalLogger = Logger.globalLogger;

	/**
	 * @type {Object<String, ChainedHandle>}
	 */
	var instances = {};

	/**
	 * @callback NamedHandle 链式处理器中的单个处理器
	 * @param {Function} resolve 处理成功回调
	 * @param {Function} reject 处理失败回调
	 */

	/**
	 * 链式处理器
	 * @param {String} name 处理器名称
	 */
	var ChainedHandle = function ChainedHandle(name){
		var sequence = [];

		var context = {};

		var handles = {};

		var isExecuting = false;

		/**
		 * 获取链式处理器的名称
		 * @returns {String}
		 */
		this.getName = function(){
			return name;
		};

		/**
		 * 设置处理器的先后顺序
		 * @param {String[]} _sequence 处理器名称列表。名称索引越小，其对应的处理器将越优先执行
		 * @returns {ChainedHandle}
		 */
		this.setSequence = function(_sequence){
			if(isExecuting){
				globalLogger.error("Sequence is prohibited to change while executing");
				return this;
			}

			if(!Array.isArray(_sequence))
				return this;

			_sequence = _sequence.map(function(handleName){
				return null == handleName? "": String(handleName).trim().toLowerCase();
			}).reduce(function(rst, handleName){
				if(!util.isEmptyString(handleName, true) && rst.indexOf(handleName) === -1)
					rst.push(handleName);

				return rst;
			}, []);
			sequence = _sequence;

			return this;
		};

		/**
		 * 向上下文中设置属性
		 * @param {String} name 属性名称。区分大小写
		 * @param {*} value 属性值
		 * @returns {ChainedHandle}
		 */
		this.setProperty = function(name, value){
			context[String[name]] = value;
			return this;
		};

		/**
		 * 向上下文中批量设置多个属性
		 * @param {Object} props 属性集合
		 * @returns {ChainedHandle}
		 */
		this.setProperties = function(props){
			if(null == props || typeof props !== "object")
				return this;

			for(var p in props)
				this.setProperty(p, props[p]);

			return this;
		};

		/**
		 * 从上下文中读取属性。如果给定的属性名称不存在，则返回设定的默认值
		 * @param {String} name 属性名称。区分大小写
		 * @param {*} dftValue 属性名称不存在时需要使用的取值
		 * @returns {*}
		 */
		this.getProperty = function(name, dftValue){
			name = String(name);
			if(name in context)
				return context[name];

			if(arguments.length > 1)
				return dftValue;
			return null;
		};

		/**
		 * 设置处理器
		 * @param {String} handleName 处理器名称
		 * @param {NamedHandle} handle 处理器
		 */
		this.setHandle = function(handleName, handle){
			if(isExecuting){
				globalLogger.error("Handle is prohibited to change while executing");
				return this;
			}

			handles[String(handleName).toLowerCase()] = handle;
			return this;
		};

		/**
		 * 开始执行链式处理器中的每个处理器。处理过程中不允许修改顺序
		 * @returns {Promise}
		 */
		this.exec = function(){
			globalLogger.debug("Executing chained handle: {}", name);

			isExecuting = true;

			var resolveFinalPromise, rejectFinalPromise;
			var finalPromise = new Promise(function(resolve, reject){
				resolveFinalPromise = resolve;
				rejectFinalPromise = reject;
			});

			finalPromise.then(function(){
				isExecuting = false;
			}, function(){
				isExecuting = false;
			});

			if(sequence.length === 0){
				resolveFinalPromise();
				return finalPromise;
			}

			var execHandle = function(index){
				if(index >= sequence.length){
					resolveFinalPromise();
					return;
				}

				var promise = new Promise(function(resolve, reject){
					var handleName = sequence[index];
					var handle = handles[handleName];

					globalLogger.debug("Executing handle: {}", handleName);

					/* 如果在顺序中设定的处理器不存在，则跳过该处理器 */
					if(null == handle){
						resolve();
						return;
					}

					try{
						handle(resolve, function(err){
							var msg = "Handle of name: " + handleName + "rejects";
							if(arguments.length > 1)
								globalLogger.error(msg, err);
							else
								globalLogger.error(msg);

							reject(err);
						});
					}catch(e){
						globalLogger.error("Error occurred while executing handle of name: " + handleName);
						console.error(e);
						reject(e);
					}
				});

				promise.then(function(){
					execHandle(index + 1);
				}, rejectFinalPromise);
			};

			execHandle(0);
			return finalPromise;
		};
	};

	/**
	 * 获取指定名称的链式处理器。如果对应实例尚不存在，则自动创建一个
	 * @param {String} name 处理器名称
	 * @returns {ChainedHandle}
	 */
	ChainedHandle.ofName = function(name){
		var instance = instances[name];
		if(null == instance)
			instance = instances[name] = new ChainedHandle(name);

		return instance;
	};

	ctx[name].ChainedHandle = ChainedHandle;
})(window, "View");
;(function(ctx, name){
	/** DOM属性集合 */
	ctx[name].viewAttribute = {
		attr$view: "data-view",
		attr$viewId: "data-view-id",
		attr$view_name: "data-view-name",
		attr$view_namespace: "data-view-namespace",
		attr$view_default: "data-view-default",
		attr$view_directly_accessible: "data-view-directly-accessible",
		attr$view_group: "data-view-group",
		attr$view_fallback: "data-view-fallback",
		attr$view_fallback_namespace: "data-view-fallback-namespace",

		attr$view_rel: "data-view-rel",
		attr$view_rel_namespace: "data-view-rel-namespace",
		attr$view_rel_type: "data-view-rel-type",
		attr$view_rel_disabled: "data-view-rel-disabled",

		attr$view_title: "data-view-title",
		attr$view_container: "data-view-container",
		attr$view_os: "data-view-os",

		/**
		 * width height ratio. Value: 'width / height'
		 */
		attr$view_whr: "data-view-whr",
		attr$view_state: "data-view-state",

		attr$active_view_id: "data-active-view-id",
		attr$active_view_namespace: "data-active-view-namespace"
	};
})(window, "View");
;(function(ctx, name){
	var globalLogger = ctx[name].Logger.globalLogger,
		util = ctx[name].util;

	var PSVIEW_BACK = ":back",/* 伪视图：后退 */
		PSVIEW_FORWARD = ":forward",/* 伪视图：前进 */
		PSVIEW_DEFAULT = ":default-view";/* 伪视图：默认视图 */

	var defaultNamespace = "default";

	/**
	 * 判断指定编号对应的视图是否是伪视图
	 * @param {String} viewId 视图编号
	 */
	var isPseudoView = function(viewId){
		return PSVIEW_BACK === viewId || PSVIEW_FORWARD === viewId || PSVIEW_DEFAULT === viewId;
	};

	/**
	 * 从地址栏hash中解析视图信息
	 * @param {String} hash 地址栏Hash
	 * @return {Object} {viewId: [视图编号], options: [选项集合]}
	 */
	var parseViewInfoFromHash = function(hash){
		if("" === hash)
			return null;

		var r = /^#([\w$\-]+)(?:@([^!]+))?(?:!+(.*))?/;
		var m = hash.match(r);
		if(null == m)
			return null;

		var viewId = m[1],
			viewNamespace = m[2],
			options = util.parseParams(m[3]);

		if(util.isEmptyString(viewNamespace, true))
			viewNamespace = defaultNamespace;

		return {viewId: viewId, viewNamespace: viewNamespace, options: options};
	};

	ctx[name].viewRepresentation = {
		PSVIEW_BACK: PSVIEW_BACK,
		PSVIEW_FORWARD: PSVIEW_FORWARD,
		PSVIEW_DEFAULT: PSVIEW_DEFAULT,

		isPseudoView: isPseudoView,
		parseViewInfoFromHash: parseViewInfoFromHash
	};
})(window, "View");
;(function(ctx, name){
	var globalLogger = ctx[name].Logger.globalLogger,
		viewRepresentation = ctx[name].viewRepresentation;

	/**
	 * 视图参数集合。
	 *
	 * 视图参数用于在切换视图时，通过指定参数来达到控制视图的预期行为的目的。
	 * 视图参数在每次进入前被重置，并使用视图切换操作提供的参数重新赋值。
	 *
	 * key：{String} 视图ID（包括伪视图）
	 * value：{Any} 参数
	 */
	var viewParameters = {};

	var hasParameters = function(viewId, viewNamespace){
		return (viewId + "@" + viewNamespace) in viewParameters;
	};

	var getParameters = function(viewId, viewNamespace){
		return viewParameters[viewId + "@" + viewNamespace];
	};

	var setParameters = function(viewId, viewNamespace, params){
		viewParameters[viewId + "@" + viewNamespace] = params;
	};

	var removeParameters = function(viewId, viewNamespace){
		delete viewParameters[viewId + "@" + viewNamespace];
	};

	/**
	 * 设置特定视图特定的多个参数取值
	 * @param {String} viewId 视图ID
	 * @param {String} viewNamespace 视图隶属的命名空间
	 * @param {*} params 入参参数集合
	 */
	var setViewParameters = function(viewId, viewNamespace, params){
		if(!View.ifExists(viewId, viewNamespace) && !viewRepresentation.isPseudoView(viewId))
			throw new Error("View of id: '" + viewId + "' within namespace: '" + viewNamespace + "' does not exist");

		if(undefined === params)
			params = null;
		if(typeof params !== "object")
			throw new Error("Parameters specified should be an object or null");

		setParameters(viewId, viewNamespace, params);
		return View;
	};

	/**
	 * 清除特定视图的入参
	 * @param {String} viewId 视图ID
	 * @param {String} viewNamespace 视图隶属的命名空间
	 */
	var clearViewParameters = function(viewId, viewNamespace){
		delete viewParameters[viewId + "@" + viewNamespace];

		return View;
	};

	ctx[name].viewParameter = {
		hasParameters: hasParameters,
		getParameters: getParameters,
		setParameters: setParameters,
		removeParameters: removeParameters,

		setViewParameters: setViewParameters,
		clearViewParameters: clearViewParameters
	};
})(window, "View");
;(function(ctx, name){
	var globalLogger = ctx[name].Logger.globalLogger,
		util = ctx[name].util,

		ViewLayout = ctx[name].ViewLayout,
		viewParameter = ctx[name].viewParameter,
		viewRepresentation = ctx[name].viewRepresentation,
		viewAttribute = ctx[name].viewAttribute;

	/**
	 * 视图实例集合
	 * key：视图命名空间
	 * value：视图实例数组
	 *
	 * @type {Object<String, View[]>}
	 */
	var viewInstancesMap = {};

	/**
	 * 视图访问顺序
	 * @type {View[]}
	 */
	var viewVisitStack = [];

	/**
	 * 准备就绪的视图列表
	 *
	 * “准备就绪”的定义：
	 * 1. 页面DOM加载完毕
	 * 2. 视图已经呈现过
	 *
	 * 视图的“准备就绪”事件只会触发一次，即未就绪状态下进入视图时，触发视图进入事件：“enter”之前触发
	 */
	var readyViews = [];

	/**
	 * 视图切换动画
	 * @type {Function|null}
	 */
	var viewSwitchAnimation = null;

	/**
	 * 默认的，视图隶属的命名空间
	 * @type {string}
	 */
	var defaultNamespace = "default";

	/**
	 * 默认的，渲染视图的宽高比（iPhone5）
	 * @type {string}
	 */
	var defaultWidthHeightRatio = "320/568";

	/**
	 * 标记位：由应用程序触发的，期望执行的视图切换类型。
	 * 如果切换动作由 应用 触发，则赋值为对应的切换类型；
	 * 如果切换动作由 路蓝旗 触发，则赋值为null。
	 * 借助该标记位，应用可以区分 “前进或后退” 的触发器（应用 或 浏览器）
	 *
	 * @type {String|null}
	 */
	var intendedSwitchType = null;


	var buildNamespace = function(namespace){
		if(!(namespace in viewInstancesMap))
			viewInstancesMap[namespace] = [];
	};

	/**
	 * 从给定的视图DOM上获取视图ID
	 * @param {HTMLElement} domElement
	 * @returns {String}
	 */
	var getPotentialViewId = function(domElement){
		if(!(domElement instanceof HTMLElement))
			return null;

		var viewId = domElement.getAttribute(viewAttribute.attr$viewId);
		if(util.isEmptyString(viewId, true))
			viewId = domElement.id;

		return viewId;
	};

	/**
	 * 获取视图容器DOM元素
	 * @returns {HTMLElement}
	 */
	var getViewContainerDomElement = function(){
		var obj = document.querySelector("[" + viewAttribute.attr$view_container + "]");
		if(null == obj)
			obj = document.body;

		return obj;
	};

	/**
	 * 判断给定的DOM元素是否为合法的视图DOM元素
	 * @param {Element} domElement
	 * @returns {Boolean}
	 */
	var isValidViewDomElement = function(domElement){
		if(!(domElement instanceof HTMLElement))
			return false;

		var tmp = domElement.getAttribute(viewAttribute.attr$view);
		if(null == tmp)
			return false;

		tmp = tmp.toLowerCase();
		if("true" !== tmp)
			return false;

		return !util.isEmptyString(getPotentialViewId(domElement), true);
	};

	/**
	 * 从DOM中获取所有声明为视图的DOM元素
	 * @return {HTMLElement[]}
	 */
	var getViewDomElements = function(){
		var rootObj = getViewContainerDomElement();

		var arr = [], i;
		var objs = document.querySelectorAll("*[" + viewAttribute.attr$view + "=true]");
		for(i = 0; i < objs.length; i++)
			if(isValidViewDomElement(objs[i]))
				arr.push(objs[i]);

		/* 声明了合法的 data-view-id 属性时将自动识别为视图，自动添加 data-view='true' */
		objs = rootObj.querySelectorAll("[" + viewAttribute.attr$viewId + "]");
		for(i = 0; i < objs.length; i++){
			var viewId = getPotentialViewId(objs[i]);
			if(util.isEmptyString(viewId, true))
				continue;

			if(arr.indexOf(objs[i]) === -1){
				objs[i].setAttribute(viewAttribute.attr$view, "true");
				arr.push(objs[i]);
			}
		}

		return arr;
	};

	/**
	 * 从DOM中获取ID为指定编号的视图DOM元素
	 */
	var getViewDomElementOfId = function(viewId, namespace){
		if(arguments.length < 2 || util.isEmptyString(namespace, true))
			namespace = defaultNamespace;
		buildNamespace(namespace);

		var domElements = document.querySelectorAll("[" + viewAttribute.attr$view + "=true]");
		if(0 === domElements.length)
			return null;

		var domElement = null;
		for(var i = 0; i < domElements.length; i++){
			var ele = domElements[i];

			var id = getPotentialViewId(ele),
				nspc = ele.getAttribute(viewAttribute.attr$view_namespace);
			if(util.isEmptyString(nspc, true))
				nspc = defaultNamespace;

			if(viewId === id && nspc === namespace){
				domElement = ele;
				break;
			}
		}

		return domElement;
	};

	/**
	 * 根据提供的视图ID计算最终映射到的可以呈现出来的视图
	 * @param {String} viewId 视图ID
	 * @param {String} [namespace=defaultNamespace] 视图隶属的命名空间
	 * @return {View} 最终视图
	 */
	var getFinalView = function(viewId, namespace){
		if(arguments.length < 2 || typeof namespace !== "string" || util.isEmptyString(namespace, true))
			namespace = defaultNamespace;
		buildNamespace(namespace);

		var targetView = null;

		/** 判断指定的视图是否存在 */
		if(util.isEmptyString(viewId, true) || !View.ifExists(viewId, namespace)){
			targetView = View.getActiveView() || View.getDefaultView();
		}else{
			targetView = View.ofId(viewId, namespace);
			if(!targetView.isDirectlyAccessible())/** 判断指定的视图是否支持直接访问 */
			targetView = targetView.getFallbackView();
		}

		return targetView;
	};

	/**
	 * 列举所有视图
	 * @param {String} [viewName] 视图名称。不区分大小写。如果为空字符串，则返回所有视图
	 */
	var listAllViews = function(viewName){
		if(arguments.length > 1)
			viewName = String(viewName).trim().toLowerCase();

		var arr = [];
		for(var namespace in viewInstancesMap)
			arr = arr.concat(viewInstancesMap[namespace]);

		if(arguments.length < 1 || util.isEmptyString(viewName, true))
			return arr;

		return arr.filter(function(v){
			return viewName === v.getName();
		});
	};

	/**
	 * 查找隶属于给定名称的第一个视图
	 * @param {String} viewName 视图名称
	 * @returns {View}
	 */
	var findFirstViewOfName = function(viewName){
		if(util.isEmptyString(viewName, true)){
			globalLogger.error("Empty view name!");
			return null;
		}

		viewName = String(viewName).trim().toLowerCase();

		var viewList = listAllViews(viewName);
		if(null == viewList || 0 === viewList.length){
			globalLogger.error("No view of name: {} found", viewName);
			return null;
		}

		var firstView = viewList[0];
		globalLogger.info("Found {} views of name: {}: {}, using the first one: {}@{}", viewList.length, viewName, firstView.id, firstView.namespace);

		return firstView;
	};

	var normalizeSwitchType = function(type){
		if(util.isEmptyString(type, true))
			type = View.SWITCHTYPE_VIEWNAV;
		var isNav = util.ifStringEqualsIgnoreCase(type, View.SWITCHTYPE_VIEWNAV),
			isChange = util.ifStringEqualsIgnoreCase(type, View.SWITCHTYPE_VIEWCHANGE),
			isBack = util.ifStringEqualsIgnoreCase(type, View.SWITCHTYPE_HISTORYBACK),
			isForward = util.ifStringEqualsIgnoreCase(type, View.SWITCHTYPE_HISTORYFORWARD);
		if(!isBack && !isForward && !isNav && !isChange)
			type = View.SWITCHTYPE_VIEWNAV;

		return type;
	};

	var normalizeSwitchTrigger = function(trigger){
		if(util.isEmptyString(trigger, true))
			trigger = View.SWITCHTRIGGER_APP;
		var isApp = util.ifStringEqualsIgnoreCase(trigger, View.SWITCHTRIGGER_APP),
			isNavigator = util.ifStringEqualsIgnoreCase(trigger, View.SWITCHTRIGGER_NAVIGATOR);
		if(!isApp && !isNavigator)
			trigger = View.SWITCHTRIGGER_APP;

		return trigger;
	};

	/**
	 * 切换视图
	 * @param {View} ops.srcView 源视图
	 * @param {View} ops.targetView 目标视图
	 * @param {String} ops.type 切换操作类型
	 * @param {String} ops.trigger 切换操作触发器
	 * @param {Boolean} ops.withAnimation 是否执行动画
	 * @param {Object|null} ops.params 视图参数
	 * @param {Object|null} ops.options 视图选项
	 */
	var switchView = function(ops){
		ops = util.setDftValue(ops, {
			srcView: null,
			targetView: null,

			type: View.SWITCHTYPE_VIEWNAV,
			trigger: View.SWITCHTRIGGER_APP,

			withAnimation: true,
			params: null,
			options: null
		});

		var srcView = ops.srcView,
			targetView = ops.targetView,
			type = normalizeSwitchType(ops.type),
			trigger = normalizeSwitchTrigger(ops.trigger),
			params = ops.params,
			options = ops.options;

		var isBack = util.ifStringEqualsIgnoreCase(type, View.SWITCHTYPE_HISTORYBACK),
			isForward = util.ifStringEqualsIgnoreCase(type, View.SWITCHTYPE_HISTORYFORWARD);

		var viewChangeEventData = {
			currentView: srcView,
			targetView: targetView,
			type: type,
			trigger: trigger,
			params: params,
			options: options
		};

		var render = function(){
			/* 视图参数重置 */
			var targetViewId = targetView.id;
			var targetViewNamespace = targetView.namespace;
			viewParameter.clearViewParameters(targetViewId, targetViewNamespace);

			if(isBack){
				if(viewParameter.hasParameters(viewRepresentation.PSVIEW_BACK, "")){
					/* 用过之后立即销毁，防止污染其它回退操作 */
					viewParameter.setViewParameters(targetViewId, targetViewNamespace, viewParameter.getParameters(viewRepresentation.PSVIEW_BACK, ""));
					viewParameter.clearViewParameters(viewRepresentation.PSVIEW_BACK, "");
				}
			}else if(isForward){
				if(viewParameter.hasParameters(viewRepresentation.PSVIEW_FORWARD, "")){
					/* 用过之后立即销毁，防止污染其它前进操作 */
					viewParameter.setViewParameters(targetViewId, targetViewNamespace, viewParameter.getParameters(viewRepresentation.PSVIEW_FORWARD, ""));
					viewParameter.clearViewParameters(viewRepresentation.PSVIEW_FORWARD, "");
				}
			}else
				viewParameter.setViewParameters(targetViewId, targetViewNamespace, params);

			var viewInstanceEventData = {
				sourceView: srcView,
				type: type,
				trigger: trigger,
				params: params,
				options: options
			};

			var fireViewInstanceEvent = function(evt, async){
				try{
					targetView.fire(evt, viewInstanceEventData, async);
				}catch(e){
					globalLogger.error("Error occurred while firing event: {} with data: {}", evt, viewInstanceEventData);

					if(e instanceof Error)
						console.error(e, e.stack);
					else
						console.error(e);
				}
			};

			/* 离开源视图 */
			srcView && util.removeClass(srcView.getDomElement(), "active");
			srcView && srcView.fire("leave", {targetView: targetView, type: type});

			/* 标记访问路径 */
			viewVisitStack.push(targetView);

			/* 进入新视图 */
			fireViewInstanceEvent("beforeenter", false);
			util.addClass(targetView.getDomElement(), "active");
			util.blurInputs();
			ViewLayout.ofId(targetViewId, targetViewNamespace).doLayout();
			View.fire("change", viewChangeEventData, false);
			if(!targetView.isReady()){
				readyViews.push(targetView);
				fireViewInstanceEvent("ready", false);
			}
			fireViewInstanceEvent("enter", false);
			fireViewInstanceEvent("afterenter", false);

			/* 在视图容器上标记活动视图 */
			var viewContainerObj = getViewContainerDomElement();
			viewContainerObj.setAttribute(viewAttribute.attr$active_view_id, targetViewId);
			viewContainerObj.setAttribute(viewAttribute.attr$active_view_namespace, targetViewNamespace);

			/* 更新标记为：“是否正在执行由应用触发的切换” */
			intendedSwitchType = null;

			/* 触发后置切换监听器 */
			View.fire("afterchange", viewChangeEventData);
		};

		/* 触发前置切换监听器 */
		View.fire("beforechange", viewChangeEventData, false);

		if(!ops.withAnimation)
			render();
		else{
			if(viewSwitchAnimation)
				viewSwitchAnimation.call(null, {
					srcElement: srcView? srcView.getDomElement(): null,
					targetElement: targetView.getDomElement(),
					type: type,
					trigger: trigger,
					render: render
				});
			else
				render();
		}
	};

	/**
	 * 呈现指定的视图（不操作history）
	 * @param {String} targetViewId 目标视图ID
	 * @param {String} [namespace=defaultNamespace] 视图隶属的命名空间
	 * @param {Object} ops 切换配置。详见switchView
	 */
	var showView = function(targetViewId, namespace, ops){
		if(arguments.length < 2 || typeof namespace !== "string" || util.isEmptyString(namespace, true))
			namespace = defaultNamespace;
		buildNamespace(namespace);

		ops = util.setDftValue(ops, {}, true);

		/** 检查目标视图是否存在 */
		if(!View.ifExists(targetViewId, namespace)){
			globalLogger.log("Trying to navigate to view: '{}' within namespace: '{}' with params: {}, options: {}", targetViewId, namespace, ops.params, ops.options);
			throw new Error("Target view: '" + targetViewId + "' within namespace: '" + namespace + "' does not exist!");
		}

		/* 当前活动视图 */
		var currentView = View.getActiveView();
		globalLogger.log("{}@{} → {}@{} {}", currentView? currentView.getId(): null, currentView? currentView.getNamespace(): null, targetViewId, namespace, JSON.stringify(ops));

		/* 目标视图 */
		var targetView = View.ofId(targetViewId, namespace);

		ops.srcView = currentView;
		ops.targetView = targetView;
		switchView(ops);

		return View;
	};

	ctx[name].viewInternalVariable = {
		defaultNamespace: defaultNamespace,
		defaultWidthHeightRatio: defaultWidthHeightRatio,
		get intendedSwitchType(){return intendedSwitchType;},
		set intendedSwitchType(v){intendedSwitchType = v;},

		viewInstancesMap: viewInstancesMap,
		readyViews: readyViews,
		viewVisitStack: viewVisitStack,
		get viewSwitchAnimation(){return viewSwitchAnimation;},
		set viewSwitchAnimation(animation){viewSwitchAnimation = animation;},

		getPotentialViewId: getPotentialViewId,
		getViewContainerDomElement: getViewContainerDomElement,
		getViewDomElements: getViewDomElements,
		getViewDomElementOfId: getViewDomElementOfId,
		buildNamespace: buildNamespace,
		getFinalView: getFinalView,
		listAllViews: listAllViews,
		findFirstViewOfName: findFirstViewOfName,
		switchView: switchView,
		showView: showView
	};
})(window, "View");
;(function(ctx, name){
	var util = ctx[name].util,
		eventDrive = ctx[name].eventDrive,
		ViewState = ctx[name].ViewState,
		Logger = ctx[name].Logger;

	var ViewConfigurationSet = ctx[name].ViewConfigurationSet,
		ViewContext = ctx[name].ViewContext,
		ViewLayout = ctx[name].ViewLayout,

		viewRepresentation = ctx[name].viewRepresentation,
		viewParameter = ctx[name].viewParameter,
		viewAttribute = ctx[name].viewAttribute,
		viewInternalVariable = ctx[name].viewInternalVariable;

	var globalLogger = Logger.globalLogger;

	/**
	 * 视图类
	 * @param {String} id 视图对应的DOM元素的id
	 * @param {String} [namespace=defaultNamespace] 视图隶属的命名空间，用于分模块存储视图，也用于实现不同命名空间下相同ID的视图共存
	 */
	var View = function(id, namespace){
		if(arguments.length < 2 || util.isEmptyString(namespace, true))
			namespace = viewInternalVariable.defaultNamespace;

		var domElement = null;
		var domElements = document.querySelectorAll("[" + viewAttribute.attr$view + "=true]");
		if(0 === domElements.length || (function(){
			for(var i = 0; i < domElements.length; i++){
				var ele = domElements[i];

				var viewId = viewInternalVariable.getPotentialViewId(ele),
					nspc = ele.getAttribute(viewAttribute.attr$view_namespace);
				if(util.isEmptyString(nspc, true))
					nspc = viewInternalVariable.defaultNamespace;

				if(id === viewId && nspc === namespace){
					domElement = ele;
					break;
				}
			}

			return null == domElement;
		})())
			throw new Error("View of id: '" + id + "' within namespace: '" + namespace + "' does not exist!");


		/* 存储该视图触发的各个事件的最新数据。key：事件名；value：数据 */
		var eventData = {};

		/** 上下文，用于存储视图相关的数据等 */
		var context = new ViewContext();

		/** 视图配置集合 */
		var configSet = new ViewConfigurationSet(id, namespace);

		/** 当前视图变为活动视图的次数 */
		var activeTimes = 0;

		/**
		 * 启用事件驱动机制
		 * 事件 beforeenter：视图进入前触发
		 * 事件 enter：当前视图变为活动视图时触发
		 * 事件 afterenter：视图进入后触发
		 * 事件 ready：当前视图变为活动视图时，且enter事件触发后触发
		 * 事件 leave：当前视图由活动视图变为非活动视图时触发
		 */
		eventDrive(this, domElement);

		/**
		 * 复写事件发起方法，在发起的同时记录附带的数据供后期查询
		 */
		var fire = this.fire;
		this.fire = function(name, value, async){
			eventData[name] = value;
			fire(name, value, async);
		};

		var self = this;

		util.defineReadOnlyProperty(this, "id", id);
		util.defineReadOnlyProperty(this, "namespace", namespace);

		/* 日志输出组件 */
		util.defineReadOnlyProperty(this, "logger", Logger.ofName("View#" + id));
		/* 配置对象 */
		util.defineReadOnlyProperty(this, "config", configSet);
		/* 视图上下文 */
		util.defineReadOnlyProperty(this, "context", context);

		/**
		 * 获取指定名称对应的事件最后一次被触发时所附加的数据
		 * @param {String} eventName 事件名称。亦即，事件类型
		 */
		this.getLatestEventData = function(eventName){
			return eventData[eventName];
		};

		/**
		 * 获取视图上下文
		 */
		this.getContext = function(){
			return context;
		};

		/**
		 * 清空视图上下文
		 */
		this.clearContext = function(){
			context.clear();
			return this;
		};

		/**
		 * 获取视图编号。视图编号与对应的DOM元素的ID相同
		 */
		this.getId = function(){
			return id;
		};

		/**
		 * 获取该视图隶属的命名空间
		 * @returns {String}
		 */
		this.getNamespace = function(){
			return namespace;
		};

		/**
		 * 获取视图对应的DOM元素
		 */
		this.getDomElement = function(){
			return domElement;
		};

		/**
		 * 获取视图的名称（不区分大小写）。
		 * @returns {String} 小写的名称
		 */
		this.getName = function(){
			var name = domElement.getAttribute(viewAttribute.attr$view_name);
			if(null != name){
				name = name.trim().toLowerCase();
				return name;
			}

			/* 向后兼容 data-view-group 属性 */
			name = domElement.getAttribute(viewAttribute.attr$view_group);
			if(null == name)
				return null;

			globalLogger.warn("Attribute 'data-view-group' is deprecated, please use 'data-view-name' instead");
			name = name.trim().toLowerCase();
			return name;
		};

		/**
		 * 获取视图的群组名称（不区分大小写）。
		 * @returns {String} 小写的群组名称
		 */
		this.getGroupName = function(){
			globalLogger.warn("This method is deprecated, please use 'this.getName()' instead");

			var name = domElement.getAttribute(viewAttribute.attr$view_group);
			if(null == name)
				return name;

			globalLogger.warn("Attribute 'data-view-group' is deprecated, please use 'data-view-name' instead");
			name = name.trim().toLowerCase();
			return name;
		};

		/**
		 * 在视图内查找特定元素
		 * @param selector {String} 元素选择器
		 * @return {HTMLElement} 找到的元素
		 */
		this.find = function(selector){
			return domElement.querySelector(selector);
		};

		/**
		 * 在视图内查找多个元素
		 * @param selector {String} 元素选择器
		 * @return {NodeList} 找到的元素列表
		 */
		this.findAll = function(selector){
			return domElement.querySelectorAll(selector);
		};

		/**
		 * 设置视图布局方法
		 * @param {Function} _layoutAction 布局方法
		 * @param {Boolean} [_layoutWhenLayoutChanges=true] 外层布局改变时，是否执行布局动作
		 */
		this.setLayoutAction = function(_layoutAction, _layoutWhenLayoutChanges){
			if(arguments.length < 2)
				_layoutWhenLayoutChanges = true;
			ViewLayout.ofId(id, namespace).setIfLayoutWhenLayoutChanges(!!_layoutWhenLayoutChanges).setLayoutAction(_layoutAction);

			return this;
		};

		/**
		 * 获取视图布局方法
		 */
		this.getLayoutAction = function(){
			return ViewLayout.ofId(id, namespace).getLayoutAction();
		};

		/**
		 * 判断视图参数中是否含有指定名称的参数
		 * @param {String} [name] 参数名。区分大小写
		 */
		this.hasParameter = function(name){
			if(null === name || undefined === name)
				return false;

			var params = viewParameter.getParameters(this.id, this.namespace);
			return null == params? false: (name in params);
		};

		/**
		 * 获取视图参数中指定名称的参数取值
		 * @param {String} [name] 参数名。区分大小写。如果没有指定参数名，则返回整个参数。
		 */
		this.getParameter = function(name){
			var params = viewParameter.getParameters(this.id, this.namespace);
			if(arguments.length < 1)
				return params;

			return null == params? null: params[name];
		};

		/**
		 * 搜索指定名称的参数取值。搜索顺序：
		 * 1. 视图参数
		 * 2. 视图选项
		 * 3. 地址栏参数
		 *
		 * 注：区分大小写
		 *
		 * @param {String} name 参数名
		 */
		this.seekParameter = function(name){
			if(this.hasParameter(name))
				return this.getParameter(name);

			if(View.hasActiveViewOption(name))
				return View.getActiveViewOption(name);

			var r = new RegExp("\\b" + name + "\\b=([^&\\?]*)");
			var paramValue = location.search.match(r);
			if(null == paramValue)
				return null;
			paramValue = decodeURIComponent(paramValue[1]);
			return paramValue;
		};

		/**
		 * 判断当前视图是否已经就绪
		 */
		this.isReady = function(){
			return viewInternalVariable.readyViews.indexOf(this) !== -1;
		};

		/**
		 * 判断当前视图是否为活动视图
		 */
		this.isActive = function(){
			return util.hasClass(domElement, "active");
		};

		/**
		 * 获取当前视图变为活动视图的次数
		 */
		this.getActiveTimes = function(){
			return viewInternalVariable.viewVisitStack.reduce(function(times, view){
				if(view === self)
					times++;
				return times;
			}, 0);
		};

		/**
		 * 判断当前视图是否为默认视图
		 */
		this.isDefault = function(){
			return /true/i.test(domElement.getAttribute(viewAttribute.attr$view_default));
		};

		/**
		 * 判断当前视图是否可以通过地址栏手动直接访问
		 */
		this.isDirectlyAccessible = function(){
			var attr = domElement.getAttribute(viewAttribute.attr$view_directly_accessible);
			attr = null == attr? null: attr.toLowerCase();

			if(View.isDirectlyAccessible())/** 如果设定默认可以直接访问 */
				return "false" === attr? false: true;
			else
				return "true" === attr? true: false;
		};

		/**
		 * 设置当前视图是否通过地址栏手动直接访问
		 * @param {Boolean} [isDirectlyAccessible=true] 视图是否通过地址栏手动直接访问
		 */
		this.setAsDirectlyAccessible = function(isDirectlyAccessible){
			if(arguments.length < 1)
				isDirectlyAccessible = true;

			domElement.setAttribute(viewAttribute.attr$view_directly_accessible, String(isDirectlyAccessible));
			return this;
		};

		/**
		 * 设置视图标题
		 * @param {String} title 标题。如果为null，则移除对应的DOM属性，改用网页的默认标题
		 */
		this.setTitle = function(title){
			if(null == title){
				domElement.removeAttribute(viewAttribute.attr$view_title);
				return this;
			}

			title = String(title);
			domElement.setAttribute(viewAttribute.attr$view_title, title);
			if(this.isActive())
				document.title = title;

			return this;
		};

		/**
		 * 获取视图标题
		 */
		this.getTitle = function(){
			return domElement.getAttribute(viewAttribute.attr$view_title);
		};

		/**
		 * 设置回退视图
		 * @param {String} fallbackViewId 回退视图ID，或伪视图：":default-view"，或视图名称
		 * @param {String} [fallbackViewNamespace=defaultNamespace] 回退视图隶属的命名空间
		 */
		this.setFallbackViewId = function(fallbackViewId, fallbackViewNamespace){
			if(util.isEmptyString(fallbackViewId, true))
				return this;

			if(arguments.length < 2 || util.isEmptyString(fallbackViewNamespace, true))
				fallbackViewNamespace = viewInternalVariable.defaultNamespace;
			viewInternalVariable.buildNamespace(fallbackViewNamespace);

			/* 默认视图（":default-view"） */
			if(util.ifStringEqualsIgnoreCase(viewRepresentation.PSVIEW_DEFAULT, fallbackViewId)){
				var defaultView = View.getDefaultView();
				if(null == defaultView){
					globalLogger.error("No default view found to set as fallback view");
					return this;
				}else{
					fallbackViewId = defaultView.id;
					fallbackViewNamespace = defaultView.namespace;
				}
			}else if(/^~/.test(fallbackViewId)){/* 视图名称（"~[viewName]"） */
				var viewName = fallbackViewId.substring(1);
				var firstView = viewInternalVariable.findFirstViewOfName(viewName);
				if(null == firstView){
					globalLogger.warn("No view of name: {} found to set as fallback view", viewName);
					return this;
				}

				fallbackViewId = firstView.id;
				fallbackViewNamespace = firstView.namespace;
			}

			if(!View.ifExists(fallbackViewId, fallbackViewNamespace)){
				globalLogger.warn("No view of id: {} in namespace: {} found to set as fallback view", fallbackViewId, fallbackViewNamespace);
				return this;
			}

			if(this.id === fallbackViewId && this.namespace === fallbackViewNamespace)
				return this;

			domElement.setAttribute(viewAttribute.attr$view_fallback, fallbackViewId);
			domElement.setAttribute(viewAttribute.attr$view_fallback_namespace, fallbackViewNamespace);
			return this;
		};

		/**
		 * 获取视图不能访问时需要呈现的视图
		 * 如果指定的视图不存在，则返回默认视图
		 */
		this.getFallbackView = function(){
			var view = this;
			var chain = [{id: this.id, namespace: this.namespace}];

			do{
				var viewObj = view.getDomElement();
				var fallbackViewId = viewObj.getAttribute(viewAttribute.attr$view_fallback);
				if(null == fallbackViewId || "" === (fallbackViewId = fallbackViewId.trim()))
					return View.getDefaultView();

				/* 默认视图（":default-view"） */
				if(util.ifStringEqualsIgnoreCase(viewRepresentation.PSVIEW_DEFAULT, fallbackViewId))
					return View.getDefaultView();

				var fallbackViewNamespace = viewObj.getAttribute(viewAttribute.attr$view_fallback_namespace) || viewInternalVariable.defaultNamespace;

				/* 视图名称（"~[viewName]"） */
				if(/^~/.test(fallbackViewId)){
					var viewName = fallbackViewId.substring(1);
					var firstView = viewInternalVariable.findFirstViewOfName(viewName);
					if(null == firstView){
						globalLogger.warn("No view of name: {} found to render as fallback view for view: {} in namespace: {}", this.id, this.namespace);
						return View.getDefaultView();
					}

					fallbackViewId = firstView.id;
					fallbackViewNamespace = firstView.namespace;
				}

				/** 判断是否配置且配置的视图是否存在 */
				if(!View.ifExists(fallbackViewId, fallbackViewNamespace)){
					globalLogger.debug("Configured fallback view of id: {}, namespace: {} doest not exist for view: {} in namespace: {}", fallbackViewId, fallbackViewNamespace, this.getId(), this.getNamespace());
					return View.getDefaultView();
				}else{
					view = View.ofId(fallbackViewId, fallbackViewNamespace);

					if(chain.some(function(v){
						return v.id === fallbackViewId && v.namespace === fallbackViewNamespace;
					})){/** 循环引用 */
					globalLogger.error("Cyclical reference on fallback view configuration. Chain: {}", chain);
						return View.getDefaultView();
					}

					/* 如果视图可以直接访问，则返回自身 */
					if(view.isDirectlyAccessible())
						return view;

					chain.push({
						id: fallbackViewId,
						namespace: fallbackViewNamespace
					});
				}
			}while(true);
		};
	};

	/**
	 * 启用事件驱动机制
	 * 事件 beforechange：视图切换前触发
	 * 事件 afterchange：视图切换后触发
	 */
	eventDrive(View);

	/** 视图切换操作类型：由浏览器前进操作触发 */
	util.defineReadOnlyProperty(View, "SWITCHTYPE_HISTORYFORWARD", "history.forward");
	/** 视图切换操作类型：由浏览器后退操作触发 */
	util.defineReadOnlyProperty(View, "SWITCHTYPE_HISTORYBACK", "history.back");
	/** 视图切换操作类型：由视图切换：View.navTo操作触发 */
	util.defineReadOnlyProperty(View, "SWITCHTYPE_VIEWNAV", "view.nav");
	/** 视图切换操作类型：由视图切换：View.changeTo操作触发 */
	util.defineReadOnlyProperty(View, "SWITCHTYPE_VIEWCHANGE", "view.change");

	/** 视图切换触发器：应用程序 */
	util.defineReadOnlyProperty(View, "SWITCHTRIGGER_APP", "app");
	/** 视图切换触发器：浏览器 */
	util.defineReadOnlyProperty(View, "SWITCHTRIGGER_NAVIGATOR", "navigator");
	ctx[name].ViewConstructor = View;
})(window, "View");
/**
 * 事件触发顺序：
 * 1. View.beforechange
 * 2. View.change
 * 3. view.ready
 * 4. view.beforeenter
 * 5. view.enter
 * 6. view.afterenter
 * 7. View.afterchange
 *
 * View其它事件：
 * 1) viewnotexist：要访问的视图不存在
 */
;(function(ctx, name){
	var util = ctx[name].util,
		Logger = ctx[name].Logger,
		touch = ctx[name].touch,
		layout = ctx[name].layout;

	var View = ctx[name].ViewConstructor,
		ViewContext = ctx[name].ViewContext,
		ViewState = ctx[name].ViewState,
		OperationState = ctx[name].OperationState,
		ViewLayout = ctx[name].ViewLayout,
		ChainedHandle = ctx[name].ChainedHandle,

		viewRepresentation = ctx[name].viewRepresentation,
		viewParameter = ctx[name].viewParameter,
		viewAttribute = ctx[name].viewAttribute,
		viewInternalVariable = ctx[name].viewInternalVariable;

	var globalLogger = Logger.globalLogger;

	/**
	 * 最近一次浏览状态
	 * @type {ViewState|null}
	 */
	View.currentState = null;

	/** 暴露日志组件，供第三方使用 */
	View.Logger = Logger;

	/** 暴露布局组件，供第三方使用 */
	View.layout = layout;

	/** 视图共享数据的存储上下文 */
	View.context = new ViewContext();

	/**
	 * 检查浏览器的history是否支持支持push/pop特性
	 * @returns {Boolean}
	 */
	View.checkIfBrowserHistorySupportsPushPopAction = function(){
		return util.env.isHistoryPushPopSupported;
	};

	/**
	 * 获取视图容器DOM元素
	 * @returns {HTMLElement}
	 */
	View.getViewContainerDomElement = viewInternalVariable.getViewContainerDomElement;

	/**
	 * 查找单个元素
	 * @param {HTMLElement} [rootObj] 查找的根元素
	 * @param {String} selector 选择器
	 * @returns {HTMLElement}
	 */
	View.find = function(rootObj, selector){
		if(arguments.length === 1){
			selector = arguments[0];
			rootObj = View.getViewContainerDomElement();
		}

		return rootObj.querySelector(selector);
	};

	/**
	 * 查找多个元素
	 * @param {HTMLElement} [rootObj] 查找的根元素
	 * @param {String} selector 选择器
	 * @returns {NodeList}
	 */
	View.findAll = function(rootObj, selector){
		if(arguments.length === 1){
			selector = arguments[0];
			rootObj = View.getViewContainerDomElement();
		}

		return rootObj.querySelectorAll(selector);
	};

	/**
	 * 查找给定ID对应的视图实例，如果不存在则创建，否则返回已经存在的实例
	 * @param {String} id 视图编号
	 * @param {String} [namespace=defaultNamespace] 视图隶属的命名空间
	 */
	View.ofId = function(id, namespace){
		if(arguments.length < 2 || util.isEmptyString(namespace, true))
			namespace = viewInternalVariable.defaultNamespace;
		viewInternalVariable.buildNamespace(namespace);

		var viewInstances = viewInternalVariable.viewInstancesMap[namespace];
		for(var i = 0; i < viewInstances.length; i++)
			if(viewInstances[i].getId().trim() === id.trim() && viewInstances[i].getNamespace().trim() === namespace.trim())
				return viewInstances[i];

		/* 创建实例 */
		var instance = new View(id, namespace);

		/* 加入到管理集合中 */
		viewInstances.push(instance);

		return instance;
	};

	/**
	 * 判断指定ID的视图是否存在
	 * @param {String} id 视图ID
	 * @param {String} [namespace=defaultNamespace] 视图隶属的命名空间
	 */
	View.ifExists = function(id, namespace){
		if(arguments.length < 2 || util.isEmptyString(namespace, true))
			namespace = viewInternalVariable.defaultNamespace;
		viewInternalVariable.buildNamespace(namespace);

		var viewInstances = viewInternalVariable.viewInstancesMap[namespace];

		for(var i = 0; i < viewInstances.length; i++)
			if(viewInstances[i].getId().trim() === id.trim())
				return true;

		return false;
	};

	/**
	 * 列举所有视图
	 * @param {String} [viewName] 视图名称。不区分大小写。如果为空字符串，则返回所有视图
	 */
	View.listAll = viewInternalVariable.listAllViews;

	/**
	 * 列举所有的视图名称列表
	 * @returns {String[]}
	 */
	View.listAllViewNames = function(){
		var names = viewInternalVariable.listAllViews().reduce(function(start, view){
			var viewName = view.getName();
			if(util.isEmptyString(viewName, true) || start.indexOf(viewName) !== -1)
				return start;

			start.push(viewName.toLowerCase().trim());
			return start;
		}, []);
		return names;
	};

	/**
	 * 列举所有的视图群组名称
	 */
	View.listAllGroups = function(){
		globalLogger.warn("This method is deprecated, please use 'View.listAllViewNames()' instead");
		return View.listAllViewNames();
	};

	/**
	 * 设置指定ID的视图为默认视图
	 * @param {String} viewId 视图ID
	 * @param {String} [namespace=defaultNamespace] 视图隶属的命名空间
	 */
	View.setAsDefault = function(viewId, namespace){
		if(arguments.length < 2 || util.isEmptyString(namespace, true))
			namespace = viewInternalVariable.defaultNamespace;
		viewInternalVariable.buildNamespace(namespace);

		if(util.isEmptyString(viewId, true)){
			globalLogger.warn("No view id supplied to set as default");
			return View;
		}

		/* 去除当前的默认视图的默认标记 */
		var viewObjs = viewInternalVariable.getViewDomElements();
		for(var i = 0; i < viewObjs.length; i++)
			viewObjs[i].removeAttribute(viewAttribute.attr$view_default);

		/* 设置新的默认视图 */
		var viewObj = viewInternalVariable.getViewDomElementOfId(viewId, namespace);
		if(null == viewObj){
			globalLogger.error("No dom element for view of id: '{}' namespace: '{}' found to set as default", viewId, namespace);
			return View;
		}
		viewObj.setAttribute(viewAttribute.attr$view_default, "true");

		return View;
	};

	/**
	 * 判断视图默认是否可以直接访问
	 */
	View.isDirectlyAccessible = function(){
		var attr = viewAttribute.attr$view_directly_accessible;
		var rootFlag1 = View.getViewContainerDomElement().getAttribute(attr),
			rootFlag2 = document.documentElement.getAttribute(attr);

		/* 历史兼容：如果视图容器上没有，则从 html 节点上搜寻 */
		var rootFlag;
		if(null === rootFlag1){
			if(null === rootFlag2){
				return false;
			}else{
				rootFlag = rootFlag2;
				globalLogger.warn("Declaring view attribute: '{}' in <html> element is deprecated, you should declare in the view container's dom element", attr);
			}
		}else{
			if(null === rootFlag2){
				rootFlag = rootFlag1;
			}else{
				rootFlag = rootFlag1;

				globalLogger.warn("Found view attribute: '{}' in the view container's dom element, ingoring the one declared in <html> element", attr);
			}
		}

		return util.ifStringEqualsIgnoreCase("true", rootFlag);
	};

	/**
	 * 设置视图默认是否可以直接访问
	 * @param {Boolean} accessible 是否可以直接访问
	 */
	View.setIsDirectlyAccessible = function(accessible){
		document.documentElement.setAttribute(viewAttribute.attr$view_directly_accessible, String(!!accessible).toLowerCase());
		return View;
	};

	/**
	 * 设置特定视图是否可以直接访问
	 * @param {String} viewId 视图ID
	 * @param {String} viewNamespace 视图命名空间
	 * @param {Boolean} accessible 视图是否可以直接访问
	 * @returns {View}
	 */
	View.setViewIsDirectlyAccessible = function(viewId, viewNamespace, accessible){
		if(arguments.length < 2)
			throw new Error("Illegal argument length. Call with arguments: 'viewId[, viewNamespace], accessible'");
		if(arguments.length < 3){
			accessible = arguments[1];
			viewNamespace = viewInternalVariable.defaultNamespace;
		}

		var viewObj = viewInternalVariable.getViewDomElementOfId(viewId, viewNamespace);
		if(null == viewObj){
			globalLogger.error("No view of id: {}, namespace: {} found to set is directly accessible or not", viewId, viewNamespace);
			return View;
		}

		viewObj.setAttribute(viewAttribute.attr$view_directly_accessible, String(!!accessible).toLowerCase());
		return View;
	};

	/**
	 * 获取当前的活动视图。如果没有视图处于活动状态，则返回null
	 */
	View.getActiveView = function(){
		var viewInstances = viewInternalVariable.listAllViews();
		for(var i = 0; i < viewInstances.length; i++)
			if(viewInstances[i].isActive())
				return viewInstances[i];

		return null;
	};

	/**
	 * 获取默认视图。如果没有默认视图，则返回null
	 */
	View.getDefaultView = function(){
		var viewInstances = viewInternalVariable.listAllViews();
		for(var i = 0; i < viewInstances.length; i++)
			if(viewInstances[i].isDefault())
				return viewInstances[i];

		return null;
	};

	/**
	 * 设置视图切换动画
	 * @param {Function} animationFunction 视图切换动画
	 * @return {View} View
	 */
	View.setSwitchAnimation = function(animationFunction){
		if(!(animationFunction instanceof Function))
			throw new Error("Invalid argument, type of 'Function' is required");

		viewInternalVariable.viewSwitchAnimation = animationFunction;

		return View;
	};

	/**
	 * 获取设置的视图切换动画
	 * @return {Function} 视图切换动画
	 */
	View.getSwitchAnimation = function(){
		return viewInternalVariable.viewSwitchAnimation;
	};

	/**
	 * 获取当前的活动视图的视图选项集合
	 */
	View.getActiveViewOptions = function(){
		var viewInfo = viewRepresentation.parseViewInfoFromHash(location.hash);
		return null == viewInfo? null: viewInfo.options;
	};

	/**
	 * 判断当前的活动视图的视图选项中是否含有特定名称的选项。如果视图选项为空，或对应名称的选项不存在，则返回false
	 * @param {String} name 选项名称
	 */
	View.hasActiveViewOption = function(name){
		var options = View.getActiveViewOptions();
		return null == options? false: (name in options);
	};

	/**
	 * 获取当前的活动视图的视图选项中特定名称的选项。如果视图选项为空，或对应名称的选项不存在，则返回null
	 * @param {String} name 选项名称
	 */
	View.getActiveViewOption = function(name){
		var options = View.getActiveViewOptions();
		return null == options? null: options[name];
	};

	/**
	 * 为当前的活动视图的视图选项中设置特定名称的选项
	 * @param {String} name 选项名称
	 * @param {String} value 选项取值
	 */
	View.setActiveViewOption = function(name, value){
		if(util.isEmptyString(name, true)){
			globalLogger.error("Option name should not be empty");
			return View;
		}

		var activeView = View.getActiveView();
		if(null == activeView){
			globalLogger.error("No view is active to set option {} = {}", name, value);
			return View;
		}

		name = String(name).trim();
		value = String(value).trim();

		var options = View.getActiveViewOptions() || {};
		options[name] = value;

		ViewState.replaceViewState(activeView.getId(), activeView.getNamespace(), View.currentState? View.currentState.sn: null, options);

		return View;
	};

	/**
	 * 以“压入历史堆栈”的方式略过视图，使得在不展现视图的前提下达到返回时可以返回到该视图上的目的
	 * @param {String} targetViewId 目标视图ID
	 * @param {String} [targetViewNamespace=defaultNamespace] 目标视图隶属的命名空间
	 */
	View.passBy = function(targetViewId, targetViewNamespace){
		if(arguments.length < 2 || typeof targetViewNamespace !== "string" || util.isEmptyString(targetViewNamespace, true)){
			targetViewNamespace = viewInternalVariable.defaultNamespace;
		}
		viewInternalVariable.buildNamespace(targetViewNamespace);

		/* 默认视图（":default-view"） */
		if(util.ifStringEqualsIgnoreCase(viewRepresentation.PSVIEW_DEFAULT, targetViewId)){
			var defaultView = View.getDefaultView();
			if(null == defaultView){
				globalLogger.error("No default view found");
				return View;
			}

			targetViewId = defaultView.id;
			targetViewNamespace = defaultView.namespace;
		}
		/* 视图名称（"~[viewName]"） */
		if(/^~/.test(targetViewId)){
			var viewName = targetViewId.substring(1);
			var firstView = viewInternalVariable.findFirstViewOfName(viewName);
			if(null == firstView)
				return View;

			targetViewId = firstView.id;
			targetViewNamespace = firstView.namespace;
		}

		/* 检查目标视图是否存在 */
		if(!View.ifExists(targetViewId, targetViewNamespace)){
			console.error(new Error("Target view: '" + targetViewId + "' within namespace: '" + targetViewNamespace + "' does not exist!"));
			return View;
		}

		ViewState.pushViewState(targetViewId, targetViewNamespace);
		return View;
	};

	/**
	 * 获取指定名称的链式处理器。如果对应实例尚不存在，则自动创建一个
	 * @param {String} name 处理器名称
	 * @returns {ChainedHandle}
	 */
	View.getChainedHandleByName = function(name){
		return ChainedHandle.ofName(name);
	};

	/**
	 * 以“压入历史堆栈”的方式切换视图
	 * @param {String} targetViewId 目标视图ID
	 * @param {String} [targetViewNamespace=defaultNamespace] 目标视图隶属的命名空间
	 * @param {Object} ops 切换配置。详见viewInternalVariable.showView
	 * @param {Object} ops.options 视图选项
	 */
	View.navTo = function(targetViewId, targetViewNamespace, ops){
		if(arguments.length < 2 || typeof targetViewNamespace !== "string" || util.isEmptyString(targetViewNamespace, true)){
			ops = targetViewNamespace;
			targetViewNamespace = viewInternalVariable.defaultNamespace;
		}
		viewInternalVariable.buildNamespace(targetViewNamespace);

		targetViewId = targetViewId.trim();
		ops = util.setDftValue(ops, {});

		var currentView = View.getActiveView();/* 当前活动视图 */

		/** 伪视图支持 */
		/* 回退操作(":back") */
		if(util.ifStringEqualsIgnoreCase(viewRepresentation.PSVIEW_BACK, targetViewId)){
			View.back(ops);
			return View;
		}
		/* 前进操作（":forward"） */
		if(util.ifStringEqualsIgnoreCase(viewRepresentation.PSVIEW_FORWARD, targetViewId)){
			View.forward(ops);
			return View;
		}
		/* 默认视图（":default-view"） */
		if(util.ifStringEqualsIgnoreCase(viewRepresentation.PSVIEW_DEFAULT, targetViewId)){
			var defaultView = View.getDefaultView();
			if(null == defaultView){
				globalLogger.error("No default view found");
				return View;
			}

			targetViewId = defaultView.id;
			targetViewNamespace = defaultView.namespace;
		}
		/* 视图名称（"~[viewName]"） */
		if(/^\s*~/.test(targetViewId)){
			var viewName = targetViewId.replace(/^\s*~+/, "").trim();
			var firstView = viewInternalVariable.findFirstViewOfName(viewName);
			if(null == firstView)
				return View;

			targetViewId = firstView.id;
			targetViewNamespace = firstView.namespace;
		}
		/* 是否是外部链接 */
		if(/^(http|https|ftp):\/\//gim.test(targetViewId)){
			window.location.assign(targetViewId);
			return View;
		}
		/* 是否是外部链接 */
		if(/^\s*@+/.test(targetViewId)){
			var path = targetViewId.replace(/^\s*@+/, "").trim();
			if("" === path){
				globalLogger.warn("Empty target: '{}'", targetViewId);
				return;
			}

			window.location.assign(path);
			return View;
		}

		/* 检查目标视图是否存在 */
		if(!View.ifExists(targetViewId, targetViewNamespace)){
			globalLogger.log("Trying to navigate to view: '{}' within namespace: '{}' with params: {}, options: {}", targetViewId, targetViewNamespace, ops.params, ops.options);

			var e = new Error("Target view: '" + targetViewId + "' within namespace: '" + targetViewNamespace + "' does not exist! Firing event 'viewnotexist'...");
			console.error(e);
			View.fire("viewnotexist", {targetViewId: targetViewId, targetViewNamespace: targetViewNamespace});
			return View;
		}

		ops.type = View.SWITCHTYPE_VIEWNAV;
		ops.trigger = View.SWITCHTRIGGER_APP;
		ViewState.pushViewState(targetViewId, targetViewNamespace, null, null == ops? null: ops.options);
		viewInternalVariable.intendedSwitchType = View.SWITCHTYPE_VIEWNAV;
		viewInternalVariable.showView(targetViewId, targetViewNamespace, ops);

		return View;
	};

	/**
	 * 以“替换当前堆栈”的方式切换视图
	 * @param targetViewId 目标视图ID
	 * @param {String} [targetViewNamespace=defaultNamespace] 视图隶属的命名空间
	 * @param {Object} ops 切换配置。详见switchView
	 * @param {Object} ops.options 视图选项
	 */
	View.changeTo = function(targetViewId, targetViewNamespace, ops){
		if(arguments.length < 2 || typeof targetViewNamespace !== "string" || util.isEmptyString(targetViewNamespace, true)){
			ops = targetViewNamespace;
			targetViewNamespace = viewInternalVariable.defaultNamespace;
		}
		viewInternalVariable.buildNamespace(targetViewNamespace);

		ops = util.setDftValue(ops, {});

		var currentView = View.getActiveView();/* 当前活动视图 */

		/* 默认视图（":default-view"） */
		if(util.ifStringEqualsIgnoreCase(viewRepresentation.PSVIEW_DEFAULT, targetViewId)){
			var defaultView = View.getDefaultView();
			if(null == defaultView){
				globalLogger.error("No default view found");
				return;
			}

			targetViewId = defaultView.id;
			targetViewNamespace = defaultView.namespace;
		}
		/* 视图名称（"~[viewName]"） */
		if(/^\s*~/.test(targetViewId)){
			var viewName = targetViewId.replace(/^\s*~+/, "").trim();
			var firstView = viewInternalVariable.findFirstViewOfName(viewName);
			if(null == firstView)
				return View;

			targetViewId = firstView.id;
			targetViewNamespace = firstView.namespace;
		}
		/* 是否是外部链接 */
		if(/^(http|https|ftp):\/\//gim.test(targetViewId)){
			window.location.replace(targetViewId);
			return View;
		}
		/* 是否是外部链接 */
		if(/^\s*@+/.test(targetViewId)){
			var path = targetViewId.replace(/^\s*@+/, "").trim();
			if("" === path){
				globalLogger.warn("Empty target: '{}'", targetViewId);
				return;
			}

			window.location.replace(path);
			return View;
		}

		/* 检查目标视图是否存在 */
		if(!View.ifExists(targetViewId, targetViewNamespace)){
			globalLogger.log("Trying to navigate to view: '{}' within namespace: '{}' with params: {}, options: {}", targetViewId, targetViewNamespace, ops.params, ops.options);

			var e = new Error("Target view: '" + targetViewId + "' within namespace: '" + targetViewNamespace + "' does not exist! Firing event 'viewnotexist'...");
			console.error(e);
			View.fire("viewnotexist", {targetViewId: targetViewId, targetViewNamespace: targetViewNamespace});
			return View;
		}

		ops.type = View.SWITCHTYPE_VIEWCHANGE;
		ops.trigger = View.SWITCHTRIGGER_APP;
		ViewState.replaceViewState(targetViewId, targetViewNamespace, null, null == ops? null: ops.options);
		viewInternalVariable.intendedSwitchType = View.SWITCHTYPE_VIEWCHANGE;
		viewInternalVariable.showView(targetViewId, targetViewNamespace, ops);

		return View;
	};

	var noViewToNavBackAction = null;

	/**
	 * 设置在“没有视图可以继续向前返回”的情况下要执行的动作
	 * @param {Function} action 要执行的动作
	 */
	View.setNoViewToNavBackAction = function(action){
		if(typeof action !== "function")
			throw new Error("Invalid argument! Type of 'Function' is required");

		noViewToNavBackAction = action;
		return View;
	};

	/**
	 * 回退到上一个视图
	 * @param {Object} ops 切换配置
	 * @param {Object | null} ops.params 视图切换参数
	 */
	View.back = function(ops){
		viewInternalVariable.intendedSwitchType = View.SWITCHTYPE_HISTORYBACK;

		/* 清除旧数据，并仅在指定了参数时才设置参数，防止污染其它回退操作 */
		viewParameter.clearViewParameters(viewRepresentation.PSVIEW_BACK, "");
		if(null != ops && "params" in ops)
			viewParameter.setViewParameters(viewRepresentation.PSVIEW_BACK, "", ops.params);

		//globalLogger.debug("@@@ naving back. {}, {}", View.ifCanGoBack(), history.length);

		if(View.ifCanGoBack() || typeof noViewToNavBackAction !== "function")
			history.go(-1);
		else
			util.try2Call(noViewToNavBackAction);

		return View;
	};

	/**
	 * 前进到下一个视图
	 * @param {Object} ops 切换配置
	 * @param {Object | null} ops.params 视图切换参数
	 */
	View.forward = function(ops){
		viewInternalVariable.intendedSwitchType = View.SWITCHTYPE_HISTORYFORWARD;

		/* 清除旧数据，并仅在指定了参数时才设置参数，防止污染其它前进操作 */
		viewParameter.clearViewParameters(viewRepresentation.PSVIEW_FORWARD, "");
		if(null != ops && "params" in ops)
			viewParameter.setViewParameters(viewRepresentation.PSVIEW_FORWARD, "", ops.params);

		history.go(1);

		return View;
	};

	/** 文档标题 */
	var documentTitle = document.title;

	/**
	 * 设置文档标题。开发者可以设定视图级别的标题，但如果特定视图没有自定义标题，将使用文档标题来呈现
	 * @param {String} title 文档标题
	 */
	View.setDocumentTitle = function(title){
		if(util.isEmptyString(title, true)){
			globalLogger.warn("Invalid document title: " + title);
			return View;
		}

		document.title = documentTitle = title;
		return View;
	};

	/**
	 * 添加一次性的浏览器回退事件监听。该监听可以通过浏览器前进和回退重新执行
	 * @param {Function} callback 回调方法
	 */
	View.onceHistoryBack = function(callback){
		if(typeof callback !== "function")
			throw new Error("Invalid argument! Type of 'Function' is required");

		OperationState.pushState(util.randomString(), callback);
		return View;
	};

	/**
	 * 根据当前视图容器的样式重新执行所有视图的布局
	 * @returns View
	 */
	View.reDoLayout = function(){
		viewInternalVariable.listAllViews().forEach(function(v){
			util.try2Call(v.getLayoutAction());
		});
		return View;
	};

	/**
	 * 根据当前位置确定是否可以向前返回
	 * @returns {Boolean}
	 */
	View.ifCanGoBack = ViewState.ifCanGoBack;

	var isViewInited = false,/* 视图是否已经被初始化 */
		isViewReady = false;/* 视图是否已经就绪 */
	var markViewToBeInited,/* 标记视图准备初始化 */
		markViewInited,/* 标记视图已完成初始化 */
		markViewReady,/* 标记视图就绪 */

		viewInitializer,/* 视图初始化器 */
		viewInitializerExecTime;/* 视图初始化器不为空时，其自动执行时机。domready：DOM就绪后执行；rightnow：view.js被加载后立即执行。默认为：domready */




	/**
	 * 响应地址栏的hash进行渲染操作
	 */
	var stateChangeListener =  function(e){
		var currentActiveView = View.getActiveView();
		var currentActiveViewId = null == currentActiveView? null: currentActiveView.getId();
		var currentActiveViewNamespace = null == currentActiveView? null: currentActiveView.getNamespace();

		globalLogger.log("{} Current: {}", util.env.isHistoryPushPopSupported? "State popped!": "Hash changed!", currentActiveView && currentActiveView.getId());
		globalLogger.log("↑ {}", util.env.isHistoryPushPopSupported? JSON.stringify(e.state): location.hash);

		/* 视图切换 */
		var newViewId,
			newViewNamespace,
			type = View.SWITCHTYPE_VIEWNAV, options, targetView = null;
		if(null == e.state){/* IE9 */
			type = View.SWITCHTYPE_VIEWNAV;

			var targetViewId, targetViewNamespace;
			var viewInfo = viewRepresentation.parseViewInfoFromHash(location.hash);
			if(null == viewInfo){
				targetView = currentActiveView;

				targetViewId = currentActiveViewId;
				targetViewNamespace = currentActiveViewNamespace;
			}else{
				newViewId = viewInfo.viewId;
				newViewNamespace = viewInfo.viewNamespace;

				targetViewId = newViewId;
				targetViewNamespace = newViewNamespace;
				// targetView = viewInternalVariable.getFinalView(newViewId, newViewNamespace);
				// if(null != targetView){
				// 	targetViewId = targetView.getId();
				// 	targetViewNamespace = targetView.getNamespace();
				// }
			}

			if(null != targetViewId && View.ifExists(targetViewId, targetViewNamespace), targetView = View.ofId(targetViewId, targetViewNamespace)){
				var isTargetViewAsSpecified = targetViewId == newViewId && targetViewNamespace == newViewNamespace,
					isTargetViewRemainsCurrent = targetViewId == currentActiveViewId && targetViewNamespace == currentActiveViewNamespace;

				/**
				 * 如果目标视图仍然是当前视图，则不能更改地址栏中的选项内容
				 * 如果最终视图和地址栏中的视图不是一个视图，则不能再将选项传递给最终视图
				 */
				options = isTargetViewRemainsCurrent? (View.currentState? View.currentState.options: null): (isTargetViewAsSpecified? viewInfo.options: null);

				/* history堆栈更新 */
				ViewState.replaceViewState(targetViewId, targetViewNamespace, null, options);

				/* 视图切换 */
				viewInternalVariable.showView(targetView.getId(), targetView.getNamespace(), {type: type, options: options});
			}
		}else if(ViewState.isConstructorOf(e.state)){
			var poppedNewState = e.state;
			newViewId = poppedNewState.viewId;
			newViewNamespace = poppedNewState.viewNamespace;

			if(View.ifExists(newViewId, newViewNamespace)){
				targetView = View.ofId(newViewId, newViewNamespace);
				options = poppedNewState.options;
			}else{
				globalLogger.warn("Popped view: '" + newViewId + "' within namespace: '" + newViewNamespace + "' does not exist, keeping current");
				targetView = currentActiveView;

				/* 如果最终视图和地址栏中的视图不是一个视图，则不能再将选项传递给最终视图 */
				options = null;
			}
			var targetViewId = targetView.getId();
			var targetViewNamespace = targetView.getNamespace();

			if(View.currentState != null)
				type = poppedNewState.sn < View.currentState.sn? View.SWITCHTYPE_HISTORYBACK: View.SWITCHTYPE_HISTORYFORWARD;

			/* history堆栈更新 */
			ViewState.replaceViewState(targetViewId, targetViewNamespace, poppedNewState.sn, options);

			/* 视图切换 */
			viewInternalVariable.showView(targetViewId, targetViewNamespace, {
				type: type,
				trigger: null != viewInternalVariable.intendedSwitchType? View.SWITCHTRIGGER_APP: View.SWITCHTRIGGER_NAVIGATOR,
				options: options
			});
		}else{
			globalLogger.info("Skip state: {}", e.state);
		}
	};


	var init = function(){
		markViewToBeInited();

		/* 暂存浏览器标题 */
		documentTitle = document.title;

		/* 标记识别的操作系统 */
		document.documentElement.setAttribute(viewAttribute.attr$view_os, util.env.isIOS? "ios": (util.env.isAndroid? "android": (util.env.isWindowsPhone? "wp": "unknown")));

		/* 事件监听 */
		window.addEventListener(util.env.isHistoryPushPopSupported? "popstate": "hashchange", stateChangeListener);

		/* 识别视图容器。如果没有元素声明为视图容器，则认定body为视图attr$viewId容器 */
		(function(){
			var objs = document.querySelectorAll("[" + viewAttribute.attr$view_container + "]");
			if(0 === objs.length){
				document.body.setAttribute(viewAttribute.attr$view_container, "");
			}else
				for(var i = 1; i < objs.length; i++)
					objs[i].removeAttribute(viewAttribute.attr$view_container);
		})();
		View.getViewContainerDomElement().setAttribute(viewAttribute.attr$view_state, "initing");

		/* 扫描文档，遍历定义视图 */
		var viewObjs = viewInternalVariable.getViewDomElements();
		var initedViews = [];
		[].forEach.call(viewObjs, function(viewObj){
			var namespace = viewObj.getAttribute(viewAttribute.attr$view_namespace);
			if(util.isEmptyString(namespace, true)){
				namespace = viewInternalVariable.defaultNamespace;
				viewObj.setAttribute(viewAttribute.attr$view_namespace, namespace);
			}

			var viewId = viewInternalVariable.getPotentialViewId(viewObj);

			/* 定义视图 */
			var view = View.ofId(viewId, namespace);
			if(initedViews.indexOf(view) !== -1){
				globalLogger.warn("Multiple view of id: '{}' within namespace: '{}' exists", view.id, view.namespace);
				return;
			}
			initedViews.push(view);

			/* 去除可能存在的激活状态 */
			util.removeClass(viewObj, "active");

			/* 添加样式类 */
			util.addClass(viewObj, "view");


			/* 视图标题自动设置 */
			view.on("enter", function(){
				var specifiedTitle = viewObj.getAttribute(viewAttribute.attr$view_title);
				document.title = null == specifiedTitle? documentTitle: specifiedTitle;
			});
		});

		/* 默认视图 */
		var dftViewObj = null;

		/** 确定默认视图 */
		var determineDefaultView = function(){
			var dftViewObj = null;
			var dftViewObjIndex = -1;
			for(var i = 0; i < viewObjs.length; i++)
				if("true" === viewObjs[i].getAttribute(viewAttribute.attr$view_default)){
					dftViewObjIndex = i;
					break;
				}

			if(-1 !== dftViewObjIndex){
				dftViewObj = viewObjs[dftViewObjIndex];

				/* 删除多余的声明 */
				for(var i = dftViewObjIndex + 1; i < viewObjs.length; i++)
					if("true" === viewObjs[i].getAttribute(viewAttribute.attr$view_default))
						viewObjs[i].removeAttribute(viewAttribute.attr$view_default);
			}else if(0 !== viewObjs.length){
				dftViewObj = viewObjs[0];
				dftViewObj.setAttribute(viewAttribute.attr$view_default, "true");
			}else
				globalLogger.warn("No view exists to serve as default view");

			return dftViewObj;
		};

		/* 确定默认视图，并添加激活标识 */
		dftViewObj = determineDefaultView();
		if(null != dftViewObj)
			util.addClass(dftViewObj, "active");

		/**
		 * 指令：data-view-rel配置视图导向
		 * 		取值：[view-id(?:@view-namespace)] 目标视图ID
		 * 		取值：:back 回退至上一个视图
		 * 		取值：:forward 前进至下一个视图
		 * 		取值：:default-view 导向至默认视图
		 * 		取值：~viewName 导向至声明为该名称的第一个视图
		 * 	    取值：@[url] 导向至外部页面
		 *
		 * 指令：data-view-rel-type 配置视图更新方式
		 * 		取值：nav（默认） 使用history.pushState以“导向”的方式切换至新视图。采用此方式时，切换多少次视图，就需要返回多少次才能回到初始界面
		 * 		取值：change 使用history.replaceState以“更新”的方式切换至新视图。采用此方式时，无论切换多少次视图，仅需1次就能回到初始界面
		 *
		 * 指令：data-view-rel-disabled 配置导向开关
		 * 		取值：true 触摸时不导向至通过data-view-rel指定的视图
		 */
		touch.addTapListener(document.documentElement, function(e){
			var eventTarget = e.changedTouches? e.changedTouches[0].target: e.target;

			/* 视图导向定义检测 */
			var targetViewId, targetViewNamespace = viewInternalVariable.defaultNamespace;
			var tmp = eventTarget;
			while(null == tmp.getAttribute(viewAttribute.attr$view_rel)){
				tmp = tmp.parentNode;

				if(!(tmp instanceof HTMLElement))
					tmp = null;
				if(null == tmp)
					break;
			}
			if(null != tmp){
				targetViewId = tmp.getAttribute(viewAttribute.attr$view_rel);
				targetViewNamespace = tmp.getAttribute(viewAttribute.attr$view_rel_namespace);
			}

			if(util.isEmptyString(targetViewNamespace, true))
				targetViewNamespace = viewInternalVariable.defaultNamespace;

			if(null == targetViewId || "" === targetViewId.trim())
				return;

			/* 视图切换禁用标志检测 */
			var isViewRelDisabled = "true" === tmp.getAttribute(viewAttribute.attr$view_rel_disabled);

			/* 如果当前禁用视图跳转 */
			if(isViewRelDisabled)
				return;

			/* 阻止ghost click */
			e.preventDefault();

			/* 是否是外部链接 */
			if(/^(http|https|ftp):\/\//gim.test(targetViewId)){
				window.location.href = targetViewId;
				return;
			}

			/* 是否是外部链接 */
			if(/^\s*@+/.test(targetViewId)){
				var path = targetViewId.replace(/^\s*@+/, "").trim();
				if("" === path){
					globalLogger.warn("Empty file path for data-view-rel: '{}'", targetViewId);
					return;
				}

				window.location.href = path;
				return;
			}

			/* 回退操作(":back") */
			if(util.ifStringEqualsIgnoreCase(viewRepresentation.PSVIEW_BACK, targetViewId)){
				//globalLogger.debug("@@@ try to nav back, history length: " + history.length);
				View.back();
				return;
			}

			/* 前进操作（":forward"） */
			if(util.ifStringEqualsIgnoreCase(viewRepresentation.PSVIEW_FORWARD, targetViewId)){
				View.forward();
				return;
			}

			/* 默认视图（":default-view"） */
			if(util.ifStringEqualsIgnoreCase(viewRepresentation.PSVIEW_DEFAULT, targetViewId)){
				var defaultView = View.getDefaultView();
				if(null != defaultView){
					targetViewId = defaultView.id;
					targetViewNamespace = defaultView.namespace;
				}
			}

			/* 视图名称（"~[viewName]"） */
			var options = null;
			if(/^~/.test(targetViewId)){
				var r = /^~([^!]+)(?:!+(.*))?/;
				var m = targetViewId.match(r);
				if(null == m)
					return;

				var viewName = m[1].trim(), _options = util.parseParams(m[2]);
				var firstView = viewInternalVariable.findFirstViewOfName(viewName);
				if(null == firstView)
					return;

				targetViewId = firstView.id;
				targetViewNamespace = firstView.namespace;
				options = _options;
			}else{
				var rst = viewRepresentation.parseViewInfoFromHash("#" + targetViewId);

				targetViewNamespace = targetViewId.indexOf(rst.viewId + "@" + targetViewNamespace) === 0? targetViewNamespace: rst.viewNamespace;
				targetViewId = rst.viewId;
				options = rst.options;
			}

			/* 允许同一视图连续跳转 */

			var relType = tmp.getAttribute(viewAttribute.attr$view_rel_type);
			relType = util.isEmptyString(relType, true)? "nav": relType;
			if(!/^(?:nav)|(?:change)$/.test(relType)){
				globalLogger.warn("Unknown view switch type: {}. {}", relType, tmp);
				relType = "nav";
			}

			/* 呈现ID指定的视图 */
			View[relType + "To"](targetViewId, targetViewNamespace, {options: options});
		}, {useCapture: true});

		/* 使能属性：data-view-whr */
		(function(){
			/* 移除可能会影响布局的虚拟键盘 */
			util.blurInputs();
			var whr = View.getViewContainerDomElement().getAttribute(viewAttribute.attr$view_whr);

			/* 历史兼容：如果视图容器上没有，则从 html 节点上搜寻 */
			if(null == whr || (whr = whr.trim().toLowerCase()) === ""){
				whr = document.documentElement.getAttribute(viewAttribute.attr$view_whr);
				if(null != whr && (whr = whr.trim().toLowerCase()) !== ""){
					globalLogger.warn("Declaring view attribute: '{}' in <html> element is deprecated, you should declare in the view container's dom element", viewAttribute.attr$view_whr);
				}
			}

			if(null == whr || (whr = whr.trim().toLowerCase()) === ""){
				layout.init().doLayout(false);
				return;
			}
			if("unlimited" === whr)
				return;

			var r = /(\d+(?:\.\d*)?)\s*\/\s*(\d+(?:\.\d*)?)/i;
			var tmp = whr.match(r);
			if(null == tmp){
				globalLogger.warn("Invalid view expected width height ratio: {}. Value such as '320/568'(iPhone 5) is valid. Using '{}' instead", whr, viewInternalVariable.defaultWidthHeightRatio);
				tmp = viewInternalVariable.defaultWidthHeightRatio.exec(r);
			}else
				globalLogger.info("Using specified expected width height ratio: {}", whr);

			layout.setExpectedWidthHeightRatio(Number(tmp[1])/Number(tmp[2])).init();
			layout.doLayout(false);
		})();

		globalLogger.info("Marking View as initialized and ready");

		/* 标记视图已完成初始化 */
		markViewInited();

		/* 标记视图就绪 */
		markViewReady();

		/* 呈现指定视图 */
		(function(){
			/* 如果要呈现的视图，是View.ready方法执行后通过API跳转过来的，则不再重复处理 */
			if(null != View.currentState){
				globalLogger.debug("Skip showing specified view");
				return;
			}

			var defaultViewId = null == dftViewObj? null: viewInternalVariable.getPotentialViewId(dftViewObj),
				defaultViewNamespace = null == dftViewObj? null: (dftViewObj.getAttribute(viewAttribute.attr$view_namespace) || viewInternalVariable.defaultNamespace);

			var viewInfo = viewRepresentation.parseViewInfoFromHash(location.hash);
			var specifiedViewId = null == viewInfo? null: viewInfo.viewId,
				specifiedViewNamespace = null == viewInfo? null: viewInfo.viewNamespace,
				options = null == viewInfo? null: viewInfo.options;

			var targetViewId = null,
				targetViewNamespace = null;
			var isDefaultViewIdEmpty = util.isEmptyString(defaultViewId, true),
				isSpecifiedViewIdEmpty = util.isEmptyString(specifiedViewId, true);
			if(!isSpecifiedViewIdEmpty && View.ifExists(specifiedViewId, specifiedViewNamespace)){
				targetViewId = specifiedViewId;
				targetViewNamespace = specifiedViewNamespace;
			}else{
				globalLogger.warn("No view of id: '{}' namespace: '{}'(specified in the location hash) found, trying to show the default view", specifiedViewId, specifiedViewNamespace);

				if(!isDefaultViewIdEmpty && View.ifExists(defaultViewId, defaultViewNamespace)){
					targetViewId = defaultViewId;
					targetViewNamespace = defaultViewNamespace;
				}else{
					globalLogger.warn("No default view of id: '{}' within namespace: '{}' found", defaultViewId, defaultViewNamespace);

					targetViewId = null;
					targetViewNamespace = null;
				}
			}

			var isTargetViewIdEmpty = util.isEmptyString(targetViewId, true);
			if(isTargetViewIdEmpty){
				globalLogger.warn("Can not determine the initial view!");
				return;
			}

			var targetView = viewInternalVariable.getFinalView(targetViewId, targetViewNamespace);
			if(null == targetView){
				globalLogger.error("No final view found for view of id: '{}', namespace: '{}'", targetViewId, targetViewNamespace);
				return;
			}

			targetViewId = targetView.getId();
			targetViewNamespace = targetView.getNamespace();
			var ifViewRemainsTheSame = targetViewId == specifiedViewId && targetViewNamespace == specifiedViewNamespace;
			/* 如果最终视图和地址栏中的视图不是一个视图，则不能再将选项传递给最终视图 */
			if(!ifViewRemainsTheSame)
				options = null;

			globalLogger.info("Showing view: '{}' within namespace: '{}'", targetViewId, targetViewNamespace);

			ViewState.replaceViewState(targetViewId, targetViewNamespace, null, options);
			var currentActiveView = View.getActiveView();
			viewInternalVariable.switchView({
				srcView: currentActiveView == targetView? null: currentActiveView,
				targetView: targetView,
				withAnimation: false,
				params: null
			});
		})();
	};

	/**
	 * 添加“视图将要初始化”监听器
	 */
	View.beforeInit = (function(){
		/* 挂起的回调方法列表 */
		var callbacks = [];

		markViewToBeInited = function(){
			for(var i = 0; i < callbacks.length; i++)
				util.try2Call(callbacks[i]);
			callbacks = [];
		};

		markViewInited = function(){
			isViewInited = true;
		};

		/**
		 * 初始化前执行的方法
		 * @param {Function} callback 回调方法
		 */
		return function(callback){
			/* 如果已经初始化，则不再执行，立即返回 */
			if(isViewInited)
				return View;

			if(callbacks.indexOf(callback) === -1)
				callbacks.push(callback);
			return View;
		};
	})();

	/**
	 * 添加“视图就绪”监听器
	 */
	View.ready = (function(){
		/* 挂起的回调方法列表 */
		var callbacks = [];
		markViewReady = function(){
			isViewReady = true;

			for(var i = 0; i < callbacks.length; i++)
				util.try2Call(callbacks[i]);
			callbacks = [];

			View.getViewContainerDomElement().setAttribute(viewAttribute.attr$view_state, "ready");
		};

		/**
		 * 就绪后执行的方法
		 * @param {Function} callback 回调方法
		 */
		return function(callback){
			/* 如果已经就绪，则立即执行 */
			if(isViewReady){
				util.try2Call(callback);
				return View;
			}

			if(callbacks.indexOf(callback) === -1)
				callbacks.push(callback);
			return View;
		};
	})();

	/**
	 * 设置视图初始化器
	 * @param {Function} initializer 初始化器
	 * @param {Function} initializer#init 执行初始化
	 * @param {String} [execTime=domready] 初始化器的自动执行时机。domready：DOM就绪后执行；rightnow：立即执行。默认为：domready
	 */
	View.setInitializer = function(initializer, execTime){
		if(typeof initializer !== "function")
			return;

		var dftExecTime = "domready";
		if(arguments.length < 2)
			execTime = dftExecTime;
		var supportedExecTimes = "domready, rightnow".split(/\s*,\s*/);
		if(supportedExecTimes.indexOf(execTime) === -1){
			globalLogger.warn("Unknown initializer exec time: {}. Supported: {}", execTime, supportedExecTimes);
			execTime = dftExecTime;
		}

		viewInitializer = initializer;
		viewInitializerExecTime = execTime;

		if(!isViewInited && "rightnow" === execTime){
			globalLogger.info("Calling specified view initializer right now");
			initializer(init);
		}
	};

	document.addEventListener("DOMContentLoaded", function(){
		if(null == viewInitializer){
			globalLogger.info("Initializing View automatically on dom ready");
			init();
		}else if("domready" === viewInitializerExecTime){
			globalLogger.info("Calling specified view initializer on dom ready");
			viewInitializer(init);
		}
	});

	ctx[name] = View;
})(window, "View");