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
		eventDrive = ctx[name].eventDrive,
		env = ctx[name].util.env,
		Logger = ctx[name].Logger,
		touch = ctx[name].touch,
		layout = ctx[name].layout;

	var ViewState = ctx[name].ViewState,
		OperationState = ctx[name].OperationState,
		ViewConfigurationSet = ctx[name].ViewConfigurationSet,
		ViewContext = ctx[name].ViewContext,
		ViewLayout = ctx[name].ViewLayout,
		ViewWantedData = ctx[name].ViewWantedData;

	var globalLogger = Logger.globalLogger;


	var docEle = document.documentElement;
	var NOT_SUPPLIED = new Object();

	var PSVIEW_BACK = ":back",/* 伪视图：后退 */
		PSVIEW_FORWARD = ":forward",/* 伪视图：前进 */
		PSVIEW_DEFAULT = ":default-view";/* 伪视图：默认视图 */

	/** 通过文档扫描得出的配置的视图集合 */
	var viewInstances = [];

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

	/** 视图切换动画 */
	var viewSwitchAnimation = null;

	/** DOM属性集合 */
	var attr$view = "data-view",
		attr$view_default = "data-view-default",
		attr$view_directly_accessible = "data-view-directly-accessible",
		attr$view_group = "data-view-group",
		attr$view_fallback = "data-view-fallback",
		attr$view_rel = "data-view-rel",
		attr$view_rel_disabled = "data-view-rel-disabled",
		attr$view_rel_type = "data-view-rel-type",
		attr$view_title = "data-view-title",
		attr$view_container = "data-view-container",
		attr$view_os = "data-view-os",
		attr$view_whr = "data-view-whr";/* width height ratio. Value: 'w/h' */

	var defaultWidthHeightRatio = "320/568";/* iPhone5 */

	var historyPushPopSupported = ("pushState" in history) && (typeof history.pushState == "function");
	globalLogger.log("History pushState is " + (historyPushPopSupported? "": "not ") + "supported");

	
	/**
	 * 判断指定编号对应的视图是否是伪视图
	 * @param {String} viewId 视图编号
	 */
	var isPseudoView = function(viewId){
		return PSVIEW_BACK == viewId || PSVIEW_FORWARD == viewId || PSVIEW_DEFAULT == viewId;
	};

	/**
	 * 设置特定视图特定的参数取值
	 * @param {String} viewId 视图ID
	 * @param {String} name 要设置的键的名称
	 * @param {Any} value 要设置的键的取值
	 */
	var setViewParameter = function(viewId, name, value){
		if(!View.ifExists(viewId) && !isPseudoView(viewId))
			throw new Error("View of id: " + viewId + " does not exist.");
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
			throw new Error("View of id: " + viewId + " does not exist.");

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
	 * 从DOM中获取所有声明为视图的DOM元素
	 * @return {NodeList}
	 */
	var getViewObjs = function(){
		var viewObjs = document.querySelectorAll("*[" + attr$view + "=true]");
		return viewObjs;
	};

	/**
	 * 从DOM中获取ID为指定编号的视图DOM元素
	 */
	var getViewObjOfId = function(viewId){
		return document.querySelector("#" + viewId + "[" + attr$view + "=true]");
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
			return start + "&" + util.xEncodeURIComponent(e) + "=" + util.xEncodeURIComponent(options[e]);
		}, "");
		if(tmp.length > 0)
			str += sep + tmp.substring(1);

		return str;
	};

	/**
	 * 向history中添加view浏览历史
	 * @param {String} viewId 视图ID
	 * @param {String} [timeBasedUniqueString=util.getUniqueString()] 基于时间戳的视图压入堆栈的唯一标识
	 * @param {JsonObject} [options=null] 选项集合
	 */
	var pushViewState = function(viewId, timeBasedUniqueString, options){
		if(arguments.length < 3)
			options = null;
		if(arguments.length < 2)
			timeBasedUniqueString = util.getUniqueString();
		timeBasedUniqueString = timeBasedUniqueString || util.getUniqueString();

		var state = new ViewState(viewId, timeBasedUniqueString, options).clone();
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
	 * @param {String} [timeBasedUniqueString=util.getUniqueString()] 基于时间戳的视图更新堆栈的唯一标识
	 * @param {JsonObject} [options=null] 选项集合
	 */
	var replaceViewState = function(viewId, timeBasedUniqueString, options){
		if(arguments.length < 3)
			options = null;
		if(arguments.length < 2)
			timeBasedUniqueString = util.getUniqueString();
		timeBasedUniqueString = timeBasedUniqueString || util.getUniqueString();

		var state = new ViewState(viewId, timeBasedUniqueString, options).clone();
		globalLogger.log("% {}", JSON.stringify(state));

		if(historyPushPopSupported)
			history.replaceState(state, "", "#" + concatViewOptions(viewId, options));
		else
			location.hash = concatViewOptions(viewId, options);

		View.currentState = state;
	};

	/**
	 * 从给定的字符串中解析参数
	 * @param {String} str 形如：a=1&b=2的字符串
	 * @returns {JsonObject}
	 */
	var parseParams = function(str){
		if(null == str || "" == String(str).trim())
			return null;

		var options = null;
		var kvPairs = str.split(/\s*&\s*/);
		if(0 != kvPairs.length){
			options = {};
			kvPairs.forEach(function(pair){
				var s = pair.split(/\s*=\s*/);
				options[decodeURIComponent(s[0])] = decodeURIComponent(s[1]);
			});
		}

		return options;
	};

	/**
	 * 从地址栏hash中解析视图信息
	 * @param {String} hash 地址栏Hash
	 * @return {JsonObject} {viewId: [视图编号], options: [选项集合]}
	 */
	var parseViewInfoFromHash = function(hash){
		if("" == hash)
			return null;

		var r = /^#([\w\$\-]+)(?:!+(.*))?/;
		var m = hash.match(r);
		if(null == m)
			return null;

		var viewId = m[1], options = parseParams(m[2]);
		return {viewId: m[1], options: options};
	};

	/**
	 * 获取当前正在呈现的，或即将呈现的视图ID
	 * 如果视图切换过程中有动画，则通过navTo或changeTo方法执行视图切换动作后，地址栏中呈现的视图ID不一定是当前的活动视图的ID。
	 * 视图切换时，地址栏中的视图ID会被即时替换，替换为目标视图ID
	 */
	var getRenderingViewId = function(){
		if(null == View.currentState)
			return null;

		return View.currentState.viewId;
	};

	

	/**
	 * 视图类
	 * @param id {String} 视图对应的DOM元素的id
	 */
	var View = function(id){
		if(null === document.querySelector("#" + id + "[" + attr$view + "=true]"))
			throw new Error("View of id: " + id + " does not exist(No element matching pattern: '#" + id + "[" + attr$view + "=true]' found)!");

		/* 存储该视图触发的各个事件的最新数据。key：事件名；value：数据 */
		var eventData = {};

		/** 上下文，用于存储视图相关的数据等 */
		var context = new ViewContext();

		/** 视图配置集合 */
		var configSet = new ViewConfigurationSet(id);

		/** 被其它地方期待提供的数据 */
		var wantedData = new ViewWantedData(id);

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
		this.fire = function(name, value, async){
			eventData[name] = value;
			fire(name, value, async);
		};

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
		 * 获取视图对应的DOM元素
		 */
		this.getDomElement = function(){
			return document.querySelector("#" + id);
		};
		
		/**
		 * 获取视图的群组名称（不区分大小写）。
		 * @returns {String} 小写的群组名称
		 */
		this.getGroupName = function(){
			var name = this.getDomElement().getAttribute(attr$view_group);
			return null == name? name: String(name).toLowerCase();
		};

		/**
		 * 在视图内查找特定元素
		 * @param selector {String} 元素选择器
		 * @return {HTMLElement} 找到的元素
		 */
		this.find = function(selector){
			return this.getDomElement().querySelector(selector);
		};

		/**
		 * 在视图内查找多个元素
		 * @param selector {String} 元素选择器
		 * @return {NodeList} 找到的元素列表
		 */
		this.findAll = function(selector){
			return this.getDomElement().querySelectorAll(selector);
		};

		/**
		 * 满足数据期待
		 * @param {String} name 数据的标识名称
		 * @param {*} data 提供的数据
		 * @returns {View}
		 */
		this.fulfillWantedData = function(name, data){
			/**
			 * View.want()方法在调用但没有传递参数：“数据不存在时的处理方法”时，
			 * want方法会自动跳转至该视图，并传递名称为该名称的回调方法
			 *
			 * @type {string}
			 */
			var callbackParamName = name + ":fulFillCallback";
			var callback = this.getParameter(callbackParamName);
			if(typeof callback === "function"){
				globalLogger.info("Found auto attached(by 'View.want()' method) fulfill listener(parameter name: '{}'), auto execute this listener with fulfilled data.", callbackParamName);
				util.try2Call(callback, null, data, {dataResolveMethod: "resolveLater"});
			}

			wantedData.fulfill(name, data);
			return this;
		};

		/**
		 * 判断给定名称标识对应的数据是否已经存在
		 * @param {String} name 数据的标识名称
		 * @returns {boolean}
		 */
		this.isWantedDataFulfilled = function(name){
			return wantedData.isFulfilled(name);
		};

		/**
		 * 设置视图布局方法
		 * @param {Function} _layoutAction 布局方法
		 * @param {Boolean} [_layoutWhenLayoutChanges=true] 外层布局改变时，是否执行布局动作
		 */
		this.setLayoutAction = function(_layoutAction, _layoutWhenLayoutChanges){
			if(arguments.length < 2)
				_layoutWhenLayoutChanges = true;
			ViewLayout.ofId(id).setIfLayoutWhenLayoutChanges(!!_layoutWhenLayoutChanges).setLayoutAction(_layoutAction);
			
			return this;
		};
		
		/**
		 * 获取视图布局方法
		 */
		this.getLayoutAction = function(){
			return ViewLayout.ofId(id).getLayoutAction();
		};

		/**
		 * 判断视图参数中是否含有指定名称的参数
		 * @param {String} [name] 参数名。区分大小写
		 */
		this.hasParameter = function(name){
			if(null === name || undefined === name)
				return false;

			var params = viewParameters[this.getId()];
			return null == params? false: (name in params);
		};

		/**
		 * 获取视图参数中指定名称的参数取值
		 * @param {String} [name] 参数名。区分大小写。如果没有指定参数名，则返回整个参数。
		 */
		this.getParameter = function(name){
			var params = viewParameters[this.getId()];
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
			return /true/i.test(this.getDomElement().getAttribute(attr$view_default));
		};

		/**
		 * 判断当前视图是否可以通过地址栏手动直接访问
		 */
		this.isDirectlyAccessible = function(){
			var attr = this.getDomElement().getAttribute(attr$view_directly_accessible);
			attr = null == attr? null: attr.toLowerCase();

			if(View.isDirectlyAccessible())/** 如果设定默认可以直接访问 */
				return "false" == attr? false: true;
			else
				return "true" == attr? true: false;
		};

		/**
		 * 设置当前视图是否通过地址栏手动直接访问
		 * @param {Boolean} isDirectlyAccessible 视图是否通过地址栏手动直接访问
		 */
		this.setAsDirectlyAccessible = function(isDirectlyAccessible){
			if(arguments.lengt < 1)
				isDirectlyAccessible = true;
			
			this.getDomElement().setAttribute(attr$view_directly_accessible, String(isDirectlyAccessible));
			return this;
		};

		/**
		 * 设置视图标题
		 * @param {String} title 标题。如果为null，则移除对应的DOM属性，改用网页的默认标题
		 */
		this.setTitle = function(title){
			if(null == title){
				this.getDomElement().removeAttribute(attr$view_title);
				return this;
			}

			title = String(title);
			this.getDomElement().setAttribute(attr$view_title, title);
			if(this.isActive())
				document.title = title;

			return this;
		};

		/**
		 * 获取视图标题
		 */
		this.getTitle = function(title){
			return this.getDomElement().getAttribute(attr$view_title);
		};

		/**
		 * 设置回退视图
		 * @param {String} fallbackViewId 回退视图ID，或伪视图：":default-view"，或视图群组
		 */
		this.setFallbackViewId = function(fallbackViewId){
			if(null == fallbackViewId || "" == fallbackViewId.trim())
				return this;

			/* 默认视图（":default-view"） */
			if(util.ifStringEqualsIgnoreCase(PSVIEW_DEFAULT, fallbackViewId)){
				var defaultView = View.getDefaultView();
				if(null == defaultView){
					globalLogger.error("No default view found.");
					return this;
				}else
					fallbackViewId = defaultView.getId();
			}else if(/^~/.test(fallbackViewId)){/* 群组视图（"~[groupName]"） */
				var groupName = fallbackViewId.substring(1);
				var firstViewId = findFirstViewIdOfGroupName(groupName);
				if(null == firstViewId){
					globalLogger.warn("No view of group: {} found.", groupName);
					return this;
				}
				
				fallbackViewId = firstViewId;
			}

			if(!View.ifExists(fallbackViewId)){
				globalLogger.warn("No view of id: {} found.", fallbackViewId);
				return this;
			}
			if(this.getId() == fallbackViewId)
				return this;

			this.getDomElement().setAttribute(attr$view_fallback, fallbackViewId);
			return this;
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
				var fallbackViewId = view.getDomElement().getAttribute(attr$view_fallback);

				/* 默认视图（":default-view"） */
				if(util.ifStringEqualsIgnoreCase(PSVIEW_DEFAULT, fallbackViewId)){
					return View.getDefaultView();
				}

				/* 群组视图（"~[groupName]"） */
				if(/^~/.test(fallbackViewId)){
					var groupName = fallbackViewId.substring(1);
					var firstViewId = findFirstViewIdOfGroupName(groupName);
					if(null == firstViewId)
						return View.getDefaultView();
					
					fallbackViewId = firstViewId;
				}

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
	util.defineReadOnlyProperty(View, "SWITCHTYPE_HISTORYFORWARD", "history.forward");
	/** 视图切换操作类型：由浏览器后退操作触发 */
	util.defineReadOnlyProperty(View, "SWITCHTYPE_HISTORYBACK", "history.back");
	/** 视图切换操作类型：由视图切换：View.navTo操作触发 */
	util.defineReadOnlyProperty(View, "SWITCHTYPE_VIEWNAV", "view.nav");
	/** 视图切换操作类型：由视图切换：View.changeTo操作触发 */
	util.defineReadOnlyProperty(View, "SWITCHTYPE_VIEWCHANGE", "view.change");
	
	var normalizeSwitchType = function(type){
		if(null == type || "" == String(type).trim())
			type = View.SWITCHTYPE_VIEWNAV;
		var isNav = util.ifStringEqualsIgnoreCase(type, View.SWITCHTYPE_VIEWNAV),
			isChange = util.ifStringEqualsIgnoreCase(type, View.SWITCHTYPE_VIEWCHANGE),
			isBack = util.ifStringEqualsIgnoreCase(type, View.SWITCHTYPE_HISTORYBACK),
			isForward = util.ifStringEqualsIgnoreCase(type, View.SWITCHTYPE_HISTORYFORWARD);
		if(!isBack && !isForward && !isNav && !isChange)
			type = View.SWITCHTYPE_VIEWNAV;
		
		return type;
	};

	/** 最近一次浏览状态 */
	View.currentState = null;

	/** 暴露日志组件，供第三方使用 */
	View.Logger = Logger;

	/** 暴露布局组件，供第三方使用 */
	View.layout = layout;

	/**
	 * 启用事件驱动机制
	 * 事件 beforechange：视图切换前触发
	 * 事件 afterchange：视图切换后触发
	 */
	eventDrive(View);

	/**
	 * 获取视图容器DOM元素
	 * @returns {HTMLElement}
	 */
	View.getViewContainerDomElement = function(){
		var obj = document.querySelector("[" + attr$view_container + "]");
		if(null == obj)
			obj = document.body;

		return obj;
	};

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
	 * @param {String} id 视图ID
	 */
	View.ifExists = function(id){
		for(var i = 0; i < viewInstances.length; i++)
			if(viewInstances[i].getId().trim() == id.trim())
				return true;

		return false;
	};
	View.isExisting = function(){
		globalLogger.warn("This is method is deprecated, please use 'View.ifExists' instead.");
		return View.ifExists.apply(View, arguments);
	};

	/**
	 * 列举所有视图
	 * @param {String} [groupName] 群组名称。不区分大小写。如果为空字符串，则返回所有视图
	 */
	View.listAll = function(groupName){
		if(arguments.length > 1)
			groupName = String(groupName).toLowerCase();
		
		var arr = [].concat(viewInstances);
		if(arguments.length < 1 || "" == groupName)
			return arr;
		
		return arr.filter(function(v){
			return groupName == v.getGroupName();
		});
	};
	
	/**
	 * 列举所有的视图群组
	 */
	View.listAllGroups = function(){
		var groupNames = View.listAll().reduce(function(start, view){
			var groupName = view.getGroupName();
			if(null == groupName || "" == String(groupName).trim() || start.indexOf(groupName) != -1)
				return start;
			
			start.push(groupName);
			return start;
		}, []);
		return groupNames;
	};
	
	/**
	 * 设置指定ID的视图为默认视图
	 * @param {String} viewId 视图ID
	 */
	View.setAsDefault = function(viewId){
		if(util.isEmptyString(viewId, true)){
			globalLogger.warn("No view id supplied to set as default.");
			return View;
		}

		/* 去除当前的默认视图的默认标记 */
		var viewObjs = getViewObjs();
		for(var i = 0; i < viewObjs.length; i++)
			viewObjs[i].removeAttribute(attr$view_default);

		/* 设置新的默认视图 */
		var viewObj = getViewObjOfId(viewId);
		if(null == viewObj){
			globalLogger.error("No view dom element of id: {} found to set as default.", viewId);
			return View;
		}
		viewObj.setAttribute(attr$view_default, "true");

		return View;
	};

	/**
	 * 判断视图默认是否可以直接访问
	 */
	View.isDirectlyAccessible = function(){
		var rootFlag = docEle.getAttribute(attr$view_directly_accessible);
		return util.ifStringEqualsIgnoreCase("true", rootFlag);
	};

	/**
	 * 设置视图默认是否可以直接访问
	 * @param {Boolean} accessible 是否可以直接访问
	 */
	View.setIsDirectlyAccessible = function(accessible){
		docEle.setAttribute(attr$view_directly_accessible, String(!!accessible).toLowerCase());
		return View;
	};

	/**
	 * 获取当前的活动视图。如果没有视图处于活动状态，则返回null
	 */
	View.getActiveView = function(){
		for(var i = 0; i < viewInstances.length; i++)
			if(viewInstances[i].isActive())
				return viewInstances[i];

		return null;
	};

	/**
	 * 获取默认视图。如果没有默认视图，则返回null
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
	 * 获取设置的视图切换动画
	 * @return {Function} 视图切换动画
	 */
	View.getSwitchAnimation = function(){
		return viewSwitchAnimation;
	};

	/**
	 * 获取当前的活动视图的视图选项集合
	 */
	View.getActiveViewOptions = function(){
		var viewInfo = parseViewInfoFromHash(location.hash);
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
		if(null == name || "" == String(name).trim()){
			globalLogger.error("Option name should not be empty.");
			return View;
		}

		var activeView = View.getActiveView();
		if(null == activeView){
			globalLogger.error("No active view to set option {} = {}.", name, value);
			return View;
		}

		name = String(name).trim();
		value = String(value).trim();

		var options = View.getActiveViewOptions() || {};
		options[name] = value;

		replaceViewState(activeView.getId(), View.currentState? View.currentState.sn: null, options);

		return View;
	};

	/**
	 * 索取特定视图可以提供的数据，如果数据存在，则执行给定的回调方法，否则执行给定的不存在方法
	 * @param {String} viewId 视图ID
	 * @param {String} name 数据的标识名称
	 * @param {Function} callback 数据存在时执行的回调方法
	 * @param {Function} notFulfilledCallback 数据不存在时执行的方法
	 * @returns {View}
	 */
	View.wantData = function(viewId, name, callback, notFulfilledCallback){
		var wantedData = ViewWantedData.ofName(viewId, name);

		if(typeof notFulfilledCallback !== "function"){
			var paramName = name + ":fulFillCallback";
			globalLogger.info("No parameter meaning 'callback for situation that wanted data is currently not fulfilled' specified, auto assign as View.navTo('{}', {params: {'{}': function(){...}}})", viewId, paramName);

			var params = {};
			params[paramName] = callback;
			notFulfilledCallback = function(){
				View.navTo(viewId, {params: params});
			};
		}

		wantedData.want(callback, notFulfilledCallback);
		return View;
	};

	/**
	 * 监听特定视图可以提供的数据，并在数据满足时执行特定方法
	 * @param {String} viewId 视图ID
	 * @param {String} name 数据的标识名称
	 * @param {Function} callback 数据被满足时执行的回调方法
	 * @returns {View}
	 */
	View.listenWantedData = function(viewId, name, callback){
		var wantedData = ViewWantedData.ofName(viewId, name);
		wantedData.listen(callback);
		return View;
	};

	/**
	 * 提供自定义的“判断当前是否是竖屏（或需要以竖屏方式渲染）”方法。方法需要返回布尔值。true：竖屏；false：横屏；
	 * @param {Function} impl 实现方法
	 */
	View.implIsPortrait = function(){
		ViewLayout.implIsPortrait.apply(ViewLayout, arguments);
		return View;
	};

	/**
	 * 切换视图
	 * @param {View} ops.srcView 源视图
	 * @param {View} ops.targetView {View} 目标视图
	 * @param {StringEnum} ops.type 切换操作类型（View.SWITCHTYPE_HISTORYFORWARD || View.SWITCHTYPE_HISTORYBACK || View.SWITCHTYPE_VIEWNAV || View.SWITCHTYPE_VIEWCHANGE）
	 * @param {Boolean} ops.withAnimation 是否执行动画
	 * @param {*} ops.params 视图参数。仅当切换操作类型为：View.SWITCHTYPE_VIEWNAV || View.SWITCHTYPE_VIEWCHANGE时才会被使用
	 */
	var switchView = function(ops){
		ops = util.setDftValue(ops, {
			srcView: null,
			targetView: null,
			type: View.SWITCHTYPE_VIEWNAV,
			withAnimation: true,
			params: null
		});

		var srcView = ops.srcView,
			targetView = ops.targetView,
			type = normalizeSwitchType(ops.type),
			params = ops.params;

		var isBack = util.ifStringEqualsIgnoreCase(type, View.SWITCHTYPE_HISTORYBACK),
			isForward = util.ifStringEqualsIgnoreCase(type, View.SWITCHTYPE_HISTORYFORWARD);

		var viewChangeParams = {currentView: srcView, targetView: targetView, type: type, params: params};

		var render = function(){
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
			var fireEvent = function(evt, async){
				try{
					targetView.fire(evt, eventData, async);
				}catch(e){
					globalLogger.error("Error occured while firing event: {} with data: {}", evt, eventData);
					
					if(e instanceof Error)
						console.error(e, e.stack);
					else
						console.error(e);
				}
			};

			/* 离开源视图 */
			srcView && srcView.getDomElement().classList.remove("active");
			srcView && srcView.fire("leave", {targetView: targetView, type: type});

			fireEvent("beforeenter", false);

			/* 进入新视图 */
			targetView.getDomElement().classList.add("active");
			ViewLayout.ofId(targetViewId).doLayout();
			View.fire("change", viewChangeParams, false);
			if(!targetView.isReady()){
				readyViews.push(targetViewId);
				fireEvent("ready", false);
			}
			fireEvent("enter", false);
			fireEvent("afterenter", false);

			/** 触发后置切换监听器 */
			View.fire("afterchange", viewChangeParams);
		};

		/** 触发前置切换监听器 */
		View.fire("beforechange", viewChangeParams, false);

		if(!ops.withAnimation)
			render();
		else{
			if(viewSwitchAnimation)
				viewSwitchAnimation.call(null, srcView? srcView.getDomElement(): null, targetView.getDomElement(), type, render);
			else
				render();
		}
	};

	/**
	 * 呈现指定的视图（不操作history）
	 * @param {String} targetViewId 目标视图ID
	 * @param {Object} ops 切换配置。详见switchView
	 */
	var show = function(targetViewId, ops){
		ops = util.setDftValue(ops, {}, true);

		/** 检查目标视图是否存在 */
		if(!View.ifExists(targetViewId)){
			globalLogger.log("Trying to navigate to view: {} with params: {}, options: {}",targetViewId, ops.params, ops.options);
			throw new Error("Target view: " + targetViewId + " does not exist!");
		}

		/* 当前活动视图 */
		var currentView = View.getActiveView();
		globalLogger.log("{} → {} {}", currentView? currentView.getId(): null, targetViewId, JSON.stringify(ops));

		/* 目标视图 */
		var targetView = View.ofId(targetViewId);

		ops.srcView = currentView;
		ops.targetView = targetView;
		switchView(ops);

		return View;
	};
	View.show = show;

	/**
	 * 查找隶属于给定名称的群组的第一个视图的视图ID
	 */
	var findFirstViewIdOfGroupName = function(groupName){
		if(null == groupName || "" == String(groupName).trim()){
			globalLogger.error("Empty view group name!.");
			return null;
		}
		groupName = String(groupName).trim().toLowerCase();
		
		var groupViews = View.listAll(groupName);
		if(null == groupViews || 0 == groupViews.length){
			globalLogger.error("No view of group: {} found.", groupName);
			return null;
		}
		
		var groupViewIds = groupViews.map(function(v){
			return v.getId();
		});
		targetViewId = groupViewIds[0];
		globalLogger.info("Found {} views of group: {}: {}, using the first one: {}.", groupViewIds.length, groupName, groupViewIds, targetViewId);
		
		return targetViewId;
	};
	
	/**
	 * 以“压入历史堆栈”的方式切换视图
	 * @param targetViewId 目标视图ID
	 * @param {Object} ops 切换配置。详见View.show
	 * @param {Object} ops.options 视图选项
	 */
	View.navTo = function(targetViewId, ops){
		targetViewId = targetViewId.trim();
		ops = util.setDftValue(ops, {});

		var renderingViewId = getRenderingViewId(),
			currentView = View.getActiveView();/* 当前活动视图 */

		/** 伪视图支持 */
		/* 回退操作(":back") */
		if(util.ifStringEqualsIgnoreCase(PSVIEW_BACK, targetViewId)){
			View.back(ops);
			return View;
		}
		/* 前进操作（":forward"） */
		if(util.ifStringEqualsIgnoreCase(PSVIEW_FORWARD, targetViewId)){
			View.forward(ops);
			return View;
		}
		/* 默认视图（":default-view"） */
		if(util.ifStringEqualsIgnoreCase(PSVIEW_DEFAULT, targetViewId)){
			var defaultView = View.getDefaultView();
			if(null == defaultView){
				globalLogger.error("No default view found.");
				return View;
			}
			
			targetViewId = defaultView.getId();
		}
		/* 群组视图（"~[groupName]"） */
		if(/^~/.test(targetViewId)){
			var groupName = targetViewId.substring(1);
			var firstViewId = findFirstViewIdOfGroupName(groupName);
			if(null == firstViewId)
				return View;
			
			targetViewId = firstViewId;
		}

		/* 检查目标视图是否存在 */
		if(!View.ifExists(targetViewId)){
			globalLogger.log("Trying to navigate to view: {} with params: {}, options: {}", targetViewId, ops.params, ops.options);

			var e = new Error("Target view: " + targetViewId + " does not exist! Firing event 'viewnotexist'...");
			console.error(e);
			View.fire("viewnotexist", {targetViewId: targetViewId});
			return View;
		}

		ops.type = View.SWITCHTYPE_VIEWNAV;
		pushViewState(targetViewId, null, null == ops? null: ops.options);
		show(targetViewId, ops);

		return View;
	};

	/**
	 * 以“替换当前堆栈”的方式切换视图
	 * @param targetViewId 目标视图ID
	 * @param {JsonObject} ops 切换配置。详见switchView
	 * @param {JsonObject} ops.options 视图选项
	 */
	View.changeTo = function(targetViewId, ops){
		ops = util.setDftValue(ops, {});

		var renderingViewId = getRenderingViewId(),
			currentView = View.getActiveView();/* 当前活动视图 */

		/* 默认视图（":default-view"） */
		if(util.ifStringEqualsIgnoreCase(PSVIEW_DEFAULT, targetViewId)){
			var defaultView = View.getDefaultView();
			if(null == defaultView){
				globalLogger.error("No default view found.");
				return;
			}
			
			targetViewId = defaultView.getId();
		}
		/* 群组视图（"~[groupName]"） */
		if(/^~/.test(targetViewId)){
			var groupName = targetViewId.substring(1);
			var firstViewId = findFirstViewIdOfGroupName(groupName);
			if(null == firstViewId)
				return View;
			
			targetViewId = firstViewId;
		}

		/* 检查目标视图是否存在 */
		if(!View.ifExists(targetViewId)){
			globalLogger.log("Trying to navigate to view: {} with params: {}, options: {}", targetViewId, ops.params, ops.options);

			var e = new Error("Target view: " + targetViewId + " does not exist! Firing event 'viewnotexist'...");
			console.error(e);
			View.fire("viewnotexist", {targetViewId: targetViewId});
			return View;
		}

		ops.type = View.SWITCHTYPE_VIEWCHANGE;
		replaceViewState(targetViewId, null, null == ops? null: ops.options);
		show(targetViewId, ops);

		return View;
	};

	/**
	 * 回退到上一个视图
	 * @param {Object} ops 切换配置
	 * @param {Object | null} ops.params 视图切换参数
	 */
	View.back = function(ops){
		/* 清除旧数据，并仅在指定了参数时才设置参数，防止污染其它回退操作 */
		clearViewParameters(PSVIEW_BACK);
		if(null != ops && "params" in ops)
			setViewParameters(PSVIEW_BACK, ops.params);

		history.go(-1);
		
		return View;
	};

	/**
	 * 前进到下一个视图
	 * @param {Object} ops 切换配置
	 * @param {Object | null} ops.params 视图切换参数
	 */
	View.forward = function(ops){
		/* 清除旧数据，并仅在指定了参数时才设置参数，防止污染其它前进操作 */
		clearViewParameters(PSVIEW_FORWARD);
		if(null != ops && "params" in ops)
			setViewParameters(PSVIEW_FORWARD, ops.params);

		history.go(1);
		
		return View;
	};

	/** 文档标题 */
	var documentTitle = document.title;

	/**
	 * 设置文档标题。开发者可以设定视图级别的标题，但如果特定视图没有自定义标题，将使用文档标题来呈现
	 * @param {String} title 文档标题
	 */
	var setDocumentTitle = function(title){
		if(util.isEmptyString(title, true)){
			globalLogger.warn("Invalid document title: " + title);
			return View;
		}

		document.title = documentTitle = title;
		return View;
	};
	View.setDocumentTitle = setDocumentTitle;

	/**
	 * 添加一次性的浏览器回退事件监听。该监听可以通过浏览器前进和回退重新执行
	 * @param {Function} callback 回调方法
	 */
	View.onceHistoryBack = function(callback){
		if(typeof callback != "function")
			throw new Error("Invalid argument! Type of 'Function' is needed.");

		OperationState.pushState(util.randomString(), callback);
		return View;
	};


	var isViewInited = false,/* 视图是否已经被初始化 */
		isViewReady = false;/* 视图是否已经就绪 */
	var markViewToBeInited,/* 标记视图准备初始化 */
		markViewInited,/* 标记视图已完成初始化 */
		markViewReady,/* 标记视图就绪 */

		viewInitializer,/* 视图初始化器 */
		viewInitializerExecTime;/* 视图初始化器不为空时，其自动执行时机。domready：DOM就绪后执行；rightnow：view.js被加载后立即执行。默认为：domready */


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
		if(util.isEmptyString(viewId, true) || !View.ifExists(viewId)){
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

		globalLogger.log("{} Current: {}", historyPushPopSupported? "State poped!": "Hash changed!", currentActiveView && currentActiveView.getId());
		globalLogger.log("↑ {}", historyPushPopSupported? JSON.stringify(e.state): location.hash);

		/* 视图切换 */
		var newViewId, type = View.SWITCHTYPE_VIEWNAV, options, targetView = null;
		if(null == e.state){/* 手动输入目标视图ID */
			type = View.SWITCHTYPE_VIEWNAV;

			var targetViewId;
			var viewInfo = parseViewInfoFromHash(location.hash);
			if(null == viewInfo){
				targetView = currentActiveView;
				targetViewId = currentActiveViewId;
			}else{
				newViewId = viewInfo.viewId;

				targetView = getFinalView(newViewId);
				if(null != targetView)
					targetViewId = targetView.getId();
			}

			if(null != targetViewId){
				var isTargetViewAsSpecified = targetViewId == newViewId,
					isTargetViewRemainsCurrent = targetViewId == currentActiveViewId;

				/**
				 * 如果目标视图仍然是当前视图，则不能更改地址栏中的选项内容
				 * 如果最终视图和地址栏中的视图不是一个视图，则不能再将选项传递给最终视图
				 */
				options = isTargetViewRemainsCurrent? (View.currentState? View.currentState.options: null): (isTargetViewAsSpecified? viewInfo.options: null);

				/* history堆栈更新 */
				replaceViewState(targetViewId, null, options);

				/* 视图切换 */
				View.show(targetView.getId(), {type: type, options: options});
			}
		}else if(ViewState.isConstructorOf(e.state)){
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
				type = popedNewState.sn < View.currentState.sn? View.SWITCHTYPE_HISTORYBACK: View.SWITCHTYPE_HISTORYFORWARD;

			/* history堆栈更新 */
			replaceViewState(targetViewId, popedNewState.sn, options);

			/* 视图切换 */
			View.show(targetView.getId(), {type: type, options: options});
		}else{
			globalLogger.info("Skip state: {}", e.state);
		}
	};


	var init = function(){
		markViewToBeInited();
		
		/* 标记识别的操作系统 */
		docEle.setAttribute(attr$view_os, util.env.isIOS? "ios": (util.env.isAndroid? "android": (util.env.isWindowsPhone? "wp": "unknown")));

		/* 事件监听 */
		window.addEventListener(historyPushPopSupported? "popstate": "hashchange", stateChangeListener);

		/* 识别视图容器。如果没有元素声明为视图容器，则认定body为视图容器 */
		;(function(){
			var objs = document.querySelectorAll("[" + attr$view_container + "]");
			if(0 == objs.length){
				document.body.setAttribute(attr$view_container, "");
			}else
				for(var i = 1; i < objs.length; i++)
					objs[i].removeAttribute(attr$view_container);
		})();

		/* 扫描文档，遍历定义视图 */
		var viewObjs = getViewObjs();
		[].forEach.call(viewObjs, function(viewObj){
			/* 定义视图 */
			View.ofId(viewObj.id);

			/* 去除可能存在的激活状态 */
			viewObj.classList.remove("active");

			/* 添加样式类 */
			viewObj.classList.add("view");

			/* 视图标题自动设置 */
			;(function(){
				var view = View.ofId(viewObj.id);
				view.on("enter", function(){
					var specifiedTitle = viewObj.getAttribute(attr$view_title);
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
				if("true" == viewObjs[i].getAttribute(attr$view_default)){
					dftViewObjIndex = i;
					break;
				}

			if(-1 != dftViewObjIndex){
				dftViewObj = viewObjs[dftViewObjIndex];

				/* 删除多余的声明 */
				for(var i = dftViewObjIndex + 1; i < viewObjs.length; i++)
					if("true" == viewObjs[i].getAttribute(attr$view_default))
						viewObjs[i].removeAttribute(attr$view_default);
			}else if(0 != viewObjs.length){
				dftViewObj = viewObjs[0];
				dftViewObj.setAttribute(attr$view_default, "true");
			}else
				globalLogger.warn("No view exists to determine the default view.");

			return dftViewObj;
		};

		/* 确定默认视图，并添加激活标识 */
		dftViewObj = determineDefaultView();
		if(null != dftViewObj)
			dftViewObj.classList.add("active");

		/**
		 * 指令：data-view-rel配置视图导向
		 * 		取值：[view-id] 目标视图ID
		 * 		取值：:back 回退至上一个视图
		 * 		取值：:forward 前进至下一个视图
		 * 		取值：:default-view 导向至默认视图
		 * 		取值：~groupName 导向至目标群组的第一个视图
		 *
		 * 指令：data-view-rel-type 配置视图更新方式
		 * 		取值：nav（默认） 使用history.pushState以“导向”的方式切换至新视图。采用此方式时，切换多少次视图，就需要返回多少次才能回到初始界面
		 * 		取值：change 使用history.replaceState以“更新”的方式切换至新视图。采用此方式时，无论切换多少次视图，仅需1次就能回到初始界面
		 *
		 * 指令：data-view-rel-disabled 配置导向开关
		 * 		取值：true 触摸时不导向至通过data-view-rel指定的视图
		 */
		;(function(){
			touch.addTapListener(docEle, function(e){
				var eventTarget = e.changedTouches? e.changedTouches[0].target: e.target;

				/* 视图导向定义检测 */
				var targetViewId;
				var tmp = eventTarget;
				while(null == tmp.getAttribute(attr$view_rel)){
					tmp = tmp.parentNode;

					if(!(tmp instanceof HTMLElement))
						tmp = null;
					if(null == tmp)
						break;
				}
				if(null != tmp)
					targetViewId = tmp.getAttribute(attr$view_rel);

				if(null == targetViewId || "" == targetViewId.trim())
					return;

				/* 视图切换禁用标志检测 */
				var isViewRelDisabled = "true" == tmp.getAttribute(attr$view_rel_disabled);

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
					if("" == path){
						globalLogger.warn("Empty file path for data-view-rel: '{}'", targetViewId);
						return;
					}

					window.location.href = path;
					return;
				}

				/* 回退操作(":back") */
				if(util.ifStringEqualsIgnoreCase(PSVIEW_BACK, targetViewId)){
					history.go(-1);/* browser support */
					return;
				}

				/* 前进操作（":forward"） */
				if(util.ifStringEqualsIgnoreCase(PSVIEW_FORWARD, targetViewId)){
					history.go(1);/* browser support */
					return;
				}
				
				/* 默认视图（":default-view"） */
				if(util.ifStringEqualsIgnoreCase(PSVIEW_DEFAULT, targetViewId)){
					var defaultView = View.getDefaultView();
					targetViewId = null == defaultView? null: defaultView.getId();
				}
				
				/* 群组视图（"~[groupName]"） */
				var options = null;
				if(/^~/.test(targetViewId)){
					var r = /^~([^!]+)(?:!+(.*))?/;
					var m = targetViewId.match(r);
					if(null == m)
						return;

					var groupName = m[1].trim(), _options = parseParams(m[2]);
					var firstViewId = findFirstViewIdOfGroupName(groupName);
					if(null == firstViewId)
						return;

					targetViewId = firstViewId;
					options = _options;
				}else{
					var rst = parseViewInfoFromHash("#" + targetViewId);

					targetViewId = rst.viewId;
					options = rst.options;
				}

				/* 目标视图是当前视图 */
				var activeView = View.getActiveView();
				var activeViewId = null == activeView? null: activeView.getId();

				var relType = tmp.getAttribute(attr$view_rel_type);
				relType = util.isEmptyString(relType, true)? "nav": relType;
				if(!/^(?:nav)|(?:change)$/.test(relType)){
					globalLogger.warn("Unknown view switch type: {}. {}", relType, tmp);
					relType = "nav";
				}

				/* 呈现ID指定的视图 */
				View[relType + "To"](targetViewId, {options: options});
			}, {useCapture: true});
		})();

		/* 使能属性：data-view-whr */
		;(function(){
			var whr = document.documentElement.getAttribute(attr$view_whr);
			if(null == whr || (whr = whr.trim().toLowerCase()) === "")
				return;

			var r = /(\d+(?:\.\d*)?)\s*\/\s*(\d+(?:\.\d*)?)/i;
			var tmp = whr.match(r);
			if(null == tmp){
				globalLogger.warn("Invalid view expected width height ratio: {}. Value such as '320/568'(iPhone 5) is valid. Using '{}' instead.", whr, defaultWidthHeightRatio);
				tmp = defaultWidthHeightRatio.exec(r);
			}else
				globalLogger.info("Using specified expected width height ratio: {}", whr);

			layout.setExpectedWidthHeightRatio(Number(tmp[1])/Number(tmp[2])).init();
			var doLayout = function(){
				/* 移除可能会影响布局的虚拟键盘 */
				var inputObjs = document.querySelectorAll("input, select, textarea, *[contentEditable]");
				for(var i = 0; i < inputObjs.length; i++)
					inputObjs[i].blur();
				layout.doLayout();
			};
			doLayout();
		})();

		globalLogger.info("Marking View as initialized and ready");
		
		/* 标记视图已完成初始化 */
		markViewInited();

		/* 标记视图就绪 */
		markViewReady();

		/* 呈现指定视图 */
		;(function(){
			/* 如果要呈现的视图，是View.ready方法执行后通过API跳转过来的，则不再重复处理 */
			if(null != View.currentState){
				globalLogger.debug("Skip showing specified view.");
				return;
			}

			var defaultViewId = null == dftViewObj? null: dftViewObj.id;

			var viewInfo = parseViewInfoFromHash(location.hash);
			var specifiedViewId = null == viewInfo? null: viewInfo.viewId,
				options = null == viewInfo? null: viewInfo.options;

			var targetViewId = null;
			var isDefaultViewIdEmpty = util.isEmptyString(defaultViewId, true),
				isSpecifiedViewIdEmpty = util.isEmptyString(specifiedViewId, true);
			if(!isSpecifiedViewIdEmpty && View.ifExists(specifiedViewId))
				targetViewId = specifiedViewId;
			else{
				globalLogger.warn("No view of id: {}(specified in the location hash) found, trying to show the default view", specifiedViewId);

				if(!isDefaultViewIdEmpty && View.ifExists(defaultViewId))
					targetViewId = defaultViewId;
				else{
					globalLogger.warn("No default view(id: {}) found.", defaultViewId);

					targetViewId = null;
				}
			}

			var isTargetViewIdEmpty = util.isEmptyString(targetViewId, true);
			if(isTargetViewIdEmpty){
				globalLogger.warn("Can not determine the initial view!");
				return;
			}

			var targetView = getFinalView(targetViewId);
			if(null == targetView){
				globalLogger.error("No final view found for view of id: {}", targetViewId);
				return;
			}

			targetViewId = targetView.getId();
			var ifViewRemainsTheSame = targetViewId == specifiedViewId;
			/* 如果最终视图和地址栏中的视图不是一个视图，则不能再将选项传递给最终视图 */
			if(!ifViewRemainsTheSame)
				options = null;

			globalLogger.info("Showing view: {}", targetViewId);

			replaceViewState(targetViewId, null, options);
			var currentActiveView = View.getActiveView();
			switchView({
				srcView: currentActiveView == targetView? null: currentActiveView,
				targetView: targetView,
				withAnimation: false,
				params: null
			});
		})();
	};

	/**
	 * 添加“视图将要初始化”监听器
	 * @param {Function} callback 回调方法
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
		 */
		return function(callback){
			/* 如果已经初始化，则不再执行，立即返回 */
			if(isViewInited)
				return View;

			if(callbacks.indexOf(callback) != -1)
				return View;

			callbacks.push(callback);
			return View;
		};
	})();

	/**
	 * 添加“视图就绪”监听器
	 * @param {Function} callback 回调方法
	 */
	View.ready = (function(){
		/* 挂起的回调方法列表 */
		var callbacks = [];
		markViewReady = function(){
			isViewReady = true;

			for(var i = 0; i < callbacks.length; i++)
				util.try2Call(callbacks[i]);
			callbacks = [];
		};

		/**
		 * 就绪后执行的方法
		 */
		return function(callback){
			/* 如果已经就绪，则立即执行 */
			if(isViewReady){
				util.try2Call(callback);
				return View;
			}

			if(callbacks.indexOf(callback) != -1)
				return View;

			callbacks.push(callback);
			return View;
		};
	})();

	/**
	 * 设置视图初始化器
	 * @param {Function} initializer 初始化器
	 * @param {Function} initializer#init 执行初始化
	 * @param {StringEnum} [execTime=domready] 初始化器的自动执行时机。domready：DOM就绪后执行；rightnow：立即执行。默认为：domready
	 */
	View.setInitializer = function(initializer, execTime){
		if(typeof initializer != "function")
			return;

		var dftExecTime = "domready";
		if(arguments.length < 2)
			execTime = dftExecTime;
		var supportedExecTimes = "domready, rightnow".split(/\s*,\s*/);
		if(supportedExecTimes.indexOf(execTime) == -1){
			globalLogger.warn("Unknown initializer exec time: {}. Supported: {}", execTime, supportedExecTimes);
			execTime = dftExecTime;
		}

		viewInitializer = initializer;
		viewInitializerExecTime = execTime;

		if(!isViewInited && "rightnow" == execTime){
			globalLogger.info("Calling specified view initializer right now");
			initializer(init);
		}
	};

	document.addEventListener("DOMContentLoaded", function(){
		if(null == viewInitializer){
			globalLogger.info("Initializing View automatically");
			init();
		}else if("domready" == viewInitializerExecTime){
			globalLogger.info("Calling specified view initializer on dom ready");
			viewInitializer(init);
		}
	});

	ctx[name] = View;
})(window, "View");