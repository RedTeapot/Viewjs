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
View(function(toolbox){
	var util = toolbox.get("util"),
		eventDrive = toolbox.get("eventDrive"),
		Logger = toolbox.get("Logger"),
		touch = toolbox.get("touch"),
		layout = toolbox.get("layout");

	var View = toolbox.get("ViewConstructor"),
		ViewContext = toolbox.get("ViewContext"),
		ViewState = toolbox.get("ViewState"),
		OperationState = toolbox.get("OperationState"),
		ViewLayout = toolbox.get("ViewLayout"),
		ChainedHandle = toolbox.get("ChainedHandle"),

		viewRepresentation = toolbox.get("viewRepresentation"),
		viewParameter = toolbox.get("viewParameter"),
		viewAttribute = toolbox.get("viewAttribute"),
		viewInternalVariable = toolbox.get("viewInternalVariable");

	var globalLogger = Logger.globalLogger;

	/**
	 * @callback ViewSwitchInterceptor 视图切换拦截器
	 * @param {ViewSwitchMeta} meta 视图切换信息
	 * @returns {Boolean} true - 继续执行后续拦截器或跳转动作；false - 终止后续拦截器或跳转动作的执行
	 */

	/**
	 * @callback ViewDataFetchAction 视图渲染所需数据的获取方法
	 * @param {Function} resolve 数据获取成功后要执行的方法
	 * @param {Function} reject 数据获取失败时要执行的方法
	 */

	/**
	 * @callback ViewResolver_resolve 视图解析器 - 解析成功时要执行的方法
	 * @param {View} 视图实例
	 */

	/**
	 * @callback ViewResolver_reject 视图解析器 - 解析失败时要执行的方法
	 * @param {*} 失败描述
	 */

	/**
	 * @callback ViewResolver 视图解析器
	 * @param {String} viewId 视图ID
	 * @param {String} viewNamespace 视图命名空间
	 * @param {ViewResolver_resolve} resolve 通知 View.js 解析成功的回调方法
	 * @param {ViewResolver_reject} reject 通知 View.js 解析失败的回调方法
	 */

	/**
	 * @callback ViewFileLocator 视图单文件定位器
	 * @param {String} viewId 视图ID
	 * @param {String} viewNamespace 视图命名空间
	 * @returns {String} 视图单文件位置
	 */

	var
		/**
		 * 在“没有视图可以继续向前返回”的情况下，尝试返回时要执行的动作
		 * @type {Function|null}
		 */
		noViewToNavBackAction = null,

		/**
		 * 尝试进行视图切换时要执行的拦截器列表
		 * @type {ViewSwitchInterceptor[]}
		 */
		viewSwitchInterceptors = [],

		/**
		 * 捕获到的文档标题，用于在视图离开时恢复显示文档的初始标题
		 * @type {String}
		 */
		documentTitle = document.title,

		/**
		 * 视图解析器
		 * @type {Function|null}
		 */
	    viewResolver = null,

		/**
		 * 默认的视图解析器
		 * @type {ViewResolver}
		 */
	    defaultViewResolver = function(viewId, viewNamespace, resolve, reject){
	    	try{
	    		resolve(View.ofId(viewId, viewNamespace));
		    }catch(e){
	    		reject(e);
		    }
	    };

	var

		/**
		 * 完成初始化了的视图列表
		 * @type {View[]}
		 */
		initedViews = [],

		/**
		 * 视图是否已经被初始化
		 * @type {boolean}
		 */
		isViewInitialized = false,

		/**
		 * 初始化之前要执行的回调方法列表
		 * @type {Function[]}
		 */
		beforeViewInitListeners = [],

		/**
		 * 标记视图准备初始化
		 * @type {Function}
		 */
		markViewToBeInitialized = function(){
			for(var i = 0; i < beforeViewInitListeners.length; i++)
				util.try2Call(beforeViewInitListeners[i]);
			beforeViewInitListeners = [];
		},

		/**
		 * 标记视图已完成初始化
		 * @type {Function}
		 */
		markViewInitialized = function(){
			isViewInitialized = true;
		};

	var
		/**
		 * 视图是否已经就绪
		 * @type {boolean}
		 */
		isViewReady = false,

		/**
		 * 就绪后要执行的回调方法列表
		 * @type {Function[]}
		 */
		viewReadyListeners = [],

		/**
		 * 标记视图就绪
		 * @type {Function}
		 */
		markViewReady = function(){
			isViewReady = true;

			for(var i = 0; i < viewReadyListeners.length; i++)
				util.try2Call(viewReadyListeners[i]);
			viewReadyListeners = [];

			View.getViewContainerDomElement().setAttribute(viewAttribute.attr$view_state, "ready");
		},

		/**
		 * 视图初始化器
		 * @type {Function|null}
		 */
		viewInitializer,

		/**
		 * 视图初始化器不为空时，其自动执行时机。domready：DOM就绪后执行；rightnow：view.js被加载后立即执行。默认为：domready
		 * @type {String}
		 */
		viewInitializerExecTime;


	/**
	 * 启用事件驱动机制
	 * 事件 beforechange：视图切换前触发
	 * 事件 afterchange：视图切换后触发
	 */
	eventDrive(View);

	/** 视图切换操作类型：由浏览器前进操作触发 */
	View.SWITCHTYPE_HISTORYFORWARD = "history.forward";
	/** 视图切换操作类型：由浏览器后退操作触发 */
	View.SWITCHTYPE_HISTORYBACK = "history.back";
	/** 视图切换操作类型：由视图切换：View.navTo操作触发 */
	View.SWITCHTYPE_VIEWNAV = "view.nav";
	/** 视图切换操作类型：由视图切换：View.changeTo操作触发 */
	View.SWITCHTYPE_VIEWCHANGE = "view.change";

	/** 视图切换触发器：应用程序 */
	View.SWITCHTRIGGER_APP = "app";
	/** 视图切换触发器：浏览器 */
	View.SWITCHTRIGGER_NAVIGATOR = "navigator";


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
	 * 添加视图跳转拦截器
	 * @param {ViewSwitchInterceptor} interceptor 拦截器
	 * @returns {View}
	 */
	View.addSwitchInterceptor = function(interceptor){
		if(typeof interceptor !== "function")
			throw new Error("Invalid argument, type of 'Function' is required");

		if(viewSwitchInterceptors.indexOf(interceptor) === -1)
			viewSwitchInterceptors.push(interceptor);

		return View;
	};

	/**
	 * 获取已添加的视图跳转拦截器
	 * @returns {ViewSwitchInterceptor[]}
	 */
	View.getSwitchInterceptors = function(){
		return viewSwitchInterceptors.concat();
	};

	/**
	 * 设置视图实例解析器
	 * @param {ViewResolver} resolver 解析器
	 * @returns {View}
	 */
	View.setResolver = function(resolver){
		if(typeof resolver !== "function")
			throw new Error("Invalid argument, typeof 'Function' is required");

		viewResolver = resolver;
		return View;
	};

	/**
	 * 获取设置的视图实例解析器
	 * @returns {ViewResolver} 解析器
	 */
	View.getResolver = function(){
		return viewResolver;
	};

	/**
	 * 解析给定ID对应的视图，并在解析成功/失败时执行对应的回调方法
	 * @param {String} viewId 要解析的目标视图ID
	 * @param {Function|String} [viewNamespaceOrOnresolve] 要解析的目标视图命名空间 或 视图解析成功后要执行的回调方法
	 * @param {ViewResolver_resolve} onresolve 视图解析成功后要执行的回调方法
	 * @param {ViewResolver_reject} onreject 视图解析成功后要执行的回调方法
	 * @returns {View}
	 */
	View.resolve = function(viewId, viewNamespaceOrOnresolve, onresolve, onreject){
		var viewNamespace = viewNamespaceOrOnresolve;
		if(typeof viewNamespaceOrOnresolve === "function"){/* resolve(viewId, onresolve, onreject) */
			onreject = onresolve;
			onresolve = viewNamespaceOrOnresolve;
			viewNamespace = viewNamespaceOrOnresolve = viewInternalVariable.defaultNamespace;
		}

		var resolver = viewResolver || defaultViewResolver;
		resolver(viewId, viewNamespace,function(view){
			if(typeof onresolve === "function")
				onresolve(view);
		}, function(err){
			if(typeof onreject === "function")
				onreject(err);
		});

		return View;
	};

	/**
	 * 预置的视图解析器1
	 * @param {ViewFileLocator} viewFileLocator 视图单文件的定位器
	 * @returns {ViewResolver}
	 */
	View.newResolver1 = function(viewFileLocator){
		if(typeof viewFileLocator !== "function")
			viewFileLocator = function(viewId, viewNamespace){
				return "views/" + viewId + "@" + viewNamespace + ".view.html";
			};

		return function(viewId, viewNamespace, resolve, reject){
			try{
				resolve(View.ofId(viewId, viewNamespace));
				return;
			}catch(e){}

			var viewFileLocation = viewFileLocator(viewId, viewNamespace);
			var tmpObj = document.createElement("a");
			tmpObj.setAttribute("href", viewFileLocation);
			viewFileLocation = tmpObj.href;
			var viewFolderPath = util.getURLFolder(viewFileLocation);
			util.getFile(viewFileLocation, {
				onsuccess: function(responseText){
					var tmpObj = document.createElement("div");
					tmpObj.innerHTML = responseText;

					var markupObj = tmpObj.querySelector("view"),
						styleLinkObjObjs = tmpObj.querySelectorAll("link[rel=stylesheet]"),
						styleObjs = tmpObj.querySelectorAll("style"),
						scriptObjs = tmpObj.querySelectorAll("script");

					if(null == markupObj){
						reject("No template found in '" + viewFileLocation + "'");
						return;
					}

					if(markupObj.children.length === 0){
						reject("No view dom element defined within template in '" + viewFileLocation + "'");
						return;
					}

					/* template 下只能有一个元素，即为视图骨架对应的DOM元素 */
					if(markupObj.children.length > 1){
						reject("Template contains multiple root element in '" + viewFileLocation + "'");
						return;
					}

					/* 视图ID */
					var _viewId = viewInternalVariable.getPotentialViewId(markupObj.children[0]);
					if(null == _viewId || "" === _viewId){
						reject("No view id defined in '" + viewFileLocation + "'");
						return;
					}

					if(viewId !== _viewId)
						globalLogger.error("View id: '{}' defined in dom element is not the same as resolving view id: '{}' in '{}'", _viewId, viewId, viewFileLocation);

					/* 将视图DOM骨架追加到视图容器中 */
					var viewObj = markupObj.children[0];
					View.getViewContainerDomElement().appendChild(viewObj);

					/* 将样式追加至文档中 */
					for(var i = 0; i < styleLinkObjObjs.length; i++){
						var obj = document.createElement("link");
						obj.rel = "stylesheet";
						var href = styleLinkObjObjs[i].getAttribute("href");
						obj.href = /^(?:http|https|ftp):\/\//i.test(href)? href: (viewFolderPath + href);
						document.head.appendChild(obj);
					}
					for(var i = 0; i < styleObjs.length; i++)
						document.head.appendChild(styleObjs[i]);

					/* 初始化视图骨架 */
					initViewObj(viewObj);

					var runScripts = 0;
					var resolveViewIfAllTheScriptsHaveBeenRun = function(){
						if(runScripts === scriptObjs.length)
							resolve(View.ofId(viewId, viewNamespace));
					};

					/* 运行视图脚本 */
					resolveViewIfAllTheScriptsHaveBeenRun();
					for(var i = 0; i < scriptObjs.length; i++){
						var scriptObj = scriptObjs[i];
						var isInline = null == scriptObj.src || "" === scriptObj.src.trim();
						var inlineContent = scriptObj.innerHTML.trim();

						if(isInline){
							try{
								runScripts++, eval(inlineContent);
							}catch(e){
								globalLogger.error("Error occurred while executing view script in '{}'", viewFileLocation);
								console.error(e);
							}
						}else{
							/* .view 文件允许以相对路径的方式引用脚本 */
							var scriptSrc = scriptObj.getAttribute("src");
							scriptSrc = /^(?:http|https|ftp):\/\//i.test(scriptSrc)? scriptSrc: (viewFolderPath + scriptSrc);
							(function(scriptSrc){
								util.getFile(scriptSrc, {
									onsuccess: function(scriptContent){
										if("" !== scriptContent){
											try{
												eval(scriptContent);
											}catch(e){
												globalLogger.error("Error occurred while executing view script: '{}' load by '{}'", scriptSrc, viewFileLocation);
												console.error(e);
											}
										}

										runScripts++, resolveViewIfAllTheScriptsHaveBeenRun();
									},
									onerror: function(responseText, status){
										runScripts++, resolveViewIfAllTheScriptsHaveBeenRun();
										globalLogger.error("Fail to load script: {} from {}. Http status: {}, response: {}", scriptSrc, viewFileLocation, status, responseText);
									}
								});
							})(scriptSrc);
						}
					}
				},
				onerror: function(responseText, status){
					var error = "Fail to load " + viewFileLocation + ". Http status: " + status + ", response: " + responseText;
					reject(error);
				}
			});
		};
	};

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

		if(null == rootObj)
			return null;

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

		if(null == rootObj)
			return null;

		return rootObj.querySelectorAll(selector);
	};

	/**
	 * 查找给定ID对应的视图实例，如果不存在则创建，否则返回已经存在的实例
	 * @param {String} id 视图编号
	 * @param {String} [namespace=defaultNamespace] 视图隶属的命名空间
	 * @returns {View}
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
	 * @returns {Boolean}
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
	 * @returns {String[]}
	 */
	View.listAllGroups = function(){
		globalLogger.warn("This method is deprecated, please use 'View.listAllViewNames()' instead");
		return View.listAllViewNames();
	};

	/**
	 * 设置指定ID的视图为默认视图
	 * @param {String} viewId 视图ID
	 * @param {String} [namespace=defaultNamespace] 视图隶属的命名空间
	 * @returns {View}
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
	 * @returns {Boolean}
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
	 * @returns {View}
	 */
	View.setIsDirectlyAccessible = function(accessible){
		View.getViewContainerDomElement().setAttribute(viewAttribute.attr$view_directly_accessible, String(!!accessible).toLowerCase());
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
	 * @returns {View|null}
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
	 * @returns {View|null}
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
	 * @returns {View}
	 */
	View.setSwitchAnimation = function(animationFunction){
		if(!(animationFunction instanceof Function))
			throw new Error("Invalid argument, type of 'Function' is required");

		viewInternalVariable.viewSwitchAnimation = animationFunction;

		return View;
	};

	/**
	 * 获取设置的视图切换动画
	 * @returns {Function} 视图切换动画
	 */
	View.getSwitchAnimation = function(){
		return viewInternalVariable.viewSwitchAnimation;
	};

	/**
	 * 获取当前的活动视图的视图选项集合
	 * @returns {Object|null}
	 */
	View.getActiveViewOptions = function(){
		var viewInfo = viewRepresentation.parseViewInfoFromHash(location.hash);
		return null == viewInfo? null: viewInfo.options;
	};

	/**
	 * 判断当前的活动视图的视图选项中是否含有特定名称的选项。如果视图选项为空，或对应名称的选项不存在，则返回false
	 * @param {String} name 选项名称
	 * @returns {Boolean}
	 */
	View.hasActiveViewOption = function(name){
		var options = View.getActiveViewOptions();
		return null == options? false: (name in options);
	};

	/**
	 * 获取当前的活动视图的视图选项中特定名称的选项。如果视图选项为空，或对应名称的选项不存在，则返回null
	 * @param {String} name 选项名称
	 * @returns {String|null}
	 */
	View.getActiveViewOption = function(name){
		var options = View.getActiveViewOptions();
		return null == options? null: options[name];
	};

	/**
	 * 为当前的活动视图的视图选项中设置特定名称的选项
	 * @param {String} name 选项名称
	 * @param {String} value 选项取值
	 * @returns {View}
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

		ViewState.replaceViewState(activeView.id, activeView.namespace, View.currentState? View.currentState.sn: null, options);

		return View;
	};


	/**
	 * 略过视图，使得在不展现视图的前提下达到返回时可以返回到该视图上的目的
	 * @param {String} targetViewId 目标视图ID
	 * @param {String} [targetViewNamespace=defaultNamespace] 目标视图隶属的命名空间
	 * @param {String} [method=nav] 略过方式。nav：压入堆栈；change：替换栈顶
	 * @returns {View}
	 */
	var navByOrChangeBy = function(targetViewId, targetViewNamespace, method){
		if(arguments.length < 3)
			method = "nav";
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

		var m = "nav" === method? "pushViewState": "replaceViewState";
		ViewState[m](targetViewId, targetViewNamespace);
		return View;
	};


	/**
	 * 以“压入历史堆栈”的方式略过视图，使得在不展现视图的前提下达到返回时可以返回到该视图上的目的
	 * @param {String} targetViewId 目标视图ID
	 * @param {String} [targetViewNamespace=defaultNamespace] 目标视图隶属的命名空间
	 * @returns {View}
	 */
	View.navBy = function(targetViewId, targetViewNamespace, pushRatherThanReplace){
		navByOrChangeBy(targetViewId, targetViewNamespace, "nav");
		return View;
	};


	/**
	 * 以“压入历史堆栈”方式略过视图，使得在不展现视图的前提下达到返回时可以返回到该视图上的目的
	 * @param {String} targetViewId 目标视图ID
	 * @param {String} [targetViewNamespace=defaultNamespace] 目标视图隶属的命名空间
	 * @returns {View}
	 */
	View.passBy = function(targetViewId, targetViewNamespace, pushRatherThanReplace){
		globalLogger.warn("This method is deprecated, and it will be removed someday in the future, please use 'View.navBy()' instead");
		navByOrChangeBy(targetViewId, targetViewNamespace, "nav");
		return View;
	};


	/**
	 * 以“替换历史栈顶”的方式略过视图，使得在不展现视图的前提下达到返回时可以返回到该视图上的目的
	 * @param {String} targetViewId 目标视图ID
	 * @param {String} [targetViewNamespace=defaultNamespace] 目标视图隶属的命名空间
	 * @returns {View}
	 */
	View.changeBy = function(targetViewId, targetViewNamespace, pushRatherThanReplace){
		navByOrChangeBy(targetViewId, targetViewNamespace, "change");
		return View;
	};

	/**
	 * 获取指定名称的链式处理器。如果对应实例尚不存在，则自动创建一个
	 * @param {String} name 处理器名称
	 * @returns {ChainedHandle}
	 */
	View.getChainedHandleByName = function(name){
		globalLogger.warn("This method is deprecated, and it will be removed someday in the future");
		return ChainedHandle.ofName(name);
	};

	/**
	 * 以“压入历史堆栈”的方式切换视图
	 * @param {String|View} targetViewId 目标视图ID，或目标视图
	 * @param {String|Object} [targetViewNamespace=defaultNamespace] 目标视图隶属的命名空间
	 * @param {Object} ops 切换配置。详见viewInternalVariable.showView
	 * @param {Object} ops.options 视图选项
	 * @returns {View}
	 */
	View.navTo = function(targetViewId, targetViewNamespace, ops){
		if(targetViewId instanceof View){
			/**
			 * View.navTo(targetView)
			 * View.navTo(targetView, ops)
			 */
			ops = targetViewNamespace;
			targetViewNamespace = targetViewId.namespace;
			targetViewId = targetViewId.id;
		}else{
			/**
			 * View.navTo(targetViewId, ops);
			 * View.navTo(targetViewId, null, ops);
			 */
			if(arguments.length < 2 || typeof targetViewNamespace !== "string" || util.isEmptyString(targetViewNamespace, true)){
				ops = targetViewNamespace;
				targetViewNamespace = viewInternalVariable.defaultNamespace;
			}
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
		ops.onbeforeswitch = function(){
			ViewState.pushViewState(targetViewId, targetViewNamespace, null, null == ops? null: ops.options);
		};
		viewInternalVariable.intendedSwitchType = View.SWITCHTYPE_VIEWNAV;
		viewInternalVariable.showView(targetViewId, targetViewNamespace, ops);

		return View;
	};

	/**
	 * 以“替换当前堆栈”的方式切换视图
	 * @param {String} targetViewId 目标视图ID
	 * @param {String|Object} [targetViewNamespace=defaultNamespace] 视图隶属的命名空间
	 * @param {Object} ops 切换配置。详见switchView
	 * @param {Object} ops.options 视图选项
	 * @returns {View}
	 */
	View.changeTo = function(targetViewId, targetViewNamespace, ops){
		if(targetViewId instanceof View){
			/**
			 * View.changeTo(targetView)
			 * View.changeTo(targetView, ops)
			 */
			ops = targetViewNamespace;
			targetViewNamespace = targetViewId.namespace;
			targetViewId = targetViewId.id;
		}else{
			/**
			 * View.changeTo(targetViewId, ops);
			 * View.changeTo(targetViewId, null, ops);
			 */
			if(arguments.length < 2 || typeof targetViewNamespace !== "string" || util.isEmptyString(targetViewNamespace, true)){
				ops = targetViewNamespace;
				targetViewNamespace = viewInternalVariable.defaultNamespace;
			}
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
		ops.onbeforeswitch = function(){
			ViewState.replaceViewState(targetViewId, targetViewNamespace, null, null == ops? null: ops.options);
		};
		viewInternalVariable.intendedSwitchType = View.SWITCHTYPE_VIEWCHANGE;
		viewInternalVariable.showView(targetViewId, targetViewNamespace, ops);

		return View;
	};

	/**
	 * 设置在“没有视图可以继续向前返回”的情况下，尝试返回时要执行的动作
	 * @param {Function} action 要执行的动作
	 * @returns {View}
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
	 * @returns {View}
	 */
	View.back = function(ops){
		viewInternalVariable.intendedSwitchType = View.SWITCHTYPE_HISTORYBACK;

		/* 清除旧数据，并仅在指定了参数时才设置参数，防止污染其它回退操作 */
		viewParameter.clearViewParameters(viewRepresentation.PSVIEW_BACK, "");
		if(null != ops && "params" in ops)
			viewParameter.setViewParameters(viewRepresentation.PSVIEW_BACK, "", ops.params);

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
	 * @returns {View}
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

	/**
	 * 设置文档标题。开发者可以设定视图级别的标题，但如果特定视图没有自定义标题，将使用文档标题来呈现
	 * @param {String} title 文档标题
	 * @returns {View}
	 */
	View.setDocumentTitle = function(title){
		if(util.isEmptyString(title, true)){
			globalLogger.warn("Invalid document title: " + title);
			return View;
		}

		documentTitle = title;

		var activeView = View.getActiveView();
		if(null == activeView || util.isEmptyString(activeView.getTitle(), true))
			document.title = documentTitle;

		return View;
	};

	/**
	 * 添加一次性的浏览器回退事件监听。该监听可以通过浏览器前进和回退重新执行
	 * @param {Function} callback 回调方法
	 * @returns {View}
	 */
	View.onceHistoryBack = function(callback){
		globalLogger.warn("This method is deprecated, and it will be removed someday in the future");

		if(typeof callback !== "function")
			throw new Error("Invalid argument! Type of 'Function' is required");

		OperationState.pushState(util.randomString(), callback);
		return View;
	};

	/**
	 * 根据当前视图容器的样式重新执行所有视图的布局
	 * @returns {View}
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

	/**
	 * 添加“视图将要初始化”监听器
	 * @type {Function} listener 监听器
	 * @returns {View}
	 */
	View.beforeInit = function(listener){
		if(typeof listener !== "function"){
			globalLogger.warn("Type of 'Function' is required");
			return View;
		}

		/* 如果已经初始化，则不再执行，立即返回 */
		if(isViewInitialized){
			globalLogger.error("View.js is initialized already");
			return View;
		}

		if(beforeViewInitListeners.indexOf(listener) === -1)
			beforeViewInitListeners.push(listener);

		return View;
	};

	/**
	 * 添加“视图就绪”监听器
	 * @param {Function} listener 回调方法
	 * @returns {View}
	 */
	View.ready = function(listener){
		if(typeof listener !== "function"){
			globalLogger.warn("Type of 'Function' is required");
			return View;
		}

		/* 如果已经就绪，则立即执行 */
		if(isViewReady){
			util.try2Call(listener);
			return View;
		}

		if(viewReadyListeners.indexOf(listener) === -1)
			viewReadyListeners.push(listener);

		return View;
	};

	/**
	 * 初始化给定的视图骨架DOM元素
	 * @param {HTMLElement} viewObj 视图骨架DOM元素
	 */
	var initViewObj = function(viewObj){
		var namespace = viewObj.getAttribute(viewAttribute.attr$view_namespace);
		if(util.isEmptyString(namespace, true)){
			namespace = viewInternalVariable.defaultNamespace;
			viewObj.setAttribute(viewAttribute.attr$view_namespace, namespace);
		}


		var defaultView = View.getDefaultView();
		var viewId = viewInternalVariable.getPotentialViewId(viewObj);

		/* 定义视图 */
		var view = View.ofId(viewId, namespace);
		if(initedViews.indexOf(view) !== -1){
			globalLogger.warn("Multiple view of id: '{}' within namespace: '{}' exists", view.id, view.namespace);
			return;
		}
		initedViews.push(view);

		viewObj.setAttribute(viewAttribute.attr$view, "true");

		/* 去除可能存在的激活状态 */
		util.removeClass(viewObj, "active");

		/* 添加样式类 */
		util.addClass(viewObj, "view");

		/* 识别、设置默认视图 */
		if(view.isDefault()){
			if(view !== defaultView){/* 多个默认视图同时存在时，以最早出现的准 */
				viewObj.removeAttribute(viewAttribute.attr$view_default);
				globalLogger.warn("Default view exits already. View id: '{}', namespace: '{}'", defaultView.id, defaultView.namespace);
			}
		}

		/* 视图标题自动设置 */
		view.on("enter", function(){
			var specifiedTitle = viewObj.getAttribute(viewAttribute.attr$view_title);
			document.title = null == specifiedTitle? documentTitle: specifiedTitle;
		});
	};

	/**
	 * 设置视图初始化器
	 * @param {Function} initializer 初始化器
	 * @param {Function} initializer#init 执行初始化
	 * @param {String} [execTime=domready] 初始化器的自动执行时机。domready：DOM就绪后执行；rightnow：立即执行。默认为：domready
	 * @returns {View}
	 */
	View.setInitializer = function(initializer, execTime){
		if(typeof initializer !== "function")
			return View;

		globalLogger.warn("This method is deprecated, please use 'data-view-auto-init' attribute and 'View.init()' method instead");

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

		if(!isViewInitialized && "rightnow" === execTime){
			globalLogger.info("Calling specified view initializer right now");
			viewInitializer(init);
		}

		return View;
	};

	/**
	 * 响应地址栏的hash进行渲染操作
	 */
	var stateChangeListener =  function(e){
		var currentActiveView = View.getActiveView();
		var currentActiveViewId = null,
			currentActiveViewNamespace = null;
		if(null != currentActiveView){
			currentActiveViewId = currentActiveView.getId();
			currentActiveViewNamespace = currentActiveView.getNamespace();
		}

		globalLogger.log("{} Current: {}", util.env.isHistoryPushPopSupported? "State popped!": "Hash changed!", currentActiveView && currentActiveView.getId());
		globalLogger.log("↑ {}", util.env.isHistoryPushPopSupported? JSON.stringify(e.state): location.hash);


		var
			/**
			 * 捕获到的，要尝试呈现的视图的ID
			 */
			newViewId = null,
			/**
			 * 捕获到的，要尝试呈现的视图的命名空间
			 */
			newViewNamespace = null,


			/**
			 * 最终要展现的视图的ID
			 */
			targetViewId = null,
			/**
			 * 最终要展现的视图的命名空间
			 */
			targetViewNamespace = null,
			/**
			 * 最重要展现的视图实例
			 */
			targetView = null,

			/**
			 * 视图跳转方式
			 */
			switchType = View.SWITCHTYPE_VIEWNAV,

			/**
			 * 视图跳转时携带的视图选项集合
			 */
			switchOptions = null;


		/* 视图切换 */
		if(null == e.state){/* IE9 */
			switchType = View.SWITCHTYPE_VIEWNAV;

			var viewInfo = viewRepresentation.parseViewInfoFromHash(location.hash);
			if(null == viewInfo){
				targetViewId = currentActiveViewId;
				targetViewNamespace = currentActiveViewNamespace;
				targetView = currentActiveView;
			}else{
				newViewId = viewInfo.viewId;
				newViewNamespace = viewInfo.viewNamespace;

				targetViewId = newViewId;
				targetViewNamespace = newViewNamespace;
				if(View.ifExists(targetViewId, targetViewNamespace))
					targetView = View.ofId(targetViewId, targetViewNamespace);

				/**
				 * 这里不能校验视图是否可以直接访问，因为在 history 不支持 pushState 的浏览器上，
				 * 如果校验视图是否可以直接访问，则不可直接访问的视图将无法访问到
				 */
			}

			if(null != targetViewId && null != targetView){
				var isTargetViewAsSpecified = targetViewId === newViewId && targetViewNamespace === newViewNamespace,
					isTargetViewRemainsCurrent = targetViewId === currentActiveViewId && targetViewNamespace === currentActiveViewNamespace;

				/**
				 * 如果目标视图仍然是当前视图，则不能更改地址栏中的选项内容
				 * 如果最终视图和地址栏中的视图不是一个视图，则不能再将选项传递给最终视图
				 */
				switchOptions = isTargetViewRemainsCurrent? (View.currentState? View.currentState.options: null): (isTargetViewAsSpecified? viewInfo.options: null);

				/* 视图切换 */
				viewInternalVariable.showView(targetViewId, targetViewNamespace, {
					type: switchType,
					trigger: View.SWITCHTRIGGER_APP,/* 此时无法确定切换方式，固定为 View.SWITCHTRIGGER_APP */
					options: switchOptions,

					onbeforeswitch: function(){
						/* history 堆栈更新 */
						ViewState.replaceViewState(targetViewId, targetViewNamespace, null, switchOptions);
					}
				});
			}
		}else if(ViewState.isConstructorOf(e.state)){
			var poppedNewState = e.state;
			newViewId = poppedNewState.viewId;
			newViewNamespace = poppedNewState.viewNamespace;

			if(View.ifExists(newViewId, newViewNamespace)){
				targetView = View.ofId(newViewId, newViewNamespace);
				switchOptions = poppedNewState.options;
			}else{
				globalLogger.warn("Popped view: '" + newViewId + "' within namespace: '" + newViewNamespace + "' does not exist, keeping current");
				targetView = currentActiveView;

				/* 如果最终视图和地址栏中的视图不是一个视图，则不能再将选项传递给最终视图 */
				switchOptions = null;
			}
			targetViewId = targetView.getId();
			targetViewNamespace = targetView.getNamespace();

			if(View.currentState != null)
				switchType = poppedNewState.sn < View.currentState.sn? View.SWITCHTYPE_HISTORYBACK: View.SWITCHTYPE_HISTORYFORWARD;

			/* 视图切换 */
			viewInternalVariable.showView(targetViewId, targetViewNamespace, {
				type: switchType,
				trigger: null != viewInternalVariable.intendedSwitchType? View.SWITCHTRIGGER_APP: View.SWITCHTRIGGER_NAVIGATOR,
				options: switchOptions,

				onbeforeswitch: function(){
					/* history 堆栈更新 */
					ViewState.replaceViewState(targetViewId, targetViewNamespace, poppedNewState.sn, switchOptions);
				}
			});
		}else{
			globalLogger.info("Skip state: {}", e.state);
		}
	};
	var init = function(){
		if(isViewInitialized){
			globalLogger.error("View.js was initialized already");
			return;
		}


		markViewToBeInitialized();

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
		for(var i = 0; i < viewObjs.length; i++)
			initViewObj(viewObjs[i]);

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

				if(!util.isEmptyString(rst.specifiedViewNamespace, true))
					targetViewNamespace = rst.specifiedViewNamespace;

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
		markViewInitialized();

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
			if(!isSpecifiedViewIdEmpty){
				if(View.ifExists(specifiedViewId, specifiedViewNamespace)){
					targetViewId = specifiedViewId;
					targetViewNamespace = specifiedViewNamespace;
				}else
					globalLogger.warn("No view of id: '{}' namespace: '{}'(specified in the location hash) found, trying to show the default view", specifiedViewId, specifiedViewNamespace);
			}else{
				if(!isDefaultViewIdEmpty){
					if(View.ifExists(defaultViewId, defaultViewNamespace)){
						targetViewId = defaultViewId;
						targetViewNamespace = defaultViewNamespace;
					}else
						globalLogger.warn("No default view of id: '{}' within namespace: '{}' found", defaultViewId, defaultViewNamespace);
				}else{

					targetViewId = null;
					targetViewNamespace = null;
				}
			}

			var isTargetViewIdEmpty = util.isEmptyString(targetViewId, true);
			if(isTargetViewIdEmpty)
				return;

			var targetView = viewInternalVariable.getFinalView(targetViewId, targetViewNamespace);
			if(null == targetView){
				globalLogger.error("No final view found for view of id: '{}', namespace: '{}'", targetViewId, targetViewNamespace);
				return;
			}

			targetViewId = targetView.getId();
			targetViewNamespace = targetView.getNamespace();
			var ifViewRemainsTheSame = targetViewId === specifiedViewId && targetViewNamespace === specifiedViewNamespace;
			/* 如果最终视图和地址栏中的视图不是一个视图，则不能再将选项传递给最终视图 */
			if(!ifViewRemainsTheSame)
				options = null;

			globalLogger.info("Showing view: '{}' within namespace: '{}'", targetViewId, targetViewNamespace);

			var currentActiveView = View.getActiveView();
			viewInternalVariable.switchView({
				srcView: currentActiveView === targetView? null: currentActiveView,
				targetView: targetView,
				withAnimation: false,
				params: null,

				onbeforeswitch: function(){
					ViewState.replaceViewState(targetViewId, targetViewNamespace, null, options);
				}
			});
		})();
	};

	/**
	 * 执行初始化动作。如果已经初始化，则不再重复执行
	 * @returns {View}
	 */
	View.init = function(){
		init();
		return View;
	};

	/**
	 * 即使文档已经就绪，也不自动执行初始化动作。否则，对于“通过ajax异步加载view.js”的场景，将无法执行自定义的初始化器。
	 * 对于该场景，开发者可以借助View.setInitializer方法手动执行初始化操作。例如：
	 * View.setInitializer(function(init){init();});
	 */
	document.addEventListener("DOMContentLoaded", function(){
		if(null == viewInitializer){
			/* 判断是否需要自动执行初始化动作 */
			var autoInitStr = View.getViewContainerDomElement().getAttribute(viewAttribute.attr$view_auto_init);
			var ifDoNotAutoInit = null !== autoInitStr && "false" === autoInitStr.trim().toLowerCase();
			if(!ifDoNotAutoInit){
				globalLogger.info("Initializing View.js automatically");
				init();
			}
		}else if("domready" === viewInitializerExecTime){
			globalLogger.info("Calling specified View.js initializer");
			viewInitializer(init);
		}
	});


	toolbox.expose(View);
})