/**
 * 事件触发顺序：
 * 1. View.beforechange
 * 2. view.ready
 * 3. view.beforeenter
 * 4. view.enter
 * 5. view.afterenter
 * 6. View.afterchange
 */
;(function(ctx, name){
	/** 日志输出组件 */
	var Logger = (function(){var f=function(){if(arguments.length==0){return}var m=arguments;var n=" "+String(arguments[0]);var l=1;n=n.replace(/([^\\])\{\}/g,function(p,o){var q=(m.length-1)<l?"{}":String(h(m[l]));l++;return o+q});n=n.replace(/\\\{\}/g,"{}");return n.substring(1)};var d=function(){var q=new Date();var o=q.getFullYear();var p="0"+String(q.getMonth()+1);p=p.substring(p.length-2);var m="0"+String(q.getDate());m=m.substring(m.length-2);var l="0"+String(q.getHours());l=l.substring(l.length-2);var n="0"+String(q.getMinutes());n=n.substring(n.length-2);var r="0"+String(q.getSeconds());r=r.substring(r.length-2);return p+m+" "+l+":"+n+":"+r};var h=function(o){if(null==o){return null}if((typeof o=="number")||(typeof o=="string")||(typeof o=="boolean")){return o}else{if(typeof o=="function"){return"function "+o.name+"(){...}"}else{if(!(o instanceof Array)&&(typeof o=="object")){if(String(o)!="[object Object]"){return String(o)}else{try{var l={};for(var n in o){l[n]=h(o[n])}return JSON.stringify(l)}catch(m){return String(o)}}}else{if(o instanceof Array){return JSON.stringify(o.map(function(p){return h(p)}))}else{return o}}}}};var i=function(l){return d()+" ["+l+"]: "};var c={};var j,e;(function(){var l=true;j=function(){return l};e=function(m){l=m}})();var b=function(l){var m=true;this.isEnabled=function(){return j()&&m};this.setIsEnabled=function(n){m=n;return this};this.getName=function(){return l};this.debug=function(){if(!this.isEnabled()){return}var n=f.apply(null,arguments);console.debug(i(l)+n)};this.info=function(){if(!this.isEnabled()){return}var n=f.apply(null,arguments);console.info(i(l)+n)};this.warn=function(){if(!this.isEnabled()){return}var n=f.apply(null,arguments);console.warn(i(l)+n)};this.error=function(){if(!this.isEnabled()){return}var n=f.apply(null,arguments);console.error(i(l)+n)};this.log=function(){if(!this.isEnabled()){return}var n=f.apply(null,arguments);console.log(i(l)+n)}};var g=function(m){if(m in c){return c[m]}var l=new b(m);c[m]=l;return l};b.ofName=g;b.isGloballyEnabled=j;b.setIsGloballyEnabled=e;return b;})();

	/** 触摸支持组件 */
	var touch = (function(){
		/* 添加的依附于DOM元素的，用于记录其相关取值的属性名称 */
		var touchAttributeName = "  __com.soft.plugin.touch#" + new Date().getTime() + "__  ";

		/**
		 * 设定参数默认值
		 */
		var setDftValue = function(ops, dftOps){
			ops = ops || {};
			dftOps = dftOps || {};

			/* 参数不存在时，从默认参数中读取并赋值 */
			for(var p in dftOps)
				if(!(p in ops))
					ops[p] = dftOps[p];

			return ops;
		};

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
			options = setDftValue(options, {timespan: 500, delta: {}, useCapture: false});
			options.delta = setDftValue(options.delta, {x: 10, y: 15});

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
						tapNamespace.callbacks.forEach(function(handler){
							handler && handler.call(target, e);
						});
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

	/**
	 * 设定参数默认值
	 * @param ops {Json} 要设定默认值的目标
	 * @param dftOps {Json} 提供的默认值配置
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
	 * 为指定的对象添加事件驱动机制
	 * @param obj 要添加事件驱动机制的对象
	 * @param ctx 监听器触发时的this上下文
	 */
	var eventDrive = (function(){
		/**
		 * @constructor
		 *
		 * 事件
		 * @param type {String} 事件类型（名称）
		 * @param data {JSON} 需要传递至监听器的数据
		 */
		var Event = function(type, data){
			this.type = type;
			this.timestamp = new Date().getTime();
			this.data = data;

			Object.freeze && Object.freeze(this);
		};

		return function(obj, ctx){
			(function(obj, ctx){
				/* 所有事件处理器。key为事件类型字符串（全小写），value为对应添加的事件处理器数组 */
				var eventHandlers = {};

				/**
				 * 添加事件监听器
				 * @param type 事件类型
				 * @param handler 事件处理器
				 */
				obj.on = function(type, handler){
					type = type.toLowerCase();

					eventHandlers[type] = eventHandlers[type] || [];
					if(eventHandlers[type].indexOf(handler) != -1)
						return;

					/* 加入列表 */
					eventHandlers[type].push(handler);
				};

				/**
				 * 移除事件监听器
				 * @param type 事件类型
				 * @param handler 事件处理器
				 */
				obj.off = function(type, handler){
					type = type.toLowerCase();

					eventHandlers[type] = eventHandlers[type] || [];
					var index = eventHandlers[type].indexOf(handler);
					if(index == -1)
						return;

					/* 加入列表 */
					eventHandlers[type].splice(index, 1);
				};

				/**
				 * 触发事件
				 * @param type {String} 事件类型（名称）
				 * @param data 需要传递至监听器的数据
				 */
				obj.fire = function(type, data){
					type = type.toLowerCase();

					/** 创建事件 */
					var event = new Event(type, data);

					/** 触发监听器 */
					eventHandlers[type] = eventHandlers[type] || [];
					eventHandlers[type].forEach(function(handler){
						handler.call(ctx, event);
					});
				};
			})(obj, ctx);
		};
	})();

	/**
	 * 为指定的对象附加指定名称的只读的属性
	 * @param {Object} obj 目标对象
	 * @param {String} name 属性名称
	 * @param {Any} val 属性取值
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
	var try2exec = function(func, ctx, args){
		if(null == func || typeof func != "function")
			return;
		
		try{func.apply(ctx, args);}catch(e){globalLogger.error("Error occured while executing function: {}. {}", func.name, e);}
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
		
		return str.length == 0;
	};

	var MOBILE_REGEX = /mobile|tablet|ip(ad|hone|od)|android/i,
		SUPPORT_TOUCH = ('ontouchstart' in window),
		IS_MOBILE = MOBILE_REGEX.test(navigator.userAgent);

	/** 使用一个仅内部可见的对象，表示那些json对象中值没有被设置的键 */
	var NOT_SUPPLIED = new Object();

	var PSVIEW_BACK = ":back",/* 伪视图：后退 */
		PSVIEW_FORWARD = ":forward";/* 伪视图：前进 */

	var globalLogger = Logger.ofName("View");
	
	/** 通过文档扫描得出的配置的视图集合 */
	var viewInstances = [];

	/** 视图切换动画 */
	var viewSwitchAnimation = null;


	var historyPushPopSupported = ("pushState" in history) && (typeof history.pushState == "function");
	globalLogger.log("History pushState is " + (historyPushPopSupported? "": "not ") + "supported");

	/**
	 * 准备就绪的视图ID列表
	 *
	 * “准备就绪”的定义：
	 * 1. 页面DOM加载完毕
	 * 2. 视图已经呈现过
	 *
	 * 视图的“准备就绪”事件只会触发一次，即未就绪状态下进入视图时，触发视图进入事件：“enter”之前触发
	 */
	var readyViews = [];

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

	/**
	 * 判断指定编号对应的视图是否是伪视图
	 * @param {String} viewId 视图编号
	 */
	var isPseudoView = function(viewId){
		return PSVIEW_BACK == viewId || PSVIEW_FORWARD == viewId;
	};

	/**
	 * 设置特定视图特定的参数取值
	 * @param {String} viewId 视图ID
	 * @param {String} name 要设置的键的名称
	 * @param {Any} value 要设置的键的取值
	 */
	var setViewParameter = function(viewId, name, value){
		if(!View.ifExists(viewId) && !isPseudoView(viewId))
			throw new ViewNotExistError("View of id: " + viewId + " does not exist.");
		if(arguments.length < 3)
			throw new Error("Invalid argument length. Both parameter name and value should be specified.");

		viewParameters[viewId] = viewParameters[viewId] || {};
		viewParameters[viewId][String(name)] = value;

		return View;
	};

	/**
	 * 设置特定视图特定的多个参数取值
	 * @param {String} viewId 视图ID
	 * @param {Any} params 入参参数集合
	 */
	var setViewParameters = function(viewId, params){
		if(!View.ifExists(viewId) && !isPseudoView(viewId))
			throw new ViewNotExistError("View of id: " + viewId + " does not exist.");

		if(undefined === params)
			params = null;
		if(typeof params != "object")
			throw new Error("Parameters specified should be an object or null.");

		viewParameters[viewId] = params;
		return View;
	};

	/**
	 * 清除特定视图的入参
	 * @param {String} viewId 视图ID
	 */
	var clearViewParameters = function(viewId){
		delete viewParameters[viewId];

		return View;
	};

	

	/**
	 * 浏览状态
	 * @param {String} viewId 视图ID
	 * @param {Long} timestamp 时间戳
	 * @param {JsonObject} options 选项集合
	 */
	var ViewState = function(viewId, timestamp, options){
		if(arguments.length < 3)
			options = null;
		if(arguments.length < 2)
			timestamp = Date.now();

		defineReadOnlyProperty(this, "viewId", viewId);
		defineReadOnlyProperty(this, "timestamp", timestamp);
		defineReadOnlyProperty(this, "options", options);

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
	ViewState.isConstructorOf = function(obj){
		if(null == obj || typeof obj != "object")
			return false;

		return obj.hasOwnProperty("viewId") && obj.hasOwnProperty("timestamp");
	};

	/**
	 * 为给定的字符串进行URI编码
	 */
	var xEncodeURIComponent = function(t){
		return encodeURIComponent(String(t)).replace(/\+/gm, "%2B");
	};

	/**
	 * 使用给定的视图编号和视图选项构造地址栏字符串
	 */
	var concatViewOptions = function(viewId, options){
		/** 视图编号与参数集合之间的分隔符 */
		var sep = "!";

		var str = String(viewId);
		var paramKeys = null == options? []: Object.keys(options);
		var tmp = paramKeys.reduce(function(start, e, i, arr){
			return start + "&" + xEncodeURIComponent(e) + "=" + xEncodeURIComponent(options[e]);
		}, "");
		if(tmp.length > 0)
			str += sep + tmp.substring(1);
		
		return str;
	};

	/**
	 * 向history中添加view浏览历史
	 * @param {String} viewId 视图ID
	 * @param {Long} [timestamp=Date.now()] 视图压入堆栈的时间戳
	 * @param {JsonObject} [options=null] 选项集合
	 */
	var pushViewState = function(viewId, timestamp, options){
		if(arguments.length < 3)
			options = null;
		if(arguments.length < 2)
			timestamp = Date.now();

		var state = new ViewState(viewId, timestamp, options).clone();
		globalLogger.log("↓ {}", JSON.stringify(state));

		if(historyPushPopSupported)
			history.pushState(state, "", "#" + concatViewOptions(viewId, options));
		else
			location.hash = concatViewOptions(viewId, options);

		View.currentState = state;
	};

	/**
	 * 更新history中最后一个view浏览历史
	 * @param {String} viewId 视图ID
	 * @param {Long} [timestamp=Date.now()] 视图更新至堆栈的时间戳
	 * @param {JsonObject} [options=null] 选项集合
	 */
	var replaceViewState = function(viewId, timestamp, options){
		if(arguments.length < 3)
			options = null;
		if(arguments.length < 2)
			timestamp = Date.now();

		var state = new ViewState(viewId, timestamp, options).clone();
		globalLogger.log("% {}", JSON.stringify(state));

		if(historyPushPopSupported)
			history.replaceState(state, "", "#" + concatViewOptions(viewId, options));
		else
			location.hash = concatViewOptions(viewId, options);

		View.currentState = state;
	};

	/**
	 * 视图不存在错误
	 */
	var ViewNotExistError = function ViewNotExistError(msg){
		Error.call(this, msg);
	};
	ViewNotExistError.prototype = Object.create(Error.prototype);

	/**
	 * 视图配置
	 * @param {String} _name 配置项名称
	 */
	var ViewConfiguration = function ViewConfiguration(_name){
		var name = _name,/* 配置项名称 */
		    value,/* 配置项取值 */
			application;/* 配置项应用方法 */
		
		/**
		 * 获取配置项名称
		 */
		this.getName = function(){
			return name;
		};

		/**
		 * 获取配置项取值
		 */
		this.getValue = function(){
			return value;
		};

		/**
		 * 设置配置项取值
		 */
		this.setValue = function(_value){
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
		 */
		this.setApplication = function(_application){
			application = _application;
			return this;
		};

		/**
		 * 应用配置
		 */
		this.apply = function(){
			if(typeof application == "function")
				application(value);
			return this;
		};

		Object.freeze(this);
	};

	/**
	 * 视图配置集合
	 */
	var ViewConfigurationSet = function ViewConfigurationSet(){
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
				c = new ViewConfiguration(key);
				configs[key] = c;
			}

			return c;
		};

		/**
		 * 应用所有配置
		 */
		this.applyAll = function(){
			var items = Object.values(configs);
			if(0 != items.length)
				setTimeout(function(){
					items.forEach(function(c){
						try{
							c.apply();
						}catch(e){console.error(e);}
					});
				}, 0);
		};

		/**
		 * 列举所有的配置项名称
		 */
		this.listAll = function(){
			return Object.keys(configs);
		};
	};

	/**
	 * 视图上下文
	 */
	var ViewContext = function ViewContext(){
		var obj = {};

		defineReadOnlyProperty(this, "has", function(name){
			return name in obj;
		});
		defineReadOnlyProperty(this, "set", function(name, value){
			obj[name] = value;
			return this;
		});
		defineReadOnlyProperty(this, "get", function(name){
			return obj[name];
		});
		defineReadOnlyProperty(this, "clear", function(){
			obj = {};
			return this;
		});
	};

	/**
	 * 视图类
	 * @param id {String} 视图对应的DOM元素的id
	 */
	var View = function(id){
		if(null === document.querySelector("#" + id + "[data-view=true]"))
			throw new ViewNotExistError("View of id: " + id + " does not exist(No element matching pattern: '#" + id + "[data-view=true]' found)!");

		/* 存储该视图触发的各个事件的最新数据。key：事件名；value：数据 */
		var eventData = {};

		/** 上下文，用于存储视图相关的数据等 */
		var context = new ViewContext();

		/** 视图配置集合 */
		var configSet = new ViewConfigurationSet();

		/**
		 * 启用事件驱动机制
		 * 事件 beforeenter：视图进入前触发
		 * 事件 enter：当前视图变为活动视图时触发
		 * 事件 afterenter：视图进入后触发
		 * 事件 ready：当前视图变为活动视图时，且enter事件触发后触发
		 * 事件 leave：当前视图由活动视图变为非活动视图时触发
		 */
		eventDrive(this, document.querySelector("#" + id));

		/**
		 * 复写事件发起方法，在发起的同时记录附带的数据供后期查询
		 */
		var fire = this.fire;
		this.fire = function(name, value){
			eventData[name] = value;
			fire(name, value);
		};

		/* 日志输出组件 */
		defineReadOnlyProperty(this, "logger", Logger.ofName("View#" + id));
		/* 配置对象 */
		defineReadOnlyProperty(this, "config", configSet);
		/* 视图上下文 */
		defineReadOnlyProperty(this, "context", context);

		/**
		 * 获取最新的，指定事件对应的数据
		 * @param {String} eventName 事件名字
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
		 * 清除视图上下文
		 */
		this.clearContext = function(){
			context.clear();
			return this;
		};

		/**
		 * 返回视图对应的DOM元素的ID
		 */
		this.getId = function(){
			return id;
		};

		/**
		 * 获取视图对应的DOM元素
		 */
		this.getDomElement = function(){
			return document.querySelector("#" + id);
		};

		/**
		 * 在视图内查找元素
		 * @param selector {String} 元素选择器
		 * @return {HTMLElement} 找到的元素
		 */
		this.find = function(selector){
			return this.getDomElement().querySelector(selector);
		};

		/**
		 * 在视图内查找元素
		 * @param selector {String} 元素选择器
		 * @return {NodeList} 找到的元素列表
		 */
		this.findAll = function(selector){
			return this.getDomElement().querySelectorAll(selector);
		};

		/**
		 * 获取视图参数中指定名称的键的取值
		 * @param {String} [name] 参数名。如果没有指定参数名，则返回整个参数。
		 */
		this.getParameter = function(name){
			var params = viewParameters[this.getId()];
			if(arguments.length < 1)
				return params;

			return null == params? null: params[name];
		};

		/**
		 * 判断当前视图是否已经就绪
		 */
		this.isReady = function(){
			return readyViews.indexOf(this.getId()) != -1;
		};

		/**
		 * 判断当前视图是否为活动视图
		 */
		this.isActive = function(){
			return this.getDomElement().classList.contains("active");
		};

		/**
		 * 判断当前视图是否为默认视图
		 */
		this.isDefault = function(){
			return /true/i.test(this.getDomElement().getAttribute("data-view-default"));
		};

		/**
		 * 判断当前视图是否可以通过地址栏直接访问
		 */
		this.isDirectlyAccessible = function(){
			var rootFlag = document.documentElement.getAttribute("data-view-directly-accessible");
			rootFlag = null == rootFlag? "false": rootFlag;
			rootFlag = rootFlag.toLowerCase();

			var directAccessable = false;
			if("true" == rootFlag){/** 如果设定全部可以直接访问 */
				/** 判定视图是否可以直接访问 */
				if("false" == this.getDomElement().getAttribute("data-view-directly-accessible"))
					directAccessable = false;
				else
					directAccessable = true;
			}else{
				/** 判定视图是否可以直接访问 */
				if("true" == this.getDomElement().getAttribute("data-view-directly-accessible"))
					directAccessable = true;
				else
					directAccessable = false;
			}

			return directAccessable;
		};

		/**
		 * 获取视图不能访问时需要呈现的视图
		 * 如果指定的视图不存在，则返回默认视图
		 */
		this.getFallbackView = function(){
			var view = this;
			var idChain = [this.getId()];

			do{
				/** 取出配置的视图 */
				var fallbackViewId = view.getDomElement().getAttribute("data-view-fallback");
				/** 判断是否配置且配置的视图是否存在 */
				if(null == fallbackViewId || !View.ifExists(fallbackViewId)){
					globalLogger.warn("View: " + view.getId() + " is not permited to access directly, and no fallback configuration found, thus returning the default view");
					return View.getDefaultView();
				}else{
					view = View.ofId(fallbackViewId);

					if(idChain.indexOf(view.getId()) != -1){/** 循环引用 */
						globalLogger.error("Cyclical reference of view on fallback configuration on view: {}. Chain: {}, view id: {}", this.getId(), idChain, view.getId());
						return View.getDefaultView();
					}

					/** 如果视图可以直接访问，则返回自身 */
					if(view.isDirectlyAccessible())
						return view;

					idChain.push(fallbackViewId);
				}
			}while(true);
		};

		Object.freeze && Object.freeze(this);
	};

	/** 视图切换操作类型：由浏览器前进操作触发 */
	View.SWITCHTYPE_HISTORYFORWARD = "history.forward";
	/** 视图切换操作类型：由浏览器后退操作触发 */
	View.SWITCHTYPE_HISTORYBACK = "history.back";
	/** 视图切换操作类型：由视图切换操作触发 */
	View.SWITCHTYPE_VIEWSWITCH = "view.switch";

	/** 暴露日志组件，供第三方使用 */
	View.Logger = Logger;

	/* history的最近一次状态 */
	View.currentState = null;

	/**
	 * 启用事件驱动机制
	 * 事件 beforechange：视图切换前触发
	 * 事件 afterchange：视图切换后触发
	 */
	eventDrive(View);

	/**
	 * 查找给定ID对应的视图实例，如果不存在则创建，否则返回已经存在的实例
	 * @param {String} id 视图编号
	 */
	View.ofId = function(id){
		for(var i = 0; i < viewInstances.length; i++)
			if(viewInstances[i].getId().trim() == id.trim())
				return viewInstances[i];

		/* 创建实例 */
		var instance = new View(id);

		/* 加入到管理集合中 */
		viewInstances.push(instance);

		return instance;
	};

	/**
	 * 判断指定ID的视图是否存在
	 * @param id 视图ID
	 */
	View.ifExists = function(id){
		for(var i = 0; i < viewInstances.length; i++)
			if(viewInstances[i].getId().trim() == id.trim())
				return true;

		return false;
	};
	View.isExisting = View.ifExists;
	
	/**
	 * 列举所有视图
	 */
	View.listAll = function(){
		return [].concat(viewInstances);
	};

	/**
	 * 获取当前活动的视图
	 */
	View.getActiveView = function(){
		for(var i = 0; i < viewInstances.length; i++)
			if(viewInstances[i].isActive())
				return viewInstances[i];

		return null;
	};

	/**
	 * 获取默认视图
	 */
	View.getDefaultView = function(){
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
			throw new Error("Invalid argument. Animation of Function is needed.");

		viewSwitchAnimation = animationFunction;

		return View;
	};

	/**
	 * 获取视图切换动画
	 * @return {Function} 视图切换动画
	 */
	View.getSwitchAnimation = function(){
		return viewSwitchAnimation;
	};

	/**
	 * 从地址栏hash中解析视图信息
	 * @param {String} hash 地址栏Hash
	 * @return {JsonObject} {viewId: [视图编号], options: [选项集合]}
	 */
	var parseViewInfoFromHash = function(hash){
		if("" == hash)
			return null;
		
		var r = /^#([\w\$]+)(?:!+(.*))?/;
		var m = hash.match(r);
		if(null == m)
			return null;
		
		var viewId = m[1], options = null;
		if(null != m[2] && "" != m[2].trim()){
			var kvPairs = m[2].split(/\s*&\s*/);
			if(0 != kvPairs.length){
				options = {};
				kvPairs.forEach(function(pair){
					var s = pair.split(/\s*=\s*/);
					options[decodeURIComponent(s[0])] = decodeURIComponent(s[1]);
				});
			}
			
		}
		return {viewId: m[1], options: options};
	};

	/**
	 * 获取当前活动的视图的视图选项
	 */
	View.getActiveViewOptions = function(){
		var viewInfo = parseViewInfoFromHash(location.hash);
		return null == viewInfo? null: viewInfo.options;
	};

	/**
	 * 切换视图
	 * @param {View} ops.srcView 源视图
	 * @param {View} ops.targetView {View} 目标视图
	 * @param {StringEnum} ops.type 切换操作类型（View.SWITCHTYPE_HISTORYFORWARD || View.SWITCHTYPE_HISTORYBACK || View.SWITCHTYPE_VIEWSWITCH）
	 * @param {Boolean} ops.withAnimation 是否执行动画
	 * @param {Any} ops.params 视图参数。仅当切换操作类型为：View.SWITCHTYPE_VIEWSWITCH时才会被使用
	 */
	var switchView = function(ops){
		ops = setDftValue(ops, {
			srcView: null,
			targetView: null,
			type: View.SWITCHTYPE_VIEWSWITCH,
			withAnimation: true,
			params: null
		});

		var srcView = ops.srcView,
			targetView = ops.targetView,
			type = ops.type,
			params = ops.params;

		if(null == type)
			type = View.SWITCHTYPE_VIEWSWITCH;
		var isBack = type.toLowerCase() == View.SWITCHTYPE_HISTORYBACK,
			isForward = type.toLowerCase() == View.SWITCHTYPE_HISTORYFORWARD;
		if(!isBack && !isForward)
			type = View.SWITCHTYPE_VIEWSWITCH;

		/** 触发前置切换监听器 */
		View.fire("beforechange", {currentView: srcView, targetView: targetView, type: type, params: params});

		/* 执行切换操作 */
		srcView && srcView.fire("leave", {targetView: targetView, type: type});

		var display = function(){
			srcView && srcView.getDomElement().classList.remove("active");
			targetView.getDomElement().classList.add("active");
		};

		var enter = function(){
			/* 视图参数重置 */
			var targetViewId = targetView.getId();
			clearViewParameters(targetViewId);

			if(isBack){
				if(PSVIEW_BACK in viewParameters){
					/* 用过之后立即销毁，防止污染其它回退操作 */
					setViewParameters(targetViewId, viewParameters[PSVIEW_BACK]);
					delete viewParameters[PSVIEW_BACK];
				}
			}else if(isForward){
				if(PSVIEW_FORWARD in viewParameters){
					/* 用过之后立即销毁，防止污染其它前进操作 */
					setViewParameters(targetViewId, viewParameters[PSVIEW_FORWARD]);
					delete viewParameters[PSVIEW_FORWARD];
				}
			}else
				setViewParameters(targetViewId, params);

			var eventData = {sourceView: srcView, type: type, params: params};
			if(!targetView.isReady()){
				readyViews.push(targetViewId);
				targetView.fire("ready", eventData);
			}
			["beforeenter", "enter", "afterenter"].forEach(function(evtName){
				targetView.fire(evtName, eventData);
			});
		};

		var render = function(){
			display();
			enter();
		};

		if(!ops.withAnimation)
			render();
		else{
			if(viewSwitchAnimation)
				viewSwitchAnimation.call(null, srcView? srcView.getDomElement(): null, targetView.getDomElement(), type, render);
			else
				render();
		}

		/** 触发后置切换监听器 */
		View.fire("afterchange", {currentView: srcView, targetView: targetView, type: type, params: params});
	};

	/**
	 * 呈现指定的视图（不操作history）
	 * @param {String} targetViewId 目标视图ID
	 * @param {JsonObject} ops 切换配置。详见switchView
	 */
	var show = function(targetViewId, ops){
		ops = setDftValue(ops, {
			type: View.SWITCHTYPE_VIEWSWITCH
		}, true);

		/** 检查目标视图是否存在 */
		if(!View.ifExists(targetViewId))
			throw new Error("Target view: " + targetViewId + " does not exist!");

		/* 当前活动视图 */
		var currentView = View.getActiveView();

		/* 如果切换目标是自己，则直接返回 */
		if(currentView.getId().toLowerCase() == targetViewId.toLowerCase())
			return View;

		globalLogger.log("{} → {} {}", currentView.getId(), targetViewId, JSON.stringify(ops));

		/* 目标视图 */
		var targetView = View.ofId(targetViewId);

		ops.srcView = currentView;
		ops.targetView = targetView;
		switchView(ops);

		return View;
	};
	View.show = show;

	/**
	 * ########### 历史API。待移除 ###########
	 * 切换视图
	 * @param {String} targetViewId 目标视图ID
	 * @param {StringEnum} type 切换操作类型（View.SWITCHTYPE_HISTORYFORWARD || View.SWITCHTYPE_HISTORYBACK || View.SWITCHTYPE_VIEWSWITCH）
	 * @param {Boolean} withAnimation 是否执行动画
	 * @param {Any} params 视图参数。仅当切换操作类型为：View.SWITCHTYPE_VIEWSWITCH时才会被使用
	 */
	View.switchTo = function(targetViewId, type, withAnimation, params){
		if(arguments.length < 4)
			params = null;
		if(arguments.length < 3)
			withAnimation = true;
		if(arguments.length < 2)
			type = View.SWITCHTYPE_VIEWSWITCH;
		type = type || View.SWITCHTYPE_VIEWSWITCH;

		show(targetViewId, {type: type, withAnimation: withAnimation, params: params});
		return View;
	};
	/* 历史api兼容 */
	View.switchView = View.switchTo;

	/**
	 * 切换视图，同时更新相关状态（压入堆栈）
	 * @param targetViewId 目标视图ID
	 * @param {JsonObject} ops 切换配置。详见View.show
	 */
	View.navTo = function(targetViewId, ops){
		targetViewId = targetViewId.trim();

		/* 当前活动视图 */
		var currentView = View.getActiveView();

		/* 如果切换目标是自己，则直接返回 */
		if(currentView.getId().toLowerCase() == targetViewId.toLowerCase())
			return View;

		/** 伪视图支持 */
		/* 回退操作(":back") */
		if(PSVIEW_BACK == targetViewId){
			View.back(ops);
			return View;
		}
		/* 前进操作（":forward"） */
		if(PSVIEW_FORWARD == targetViewId){
			View.forward(ops);
			return View;
		}

		show(targetViewId, ops);
		pushViewState(targetViewId, Date.now(), null);

		return View;
	};
	/* 历史api兼容 */
	View.updateView = View.navTo;

	/**
	 * 切换视图，同时更新相关状态（更新堆栈）
	 * @param targetViewId 目标视图ID
	 * @param {JsonObject} ops 切换配置。详见switchView
	 */
	View.changeTo = function(targetViewId, ops){
		/* 当前活动视图 */
		var currentView = View.getActiveView();

		/* 如果切换目标是自己，则直接返回 */
		if(currentView.getId().toLowerCase() == targetViewId.toLowerCase())
			return View;
		
		show(targetViewId, ops);
		replaceViewState(targetViewId, Date.now(), null);

		return View;
	};

	/**
	 * 回退到上一个视图
	 * @param {JsonObject} ops 切换配置
	 * @param {JsonObject | null} ops.params 视图切换参数
	 */
	View.back = function(ops){
		/* 清除旧数据，并仅在指定了参数时才设置参数，防止污染其它回退操作 */
		clearViewParameters(PSVIEW_BACK);
		if(null != ops && "params" in ops)
			setViewParameters(PSVIEW_BACK, ops.params);

		history.go(-1);
	};

	/**
	 * 前进到下一个视图
	 * @param {JsonObject} ops 切换配置
	 * @param {JsonObject | null} ops.params 视图切换参数
	 */
	View.forward = function(ops){
		/* 清除旧数据，并仅在指定了参数时才设置参数，防止污染其它前进操作 */
		clearViewParameters(PSVIEW_FORWARD);
		if(null != ops && "params" in ops)
			setViewParameters(PSVIEW_FORWARD, ops.params);

		history.go(1);
	};


	/** 文档标题 */
	var documentTitle = document.title;

	/**
	 * 设置文档标题。如果特定视图没有自定义标题，则使用文档标题
	 */
	var setDocumentTitle = function(title){
		if(isEmptyString(title, true)){
			globalLogger.warn("Invalid document title: " + title);
			return View;
		}

		document.title = documentTitle = title;
		return View;
	};
	View.setDocumentTitle = setDocumentTitle;


	/**
	 * 标记视图就绪
	 */
	var markViewReady;

	View.ready = (function(){
		var isReady = false;

		/* 挂起的回调方法列表 */
		var callbacks = [];
		markViewReady = function(){
			isReady = true;

			setTimeout(function(){
				callbacks.forEach(function(cb){
					try2exec(cb);
				});
			}, 0);
		};

		/**
		 * 就绪后执行的方法
		 */
		return function(callback){
			/* 如果已经就绪，则立即执行 */
			if(isReady){
				try2exec(callback);
				return View;
			}

			if(callbacks.indexOf(callback) != -1)
				return View;
			
			callbacks.push(callback);
			return View;
		};
	})();

	/**
	 * 获取当前的激活视图。如果没有视图处于激活状态，则返回默认视图
	 */
	var getActiveOrDefaultView = function(){
		var v = View.getActiveView();
		if(null == v)
			v = View.getDefaultView();
		
		return v;
	};

	/**
	 * 根据提供的视图ID计算最终映射到的可以呈现出来的视图
	 * @param {String} viewId 视图ID
	 * @return {View} 最终视图
	 */
	var getFinalView = function(viewId){
		var targetView = null;

		/** 判断指定的视图是否存在 */
		if(isEmptyString(viewId, true) || !View.ifExists(viewId)){
			targetView = getActiveOrDefaultView();
		}else{
			targetView = View.ofId(viewId);
			if(!targetView.isDirectlyAccessible())/** 判断指定的视图是否支持直接访问 */
				targetView = targetView.getFallbackView();
		}

		return targetView;
	};

	/**
	 * 响应地址栏的hash进行渲染操作
	 */
	var stateChangeListener =  function(e){
		var currentActiveView = View.getActiveView();
		var currentActiveViewId = null == currentActiveView? null: currentActiveView.getId();

		globalLogger.log("{} Current: {}", historyPushPopSupported? "State poped!": "Hash changed!", currentActiveView.getId());
		globalLogger.log("↑ {}", historyPushPopSupported? JSON.stringify(e.state): location.hash);

		var newViewId, type = View.SWITCHTYPE_VIEWSWITCH, options, targetView = null;
		if(null == e.state){/* 手动输入目标视图ID */
			type = View.SWITCHTYPE_VIEWSWITCH;

			var viewInfo = parseViewInfoFromHash(location.hash);

			newViewId = viewInfo.viewId;
			targetView = getFinalView(newViewId);
			var targetViewId = targetView.getId();

			var isTargetViewAsSpecified = targetViewId == newViewId,
				isTargetViewRemainsCurrent = targetViewId == currentActiveViewId;

			/**
			 * 如果目标视图仍然是当前视图，则不能更改地址栏中的选项内容
			 * 如果最终视图和地址栏中的视图不是一个视图，则不能再将选项传递给最终视图
			 */
			options = isTargetViewRemainsCurrent? View.currentState.options: (isTargetViewAsSpecified? viewInfo.options: null);

			/* history堆栈更新 */
			replaceViewState(targetViewId, Date.now(), options);
		}else{
			var popedNewState = e.state;
			newViewId = popedNewState.viewId;

			if(View.ifExists(newViewId)){
				targetView = View.ofId(newViewId);
				options = popedNewState.options;
			}else{
				globalLogger.warn("Poped view: " + newViewId + " does not exist, keeping current.");
				targetView = currentActiveView;

				/* 如果最终视图和地址栏中的视图不是一个视图，则不能再将选项传递给最终视图 */
				options = null;
			}
			var targetViewId = targetView.getId();

			if(View.currentState != null)
				type = popedNewState.timestamp < View.currentState.timestamp? View.SWITCHTYPE_HISTORYBACK: View.SWITCHTYPE_HISTORYFORWARD;

			/* history堆栈更新 */
			replaceViewState(targetViewId, popedNewState.timestamp, options);
		}

		/* 视图切换 */
		View.show(targetView.getId(), {type: type, options: options});
	};



	var init = function(){
		/** 事件监听 */
		window.addEventListener(historyPushPopSupported? "popstate": "hashchange", stateChangeListener);

		/* 扫描文档，遍历定义视图 */
		var viewObjs = document.querySelectorAll("*[data-view=true]");
		[].forEach.call(viewObjs, function(viewObj){
			/* 定义视图 */
			View.ofId(viewObj.id);

			/* 去除可能存在的激活状态 */
			viewObj.classList.remove("active");

			/* 添加样式类 */
			viewObj.classList.add("view");

			/* 视图标题自动设置 */
			;(function(){
				var specifiedTitle = viewObj.getAttribute("data-view-title");
				var view = View.ofId(viewObj.id);
				view.on("enter", function(){
					document.title = null == specifiedTitle? documentTitle: specifiedTitle;
				});
			})();
		});

		/* 默认视图 */
		var dftViewObj = null;

		/** 确定默认视图 */
		var determineDefaultView = function(){
			var dftViewObj = null;
			var dftViewObjIndex = -1;
			for(var i = 0; i < viewObjs.length; i++)
				if("true" == viewObjs[i].getAttribute("data-view-default")){
					dftViewObjIndex = i;
					break;
				}

			if(-1 != dftViewObjIndex){
				dftViewObj = viewObjs[dftViewObjIndex];

				/* 删除多余的声明 */
				for(var i = dftViewObjIndex + 1; i < viewObjs.length; i++)
					if("true" == viewObjs[i].getAttribute("data-view-default"))
						viewObjs[i].removeAttribute("data-view-default");
			}else if(0 != viewObjs.length){
				dftViewObj = viewObjs[0];
				dftViewObj.setAttribute("data-view-default", "true");
			}else
				globalLogger.warn("No view exists to determine the default view.");

			return dftViewObj;
		};

		/* 确定默认视图，并添加激活标识 */
		dftViewObj = determineDefaultView();
		if(null != dftViewObj)
			dftViewObj.classList.add("active");

		/**
		 * 呈现指定视图
		 */
		;(function(){
			var defaultViewId = null == dftViewObj? null: dftViewObj.id;

			var viewInfo = parseViewInfoFromHash(location.hash);
			var specifiedViewId = null == viewInfo? null: viewInfo.viewId,
				options = null == viewInfo? null: viewInfo.options;

			var targetViewId = isEmptyString(specifiedViewId, true)? defaultViewId: specifiedViewId;
			if(isEmptyString(targetViewId, true)){
				globalLogger.warn("Can not determine the initial view!");
				return;
			}

			var targetView = getFinalView(targetViewId);
			targetViewId = targetView.getId();
			/* 如果最终视图和地址栏中的视图不是一个视图，则不能再将选项传递给最终视图 */
			if(targetViewId != specifiedViewId)
				options = null;

			replaceViewState(targetViewId, Date.now(), options);

			switchView({
				srcView: View.getActiveView(),
				targetView: targetView,
				withAnimation: false,
				params: null
			});
		})();

		/**
		 * 指令：data-view-rel配置视图导向
		 * 		取值：[view-id] 目标视图ID
		 * 		取值：:back 回退至上一个视图
		 * 		取值：:forward 前进至下一个视图
		 *
		 * 指令：data-view-rel-type 配置视图更新方式
		 * 		取值：nav（默认） 使用history.pushState以“导向”的方式切换至新视图。采用此方式时，切换多少次视图，就需要返回多少次才能回到初始界面
		 * 		取值：change 使用history.replaceState以“更新”的方式切换至新视图。采用此方式时，无论切换多少次视图，仅需1次就能回到初始界面
		 *
		 * 指令：data-view-rel-disabled 配置导向开关
		 * 		取值：true 触摸时不导向至通过data-view-rel指定的视图
		 */
		;(function(){
			touch.addTapListener(document.documentElement, function(e){
				var eventTarget = e.changedTouches? e.changedTouches[0].target: e.target;

				/* 视图导向定义检测 */
				var targetViewId;
				var tmp = eventTarget;
				while(null == tmp.getAttribute("data-view-rel")){
					tmp = tmp.parentNode;

					if(!(tmp instanceof HTMLElement))
						tmp = null;
					if(null == tmp)
						break;
				}
				if(null != tmp)
					targetViewId = tmp.getAttribute("data-view-rel");

				if(null == targetViewId)
					return;

				/* 视图切换禁用标志检测 */
				var isViewRelDisabled = "true" == tmp.getAttribute("data-view-rel-disabled");

				/* 如果当前禁用视图跳转 */
				if(isViewRelDisabled)
					return;

				/* 阻止ghost click */
				e.preventDefault();

				/* 回退操作(":back") */
				if(PSVIEW_BACK == targetViewId.toLowerCase().trim()){
					history.go(-1);/* browser support */
					return;
				}

				/* 前进操作（":forward"） */
				if(PSVIEW_FORWARD == targetViewId.toLowerCase().trim()){
					history.go(1);/* browser support */
					return;
				}

				var relType = tmp.getAttribute("data-view-rel-type");
				relType = isEmptyString(relType, true)? "nav": relType;
				if(!/^(?:nav)|(?:change)$/.test(relType)){
					globalLogger.warn("Unknown view switch type: {}. {}", relType, tmp);
					relType = "nav";
				}

				/* 呈现ID指定的视图 */
				View[relType + "To"](targetViewId, {type: View.SWITCHTYPE_VIEWSWITCH});
			}, {useCapture: true});
		})();

		/* 标记视图就绪 */
		markViewReady();
	};

	document.addEventListener("DOMContentLoaded", init);

	ctx[name] = View;
})(window, "View");