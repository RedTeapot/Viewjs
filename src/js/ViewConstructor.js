View(function(toolbox){
	var util = toolbox.get("util"),
		eventDrive = toolbox.get("eventDrive"),
		ViewState = toolbox.get("ViewState"),
		Logger = toolbox.get("Logger");

	var ViewConfigurationSet = toolbox.get("ViewConfigurationSet"),
		ViewContext = toolbox.get("ViewContext"),
		ViewLayout = toolbox.get("ViewLayout"),

		viewRepresentation = toolbox.get("viewRepresentation"),
		viewParameter = toolbox.get("viewParameter"),
		viewAttribute = toolbox.get("viewAttribute"),
		viewInternalVariable = toolbox.get("viewInternalVariable");

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

		/** 是否自动保存参数至上下文 */
		var ifAutoSaveParamsToContext = true;

		/** 视图渲染所需要数据的获取方法（由视图自行定义） */
		var dataFetchAction = null;

		/** 添加的定时器列表 */
		var timers = [];


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
				return params || null;

			return null == params? null: params[name];
		};

		/**
		 * 搜索指定名称的参数取值。搜索顺序：
		 * 1. 视图参数
		 * 2. 视图选项
		 * 3. 地址栏参数
		 * 4. 视图上下文
		 *
		 * 注：区分大小写
		 *
		 * @param {String} name 参数名
		 * @param {Boolean} [ifRetrieveFromContext=true] 是否从上下文中检索参数（仅当自动保存视图参数至视图上下文时有效）
		 * @returns {*}
		 */
		this.seekParameter = function(name, ifRetrieveFromContext){
			if(this.hasParameter(name))
				return this.getParameter(name);

			if(View.hasActiveViewOption(name))
				return View.getActiveViewOption(name);

			var r = new RegExp("\\b" + name + "\\b=([^&\\?]*)");
			var paramValue = location.search.match(r);
			if(null != paramValue)
				return decodeURIComponent(paramValue[1]);

			if(arguments.length < 2)
				ifRetrieveFromContext = true;
			if(!ifRetrieveFromContext || !ifAutoSaveParamsToContext)
				return null;

			var keyForParamsAutoSavedToContext = viewParameter.keyForParamsAutoSavedToContext,
				_params = null;
			if(
				context.has(keyForParamsAutoSavedToContext)
				&& null != (_params = context.get(keyForParamsAutoSavedToContext))
				&& typeof _params === "object"
			){
				if(name in _params)
					return _params[name];

				return null;
			}

			return null;
		};

		/**
		 * 设置是否自动保存视图参数至视图上下文
		 * @param {Boolean} [autoSave=true] 是否自动保存视图参数至视图上下文
		 * @returns {View}
		 */
		this.setIfAutoSaveParamsToContext = function(autoSave){
			if(arguments.length < 1)
				autoSave = true;

			ifAutoSaveParamsToContext = !!autoSave;
			return this;
		};

		/**
		 * 判断该视图是否自动保存视图参数至视图上下文
		 * @returns {Boolean}
		 */
		this.getIfAutoSaveParamsToContext = function(){
			return ifAutoSaveParamsToContext;
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

		/**
		 * 设置视图渲染所需要数据的获取方法
		 * @param {Function} action 获取方法
		 * @returns {View}
		 */
		this.setDataFetchAction = function(action){
			if(typeof action === "function")
				dataFetchAction = action;
			else
				globalLogger.warn("Invalid argument. Type of 'Function' is required");

			return this;
		};

		/**
		 * 获取设置的视图渲染所需要数据的获取方法
		 * @returns {null|Function}
		 */
		this.getDataFetchAction = function(){
			return dataFetchAction;
		};

		/**
		 * 加载视图渲染所需要的数据
		 * @returns {Promise|ViewThenable}
		 */
		this.fetchData = function(){
			var isPromiseSupported = util.isPromiseSupported() && false;

			if(typeof dataFetchAction !== "function"){
				return isPromiseSupported? Promise.resolve(undefined): {
					then: function(onFulfilled, onRejected){
						util.try2Call(onFulfilled, null, undefined);
					}
				}
			}

			if(isPromiseSupported)
				return Promise(function(resolve, reject){
					util.try2Call(dataFetchAction, null, resolve, reject);
				});
			else{
				var thenable = {
					then: function(onFulfilled, onRejected){
						var resolve = function(data){
							util.try2Call(onFulfilled, null, data);
						};
						var reject = function(reason){
							util.try2Call(onRejected, null, reason);
						};

						util.try2Call(dataFetchAction, null, resolve, reject);
					}
				};

				return thenable;
			}
		};

		/**
		 * 添加周期性执行定时器
		 * @param {String} [timerName] 定时器名称，不区分大小写
		 * @param {Function} timerHandle 定时器要执行的动作
		 * @param {Number} interval 定时器周期性工作间隔。单位：毫秒
		 * @returns {View}
		 */
		this.addTimer = function(timerName, timerHandle, interval){
			if(typeof timerName === "function"){
				interval = timerHandle;
				timerHandle = timerName;
				timerName = util.randomString("timer");
			}

			if(util.isEmptyString(timerName, true))
				throw new Error("Invalid argument. Timer name should not be empty");

			var _timerName = String(timerName).trim().toLowerCase();
			for(var i = 0; i < timers.length; i++)
				if(timers[i].name === _timerName)
					throw new Error("Timer of name: '" + timerName + "' exists already");

			if(typeof timerHandle !== "function")
				throw new Error("Invalid argument. Timer handle should be of type: 'Function'");

			var _interval = Math.round(Number(interval));
			if(isNaN(_interval) || _interval < 1)
				throw new Error("Invalid arguemnt. Timer interval should be of type: 'Number' and be greater than 0");

			var obj = {
				name: _timerName,
				handle: timerHandle,
				interval: interval,
				timer: null
			};
			timers.push(obj);

			if(this.isActive()){
				util.try2Call(timerHandle);
				obj.timer = setInterval(function(){util.try2Call(timerHandle);}, interval);
			}

			return this;
		};

		/**
		 * 启动定时器
		 * @param {String} timerName 定时器名称
		 * @returns {boolean} true: 启动成功；false：启动失败（定时器不存在，或已经启动）
		 */
		this.startTimer = function(timerName){
			if(util.isEmptyString(timerName, true))
				return false;

			timerName = String(timerName).trim().toLowerCase();

			for(var i = 0; i < timers.length; i++){
				var obj = timers[i];

				if(obj.name === timerName){
					if(null !== obj.timer)
						return false;

					util.try2Call(obj.handle);
					obj.timer = setInterval((function(timerHandle){
						return function(){util.try2Call(timerHandle);}
					})(obj.handle), obj.interval);
					return true;
				}
			}

			return false;
		};

		/**
		 * 启动所有定时器
		 * @returns {View}
		 */
		this.startAllTimers = function(){
			for(var i = 0; i < timers.length; i++){
				var obj = timers[i];

				if(null !== obj.timer)
					continue;

				util.try2Call(obj.handle);
				obj.timer = setInterval((function(timerHandle){
					return function(){util.try2Call(timerHandle);}
				})(obj.handle), obj.interval);
				obj.timer = null;
			}

			return this;
		};

		/**
		 * 终止定时器
		 * @param {String} timerName 定时器名称
		 * @returns {boolean} true: 终止成功；false：终止失败（定时器不存在，或已经终止）
		 */
		this.stopTimer = function(timerName){
			if(util.isEmptyString(timerName, true))
				return false;

			timerName = String(timerName).trim().toLowerCase();

			for(var i = 0; i < timers.length; i++){
				var obj = timers[i];

				if(obj.name === timerName){
					if(null === obj.timer)
						return false;

					clearInterval(obj.timer);
					obj.timer = null;
					return true;
				}
			}

			return false;
		};

		/**
		 * 终止所有定时器
		 * @returns {View}
		 */
		this.stopAllTimers = function(){
			for(var i = 0; i < timers.length; i++){
				var obj = timers[i];

				clearInterval(obj.timer);
				obj.timer = null;
			}

			return this;
		};


		/* 定时器的自动开始 */
		this.on("enter", function(){
			for(var i = 0; i < timers.length; i++){
				var obj = timers[i];

				util.try2Call(obj.handle);
				obj.timer = setInterval((function(timerHandle){
					return function(){util.try2Call(timerHandle);}
				})(obj.handle), obj.interval);
			}
		});

		/* 定时器的自动结束 */
		this.on("leave", function(){
			for(var i = 0; i < timers.length; i++){
				var obj = timers[i];

				clearInterval(obj.timer);
				obj.timer = null;
			}
		});
	};

	toolbox.set("ViewConstructor", View);
})