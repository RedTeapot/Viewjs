;(function(ctx, name){
	var util = ctx[name].util,
		eventDrive = ctx[name].eventDrive,
		Logger = ctx[name].Logger;

	var ViewConfigurationSet = ctx[name].ViewConfigurationSet,
		ViewContext = ctx[name].ViewContext,
		ViewLayout = ctx[name].ViewLayout,
		ViewWantedData = ctx[name].ViewWantedData,

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
		var domElements = document.querySelectorAll("#" + id + "[" + viewAttribute.attr$view + "=true]");
		if(0 === domElements.length || (function(){
			for(var i = 0; i < domElements.length; i++){
				var ele = domElements[i];

				var nspc = ele.getAttribute(viewAttribute.attr$view_namespace);
				if(util.isEmptyString(nspc, true))
					nspc = viewInternalVariable.defaultNamespace;

				if(nspc === namespace){
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

		/** 被其它地方期待提供的数据 */
		var wantedData = new ViewWantedData(id, namespace);

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
		 * 获取视图的群组名称（不区分大小写）。
		 * @returns {String} 小写的群组名称
		 */
		this.getGroupName = function(){
			var name = this.getDomElement().getAttribute(viewAttribute.attr$view_group);
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

			var params = viewParameter.getParameters(this.getId(), this.getNamespace());
			return null == params? false: (name in params);
		};

		/**
		 * 获取视图参数中指定名称的参数取值
		 * @param {String} [name] 参数名。区分大小写。如果没有指定参数名，则返回整个参数。
		 */
		this.getParameter = function(name){
			var params = viewParameter.getParameters(this.getId(), this.getNamespace());
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
			return viewInternalVariable.readyViews.indexOf(this.getId()) !== -1;
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
			return /true/i.test(this.getDomElement().getAttribute(viewAttribute.attr$view_default));
		};

		/**
		 * 判断当前视图是否可以通过地址栏手动直接访问
		 */
		this.isDirectlyAccessible = function(){
			var attr = this.getDomElement().getAttribute(viewAttribute.attr$view_directly_accessible);
			attr = null == attr? null: attr.toLowerCase();

			if(View.isDirectlyAccessible())/** 如果设定默认可以直接访问 */
				return "false" === attr? false: true;
			else
				return "true" === attr? true: false;
		};

		/**
		 * 设置当前视图是否通过地址栏手动直接访问
		 * @param {Boolean} isDirectlyAccessible 视图是否通过地址栏手动直接访问
		 */
		this.setAsDirectlyAccessible = function(isDirectlyAccessible){
			if(arguments.lengt < 1)
				isDirectlyAccessible = true;

			this.getDomElement().setAttribute(viewAttribute.attr$view_directly_accessible, String(isDirectlyAccessible));
			return this;
		};

		/**
		 * 设置视图标题
		 * @param {String} title 标题。如果为null，则移除对应的DOM属性，改用网页的默认标题
		 */
		this.setTitle = function(title){
			if(null == title){
				this.getDomElement().removeAttribute(viewAttribute.attr$view_title);
				return this;
			}

			title = String(title);
			this.getDomElement().setAttribute(viewAttribute.attr$view_title, title);
			if(this.isActive())
				document.title = title;

			return this;
		};

		/**
		 * 获取视图标题
		 */
		this.getTitle = function(title){
			return this.getDomElement().getAttribute(viewAttribute.attr$view_title);
		};

		/**
		 * 设置回退视图
		 * @param {String} fallbackViewId 回退视图ID，或伪视图：":default-view"，或视图群组
		 */
		this.setFallbackViewId = function(fallbackViewId){
			if(util.isEmptyString(fallbackViewId, true))
				return this;

			/* 默认视图（":default-view"） */
			if(util.ifStringEqualsIgnoreCase(viewRepresentation.PSVIEW_DEFAULT, fallbackViewId)){
				var defaultView = View.getDefaultView();
				if(null == defaultView){
					globalLogger.error("No default view found.");
					return this;
				}else
					fallbackViewId = defaultView.getId();
			}else if(/^~/.test(fallbackViewId)){/* 群组视图（"~[groupName]"） */
				var groupName = fallbackViewId.substring(1);
				var firstViewId = viewInternalVariable.findFirstViewIdOfGroupName(groupName);
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
			if(this.getId() === fallbackViewId)
				return this;

			this.getDomElement().setAttribute(viewAttribute.attr$view_fallback, fallbackViewId);
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
				var fallbackViewId = view.getDomElement().getAttribute(viewAttribute.attr$view_fallback);

				/* 默认视图（":default-view"） */
				if(util.ifStringEqualsIgnoreCase(viewRepresentation.PSVIEW_DEFAULT, fallbackViewId)){
					return View.getDefaultView();
				}

				/* 群组视图（"~[groupName]"） */
				if(/^~/.test(fallbackViewId)){
					var groupName = fallbackViewId.substring(1);
					var firstViewId = viewInternalVariable.findFirstViewIdOfGroupName(groupName);
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

					if(idChain.indexOf(view.getId()) !== -1){/** 循环引用 */
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

	ctx[name].ViewConstructor = View;
})(window, "View");