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
	var MOBILE_REGEX = /mobile|tablet|ip(ad|hone|od)|android/i;
	var SUPPORT_TOUCH = ('ontouchstart' in window);
	var IS_MOBILE = MOBILE_REGEX.test(navigator.userAgent);
	
	/* 日志输出组件 */
	var Logger = (function(){var e=function(){if(arguments.length==0){return}var k=arguments;var l=" "+String(arguments[0]);var j=1;l=l.replace(/([^\\])\{\}/g,function(n,m){var o=(k.length-1)<j?"{}":String(g(k[j]));j++;return m+o});l=l.replace(/\\\{\}/g,"{}");return l.substring(1)};var d=function(){var o=new Date();var m=o.getFullYear();var n="0"+String(o.getMonth()+1);n=n.substring(n.length-2);var k="0"+String(o.getDate());k=k.substring(k.length-2);var j="0"+String(o.getHours());j=j.substring(j.length-2);var l="0"+String(o.getMinutes());l=l.substring(l.length-2);var p="0"+String(o.getSeconds());p=p.substring(p.length-2);return n+k+" "+j+":"+l+":"+p};var g=function(m){if(null==m){return null}if((typeof m=="number")||(typeof m=="string")||(typeof m=="boolean")){return m}else{if(typeof m=="function"){return"function "+m.name+"(){...}"}else{if(!(m instanceof Array)&&(typeof m=="object")){if(String(m)!="[object Object]"){return String(m)}else{try{var j={};for(var l in m){j[l]=g(m[l])}return JSON.stringify(j)}catch(k){return String(m)}}}else{if(m instanceof Array){return JSON.stringify(m.map(function(n){return g(n)}))}else{return m}}}}};var h=function(j){return d()+" ["+j+"]: "};var c={};var b=function(j){this.getName=function(){return j};this.debug=function(){var k=e.apply(null,arguments);console.debug(h(j)+k)};this.info=function(){var k=e.apply(null,arguments);console.info(h(j)+k)};this.warn=function(){var k=e.apply(null,arguments);console.warn(h(j)+k)};this.error=function(){var k=e.apply(null,arguments);console.error(h(j)+k)};this.log=function(){var k=e.apply(null,arguments);console.log(h(j)+k)}};var f=function(k){if(k in c){return c[k]}var j=new b(k);c[k]=j;return j};b.ofName=f;return b;})();
	
	var globalLogger = Logger.ofName("View");
	
	/**
	 * 触摸支持
	 */
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
	 * 设定参数默认值
	 * @param ops {Json} 要设定默认值的目标
	 * @param dftOps {Json} 提供的默认值配置
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
					setTimeout(function(){
						eventHandlers[type].forEach(function(handler){
							handler.call(ctx, event);
						});
					}, 0);
				};
			})(obj, ctx);
		};
	})();
	
	/**
	 * 浏览状态
	 * @param viewId {String} 视图ID
	 * @param timestamp {Long} 时间戳
	 */
	var ViewState = function(viewId, timestamp){
		if(arguments.length < 2)
			timestamp = Date.now();
		
		Object.defineProperty(this, "viewId", {value: viewId, configurable: false, writable: false, enumerable: true});
		Object.defineProperty(this, "timestamp", {value: timestamp, configurable: false, writable: false, enumerable: true});
		
		this.toString = function(){
			return JSON.stringify(this);
		};
		
		this.clone = function(){
			return JSON.parse(this.toString());
		};
	};

	/**
	 * 判断特定的对象是否是ViewState的实例
	 * @param obj {Object} 要判断的对象
	 */
	ViewState.isConstructorOf = function(obj){
		if(null == obj || typeof obj != "object")
			return false;
		
		return obj.hasOwnProperty("viewId") && obj.hasOwnProperty("timestamp");
	}

	/**
	 * 向history中添加view浏览历史
	 * @param viewId {String} 视图ID
	 * @param timestamp {String} 视图压入堆栈的时间戳
	 * @param updateLocation {Boolean} 是否同步更新地址栏。默认为true
	 */
	var pushViewState = function(viewId, timestamp, updateLocation){
		if(arguments.length < 2)
			timestamp = Date.now();
		if(arguments.length < 3)
			updateLocation = true;

		var state = new ViewState(viewId, timestamp).clone();
		globalLogger.log("↓ {}", JSON.stringify(state));

		if(historyPushPopSupported)
			history.pushState(state, "", "#" + viewId);
		else
			location.hash = viewId;
		
		View.currentState = state;
	};
	
	/**
	 * 更新history中最后一个view浏览历史
	 * @param viewId {String} 视图ID
	 * @param timestamp {String} 视图压入堆栈的时间戳
	 * @param updateLocation {Boolean} 是否同步更新地址栏。默认为true
	 */
	var replaceViewState = function(viewId, timestamp){
		if(arguments.length < 2)
			timestamp = Date.now();
		if(arguments.length < 3)
			updateLocation = true;
		
		var state = new ViewState(viewId, timestamp).clone();
		globalLogger.log("% {}", state.clon);

		if(historyPushPopSupported)
			history.replaceState(state, "", "#" + viewId);
		else
			location.hash = viewId;
		
		View.currentState = state;
	};
	
	/**
	 * 视图不存在错误
	 */
	var ViewNotExistError = function(msg){
		Error.call(this, msg);
	};
	ViewNotExistError.prototype = Object.create(Error.prototype);
	
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
	
	/**
	 * 视图类
	 * @param id {String} 视图对应的DOM元素的id
	 */
	var View = function(id){
		if(null == document.querySelector("#" + id + "[data-view=true]")){
			throw new ViewNotExistError("View of id: " + id + " does not exist(No element matching pattern: '#" + id + "[data-view=true]' found)!");
		}
		
		/* 存储该视图触发的各个事件的最新数据。key：事件名；value：数据 */
		var eventData = {};
		
		/** 上下文，用于存储视图相关的数据等 */
		var context = (function(){
			var obj = {};	

			Object.defineProperty(obj, "has", {value: function(name){
				return name in obj;
			}, configurable: false, writable: false, enumerable: false});

			Object.defineProperty(obj, "set", {value: function(name, value){
				obj[name] = value;
			}, configurable: false, writable: false, enumerable: false});

			Object.defineProperty(obj, "get", {value: function(name, value){
				return obj[name];
			}, configurable: false, writable: false, enumerable: false});
			
			return obj;
		})();
		
		/**
		 * 启用事件驱动机制
		 * 事件 beforeenter：视图进入前触发
		 * 事件 enter：当前视图变为活动视图时触发
		 * 事件 afterenter：视图进入后触发
		 * 事件 ready：当前视图变为活动视图时，且enter事件触发后触发
		 * 事件 leave：当前视图由活动视图变为非活动视图时触发
		 */
		eventDrive(this, document.querySelector("#" + id));
		
		var fire = this.fire;
		this.fire = function(name, value){
			eventData[name] = value;
			fire(name, value);
		};
		
		/* 日志输出组件 */
		Object.defineProperty(this, "logger", {value: Logger.ofName("View#" + id), configurable: false, writable: false, enumerable: true});
		
		/**
		 * 获取最新的，指定事件对应的数据
		 * @param {String} eventName 事件名字
		 */
		this.getLatestEventData = function(eventName){
			return eventData[eventName];
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
		 * 获取视图上下文
		 */
		this.getContext = function(){
			return context;
		};
		
		/**
		 * 清除视图上下文
		 */
		this.clearContext = function(){
			context = {};
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
			var keep = document.documentElement.getAttribute("data-view-directly-accessible");
			keep = null == keep? "false": keep;
			keep = keep.toLowerCase();
			
			var directAccessable = false;
			if("true" == keep){/** 如果设定全部可以直接访问 */
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
				if(null == fallbackViewId || !View.isExisting(fallbackViewId)){
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
	
	/**
	 * 常量定义
	 */
	/** 视图切换操作类型：由浏览器前进操作触发 */
	View.SWITCHTYPE_HISTORYFORWARD = "history.forward";
	/** 视图切换操作类型：由浏览器后退操作触发 */
	View.SWITCHTYPE_HISTORYBACK = "history.back";
	/** 视图切换操作类型：由视图切换操作触发 */
	View.SWITCHTYPE_VIEWSWITCH = "view.switch";
	
	
	/** 通过文档扫描得出的配置的视图集合 */
	var viewInstances = [];
	
	/** 视图切换动画 */
	var viewSwitchAnimation = null;
	
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
	 * @param id
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
	View.isExisting = function(id){
		for(var i = 0; i < viewInstances.length; i++)
			if(viewInstances[i].getId().trim() == id.trim())
				return true;
		
		return false;
	};
	
	/**
	 * 返回当前活动的视图
	 */
	View.getActiveView = function(){
		for(var i = 0; i < viewInstances.length; i++)
			if(viewInstances[i].isActive())
				return viewInstances[i];
		
		return null;
	};
	
	/**
	 * 返回默认视图
	 */
	View.getDefaultView = function(){
		for(var i = 0; i < viewInstances.length; i++)
			if(viewInstances[i].isDefault())
				return viewInstances[i];
		
		return null;
	};
	
	/**
	 * 设置视图切换动画
	 * @param animationFunction {Function} 视图切换动画
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
	 * 切换视图
	 * @param srcView {View} 源视图
	 * @param targetView {View} 目标视图
	 * @param type {String} 切换操作类型（View.SWITCHTYPE_HISTORYFORWARD || View.SWITCHTYPE_HISTORYBACK || View.SWITCHTYPE_VIEWSWITCH）
	 * @param withAnimation {Boolean} 是否执行动画
	 */
	var _switchTo = function(srcView, targetView, type, withAnimation){
		if(arguments.length < 3)
			withAnimation = true;
		if(arguments.length < 2)
			type = View.SWITCHTYPE_VIEWSWITCH;
		type = type || View.SWITCHTYPE_VIEWSWITCH;

		/** 触发前置切换监听器 */
		View.fire("beforechange", {currentView: srcView, targetView: targetView, type: type});
		
		var display = function(){
			srcView && srcView.getDomElement().classList.remove("active");
			targetView.getDomElement().classList.add("active");
		};
		
		/* 执行切换操作 */
		srcView && srcView.fire("leave", type);
		if(!withAnimation){
			display();
			
			if(!targetView.isReady()){
				readyViews.push(targetView.getId());
				targetView.fire("ready", type);
			}
			targetView.fire("beforeenter", type);
			targetView.fire("enter", type);
			targetView.fire("afterenter", type);
		}else{
			var render = function(){
				display();
				
				if(!targetView.isReady()){
					readyViews.push(targetView.getId());
					targetView.fire("ready", type);
				}
				targetView.fire("beforeenter", type);
				targetView.fire("enter", type);
				targetView.fire("afterenter", type);
			};
			
			if(viewSwitchAnimation){
				viewSwitchAnimation.call(null, srcView? srcView.getDomElement(): null, targetView.getDomElement(), type, render);
			}else
				render();
		}
		
		/** 触发后置切换监听器 */
		View.fire("afterchange", {currentView: srcView, targetView: targetView, type: type});
	};

	/**
	 * 切换视图
	 * @param targetViewId 目标视图ID
	 * @param type 切换操作类型（View.SWITCHTYPE_HISTORYFORWARD || View.SWITCHTYPE_HISTORYBACK || View.SWITCHTYPE_VIEWSWITCH）
	 * @param withAnimation 是否执行动画
	 */
	View.switchTo = function(targetViewId, type, withAnimation){
		if(arguments.length < 3)
			withAnimation = true;
		if(arguments.length < 2)
			type = View.SWITCHTYPE_VIEWSWITCH;
		type = type || View.SWITCHTYPE_VIEWSWITCH;

		/* 当前活动视图 */
		var currentView = View.getActiveView();
		
		/** 检查目标视图是否存在 */
		if(!View.isExisting(targetViewId))
			throw new Error("target view: " + targetViewId + " does not exist!");
		
		/* 如果切换目标是自己，则直接返回 */
		if(currentView.getId().toLowerCase() == targetViewId.toLowerCase())
			return;
		
		globalLogger.log("{} → {} {}", currentView.getId(), targetViewId, type);

		/* 目标视图 */
		var targetView = View.ofId(targetViewId);
		type = (type.toLowerCase() == View.SWITCHTYPE_HISTORYFORWARD? View.SWITCHTYPE_HISTORYFORWARD: (
				type.toLowerCase() == View.SWITCHTYPE_HISTORYBACK? View.SWITCHTYPE_HISTORYBACK: View.SWITCHTYPE_VIEWSWITCH));
		
		_switchTo(currentView, targetView, type, withAnimation);
		
		return View;
	};
	View.switchView = View.switchTo;
	
	/**
	 * 切换视图，同时更新相关状态（压入堆栈）
	 * @param targetViewId 目标视图ID
	 * @param type 切换操作类型（View.SWITCHTYPE_HISTORYFORWARD || View.SWITCHTYPE_HISTORYBACK || View.SWITCHTYPE_VIEWSWITCH）
	 */
	View.navTo = function(targetViewId, type){
		var state = new ViewState(targetViewId, Date.now());
		
		/** 伪视图支持 */
		/* 回退操作(":back") */
		if(":back" == targetViewId.toLowerCase().trim()){
			history.go(-1);/* browser support */
			
			return;
		}
		/* 前进操作（":forward"） */
		if(":forward" == targetViewId.toLowerCase().trim()){
			history.go(1);/* browser support */
			
			return;
		}
		
		/** 检查目标视图是否存在 */
		if(!View.isExisting(targetViewId))
			throw new Error("target view: " + targetViewId + " does not exist!");
		
		View.switchTo(targetViewId, type);
		pushViewState(targetViewId);
		
		return View;
	};
	View.updateView = View.navTo;

	/**
	 * 切换视图，同时更新相关状态（更新堆栈）
	 * @param targetViewId 目标视图ID
	 * @param type 切换操作类型（View.SWITCHTYPE_HISTORYFORWARD || View.SWITCHTYPE_HISTORYBACK || View.SWITCHTYPE_VIEWSWITCH）
	 */
	View.changeTo = function(targetViewId, type){
		View.switchTo(targetViewId, type);
		replaceViewState(targetViewId);
		
		return View;
	};
	
	/** 暴露日志组件，供第三方使用 */
	View.Logger = Logger;
	
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
					cb && cb();
				});
			}, 0);
		};
		
		/**
		 * 就绪后执行的方法
		 */
		return function(callback){
			/* 如果已经就绪，则立即执行 */
			if(isReady){
				callback && callback();
				return;
			}
			
			if(callbacks.indexOf(callback) != -1)
				return;
			callbacks.push(callback);
			
			return View;
		};
	})();
	
	/**
	 * 根据提供的视图ID计算最终映射到的可以呈现出来的视图
	 * @param viewId {String} 视图ID
	 * @return {View} 最终视图
	 */
	var getFinalView = function(viewId){
		var targetView = null;
		
		if(null == viewId || "" == viewId){/** 判断是否指定目标视图 */
			targetView = View.getActiveView();
		}else if(!View.isExisting(viewId)){/** 判断指定的视图是否存在 */
			targetView = View.getActiveView();
		}else if(View.ofId(viewId).isDirectlyAccessible())/** 判断指定的视图是否支持直接访问 */
			targetView = View.ofId(viewId);
		else
			targetView = View.ofId(viewId).getFallbackView();
		
		return targetView;
	};
	
	/**
	 * 响应地址栏的hash进行渲染操作
	 */
	var stateChangeListener =  function(e){
		var currentActiveView = View.getActiveView();
		
		globalLogger.log("{} Current: {}", historyPushPopSupported? "State poped!": "Hash changed!", currentActiveView.getId());
		globalLogger.log("↑ {}", historyPushPopSupported? JSON.stringify(e.state): location.hash);
		
		var newViewId, type = View.SWITCHTYPE_VIEWSWITCH, targetView = null;
		if(null == e.state){/* 手动输入目标视图ID */
			type = View.SWITCHTYPE_VIEWSWITCH;

			newViewId = location.hash.replace(/^#/, "").toLowerCase();
			targetView = getFinalView(newViewId);
			
			replaceViewState(targetView.getId());
		}else{
			var popedNewState = e.state;
		
			newViewId = popedNewState.viewId;
			if(View.isExisting(newViewId))
				targetView = View.ofId(newViewId);
			else{
				globalLogger.warn("Poped view: " + newViewId + " does not exist, keeping current.");
				targetView = currentActiveView;
			}
		
			if(View.currentState != null)
				type = popedNewState.timestamp < View.currentState.timestamp? View.SWITCHTYPE_HISTORYBACK: View.SWITCHTYPE_HISTORYFORWARD;
			
			replaceViewState(targetView.getId(), popedNewState.timestamp);
		}
		
		/* 视图切换 */
		View.switchTo(targetView.getId(), type);
	};
	
	var init = function(){
		/** 事件监听 */
		window.addEventListener(historyPushPopSupported? "popstate": "hashchange", stateChangeListener);
		
		/* 扫描文档，遍历定义视图 */
		var viewObjs = document.querySelectorAll("*[data-view=true]");
		
		/* 默认视图 */
		var dftViewObj = null;
		
		var documentTitle = document.title;
		
		/** 确定默认视图 */
		var determineDefaultView = function(){
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
			}
			
			return dftViewObj;
		};
		
		[].forEach.call(viewObjs, function(viewObj){
			/* 定义视图 */
			View.ofId(viewObj.id);
			
			/* 去除可能存在的激活状态 */
			viewObj.classList.remove("active");
			
			/* 确定默认视图，并添加激活标识 */
			determineDefaultView();
			if(null != dftViewObj)
				dftViewObj.classList.add("active");
			
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

		/**
		 * 呈现指定视图
		 */
		(function(){
			var defaultViewId = View.getDefaultView().getId();
			var specifiedViewId = location.hash.replace(/^#/i, "").toLowerCase().trim();
			var targetViewId = "" == specifiedViewId? View.getDefaultView().getId(): specifiedViewId;
			var targetView = getFinalView(targetViewId);

			globalLogger.log("Initial target view: " + targetView.getId());

			var isViewState = ViewState.isConstructorOf(history.state);
			if(null != history.state){
				globalLogger.log("Found existing state: {}, isViewState? {}", JSON.stringify(history.state), isViewState);

				if(!(isViewState && history.state.viewId == targetView.getId()))
					replaceViewState(targetView.getId());
			}else{
				replaceViewState(targetView.getId());
			}

			_switchTo(View.getActiveView(), targetView, null, false);
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
		(function(){
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
				
				
				/* 回退操作(":back") */
				if(":back" == targetViewId.toLowerCase().trim()){
					history.go(-1);/* browser support */
					
					return;
				}
				
				/* 前进操作（":forward"） */
				if(":forward" == targetViewId.toLowerCase().trim()){
					history.go(1);/* browser support */
					
					return;
				}
				
				var relType = tmp.getAttribute("data-view-rel-type");
				relType = null == relType || "" == relType.trim()? "nav": relType;
				if(!/^(?:nav)|(?:change)$/.test(relType)){
					globalLogger.warn("Unknown view switch type: {}. {}", relType, tmp);
					relType = "nav";
				}

				/* 呈现ID指定的视图 */
				View[relType + "To"](targetViewId, View.SWITCHTYPE_VIEWSWITCH);

				/* 阻止ghost click */
				e.preventDefault();
			}, {useCapture: true});
		})();
		
		/* 标记视图就绪 */
		markViewReady();
	};
	
	document.addEventListener("DOMContentLoaded", init);
	
	ctx[name] = View;
})(window, "View");