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
	 * @param {String} [groupName] 群组名称。不区分大小写。如果为空字符串，则返回所有视图
	 */
	View.listAll = viewInternalVariable.listAllViews;

	/**
	 * 列举所有的视图群组
	 */
	View.listAllGroups = function(){
		var groupNames = viewInternalVariable.listAllViews().reduce(function(start, view){
			var groupName = view.getGroupName();
			if(util.isEmptyString(groupName, true) || start.indexOf(groupName) !== -1)
				return start;

			start.push(groupName);
			return start;
		}, []);
		return groupNames;
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
			globalLogger.warn("No view id supplied to set as default.");
			return View;
		}

		/* 去除当前的默认视图的默认标记 */
		var viewObjs = viewInternalVariable.getViewDomElements();
		for(var i = 0; i < viewObjs.length; i++)
			viewObjs[i].removeAttribute(viewAttribute.attr$view_default);

		/* 设置新的默认视图 */
		var viewObj = viewInternalVariable.getViewDomElementOfId(viewId, namespace);
		if(null == viewObj){
			globalLogger.error("No view dom element of id: '{}' namespace: '{}' found to set as default.", viewId, namespace);
			return View;
		}
		viewObj.setAttribute(viewAttribute.attr$view_default, "true");

		return View;
	};

	/**
	 * 判断视图默认是否可以直接访问
	 */
	View.isDirectlyAccessible = function(){
		var rootFlag = document.documentElement.getAttribute(viewAttribute.attr$view_directly_accessible);
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
			throw new Error("Invalid argument, type of 'Function' is required.");

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

		ViewState.replaceViewState(activeView.getId(), activeView.getNamespace(), View.currentState? View.currentState.sn: null, options);

		return View;
	};

	/**
	 * 以“压入历史堆栈”的方式略过视图，使得在不展现视图的前提下达到返回时可以返回到该视图上的目的
	 * @param {String} targetViewId 目标视图ID
	 * @param {String} [namespace=defaultNamespace] 视图隶属的命名空间
	 */
	View.passBy = function(targetViewId, namespace){
		if(arguments.length < 2 || typeof namespace !== "string" || util.isEmptyString(namespace, true)){
			namespace = viewInternalVariable.defaultNamespace;
		}
		viewInternalVariable.buildNamespace(namespace);

		/* 默认视图（":default-view"） */
		if(util.ifStringEqualsIgnoreCase(viewRepresentation.PSVIEW_DEFAULT, targetViewId)){
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
			var firstViewId = viewInternalVariable.findFirstViewIdOfGroupName(groupName);
			if(null == firstViewId)
				return View;

			targetViewId = firstViewId;
		}

		/* 检查目标视图是否存在 */
		if(!View.ifExists(targetViewId, namespace)){
			console.error(new Error("Target view: '" + targetViewId + "' within namespace: '" + namespace + "' does not exist!"));
			return View;
		}

		ViewState.pushViewState(targetViewId, namespace);
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
	 * @param {String} [namespace=defaultNamespace] 视图隶属的命名空间
	 * @param {Object} ops 切换配置。详见viewInternalVariable.showView
	 * @param {Object} ops.options 视图选项
	 */
	View.navTo = function(targetViewId, namespace, ops){
		if(arguments.length < 2 || typeof namespace !== "string" || util.isEmptyString(namespace, true)){
			ops = namespace;
			namespace = viewInternalVariable.defaultNamespace;
		}
		viewInternalVariable.buildNamespace(namespace);

		targetViewId = targetViewId.trim();
		ops = util.setDftValue(ops, {});

		var renderingViewId = viewInternalVariable.getRenderingViewId(),
			currentView = View.getActiveView();/* 当前活动视图 */

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
				globalLogger.error("No default view found.");
				return View;
			}

			targetViewId = defaultView.getId();
		}
		/* 群组视图（"~[groupName]"） */
		if(/^~/.test(targetViewId)){
			var groupName = targetViewId.substring(1);
			var firstViewId = viewInternalVariable.findFirstViewIdOfGroupName(groupName);
			if(null == firstViewId)
				return View;

			targetViewId = firstViewId;
		}

		/* 检查目标视图是否存在 */
		if(!View.ifExists(targetViewId, namespace)){
			globalLogger.log("Trying to navigate to view: '{}' within namespace: '{}' with params: {}, options: {}", targetViewId, namespace, ops.params, ops.options);

			var e = new Error("Target view: '" + targetViewId + "' within namespace: '" + namespace + "' does not exist! Firing event 'viewnotexist'...");
			console.error(e);
			View.fire("viewnotexist", {targetViewId: targetViewId, targetViewNamespace: namespace});
			return View;
		}

		ops.type = View.SWITCHTYPE_VIEWNAV;
		ViewState.pushViewState(targetViewId, namespace, null, null == ops? null: ops.options);
		viewInternalVariable.showView(targetViewId, namespace, ops);

		return View;
	};

	/**
	 * 以“替换当前堆栈”的方式切换视图
	 * @param targetViewId 目标视图ID
	 * @param {String} [namespace=defaultNamespace] 视图隶属的命名空间
	 * @param {Object} ops 切换配置。详见switchView
	 * @param {Object} ops.options 视图选项
	 */
	View.changeTo = function(targetViewId, namespace, ops){
		if(arguments.length < 2 || typeof namespace !== "string" || util.isEmptyString(namespace, true)){
			ops = namespace;
			namespace = viewInternalVariable.defaultNamespace;
		}
		viewInternalVariable.buildNamespace(namespace);

		ops = util.setDftValue(ops, {});

		var renderingViewId = viewInternalVariable.getRenderingViewId(),
			currentView = View.getActiveView();/* 当前活动视图 */

		/* 默认视图（":default-view"） */
		if(util.ifStringEqualsIgnoreCase(viewRepresentation.PSVIEW_DEFAULT, targetViewId)){
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
			var firstViewId = viewInternalVariable.findFirstViewIdOfGroupName(groupName);
			if(null == firstViewId)
				return View;

			targetViewId = firstViewId;
		}

		/* 检查目标视图是否存在 */
		if(!View.ifExists(targetViewId, namespace)){
			globalLogger.log("Trying to navigate to view: '{}' within namespace: '{}' with params: {}, options: {}", targetViewId, namespace, ops.params, ops.options);

			var e = new Error("Target view: '" + targetViewId + "' within namespace: '" + namespace + "' does not exist! Firing event 'viewnotexist'...");
			console.error(e);
			View.fire("viewnotexist", {targetViewId: targetViewId, targetViewNamespace: namespace});
			return View;
		}

		ops.type = View.SWITCHTYPE_VIEWCHANGE;
		ViewState.replaceViewState(targetViewId, namespace, null, null == ops? null: ops.options);
		viewInternalVariable.showView(targetViewId, namespace, ops);

		return View;
	};

	/**
	 * 回退到上一个视图
	 * @param {Object} ops 切换配置
	 * @param {Object | null} ops.params 视图切换参数
	 */
	View.back = function(ops){
		/* 清除旧数据，并仅在指定了参数时才设置参数，防止污染其它回退操作 */
		viewParameter.clearViewParameters(viewRepresentation.PSVIEW_BACK);
		if(null != ops && "params" in ops)
			viewParameter.setViewParameters(viewRepresentation.PSVIEW_BACK, "", ops.params);

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
		viewParameter.clearViewParameters(viewRepresentation.PSVIEW_FORWARD);
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
			throw new Error("Invalid argument! Type of 'Function' is needed.");

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

		globalLogger.log("{} Current: {}", util.env.isHistoryPushPopSupported? "State poped!": "Hash changed!", currentActiveView && currentActiveView.getId());
		globalLogger.log("↑ {}", util.env.isHistoryPushPopSupported? JSON.stringify(e.state): location.hash);

		/* 视图切换 */
		var newViewId,
			newViewNamespace,
			type = View.SWITCHTYPE_VIEWNAV, options, targetView = null;
		if(null == e.state){/* 手动输入目标视图ID */
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

				targetView = viewInternalVariable.getFinalView(newViewId, newViewNamespace);
				if(null != targetView){
					targetViewId = targetView.getId();
					targetViewNamespace = targetView.getNamespace();
				}
			}

			if(null != targetViewId){
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
			var popedNewState = e.state;
			newViewId = popedNewState.viewId;
			newViewNamespace = popedNewState.viewNamespace;

			if(View.ifExists(newViewId, newViewNamespace)){
				targetView = View.ofId(newViewId, newViewNamespace);
				options = popedNewState.options;
			}else{
				globalLogger.warn("Popped view: '" + newViewId + "' within namespacer: '" + newViewNamespace + "' does not exist, keeping current.");
				targetView = currentActiveView;

				/* 如果最终视图和地址栏中的视图不是一个视图，则不能再将选项传递给最终视图 */
				options = null;
			}
			var targetViewId = targetView.getId();
			var targetViewNamespace = targetView.getNamespace();

			if(View.currentState != null)
				type = popedNewState.sn < View.currentState.sn? View.SWITCHTYPE_HISTORYBACK: View.SWITCHTYPE_HISTORYFORWARD;

			/* history堆栈更新 */
			ViewState.replaceViewState(targetViewId, targetViewNamespace, popedNewState.sn, options);

			/* 视图切换 */
			viewInternalVariable.showView(targetViewId, targetViewNamespace, {type: type, options: options});
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

		/* 识别视图容器。如果没有元素声明为视图容器，则认定body为视图容器 */
		;(function(){
			var objs = document.querySelectorAll("[" + viewAttribute.attr$view_container + "]");
			if(0 === objs.length){
				document.body.setAttribute(viewAttribute.attr$view_container, "");
			}else
				for(var i = 1; i < objs.length; i++)
					objs[i].removeAttribute(viewAttribute.attr$view_container);
		})();

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
				globalLogger.warn("Multiple view of id: '{}' within namespace: '{}' exists.", view.id, view.namespace);
				return;
			}
			initedViews.push(view);

			/* 去除可能存在的激活状态 */
			viewObj.classList.remove("active");

			/* 添加样式类 */
			viewObj.classList.add("view");

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
				globalLogger.warn("No view exists to determine the default view.");

			return dftViewObj;
		};

		/* 确定默认视图，并添加激活标识 */
		dftViewObj = determineDefaultView();
		if(null != dftViewObj)
			dftViewObj.classList.add("active");

		/**
		 * 指令：data-view-rel配置视图导向
		 * 		取值：[view-id(?:@view-namespace)] 目标视图ID
		 * 		取值：:back 回退至上一个视图
		 * 		取值：:forward 前进至下一个视图
		 * 		取值：:default-view 导向至默认视图
		 * 		取值：~groupName 导向至目标群组的第一个视图
		 * 	    取值：@[url] 导向至外部页面
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
				while(null == tmp.getAttribute(viewAttribute.attr$view_rel)){
					tmp = tmp.parentNode;

					if(!(tmp instanceof HTMLElement))
						tmp = null;
					if(null == tmp)
						break;
				}
				if(null != tmp)
					targetViewId = tmp.getAttribute(viewAttribute.attr$view_rel);

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
					history.go(-1);
					// var policy = tmp.getAttribute(viewAttribute.attr$view_back_policy);
					// if(null != policy)
					// 	policy = policy.trim().toLowerCase();
					//
					// if(null == policy || "mandatory" === policy)
					// 	history.go(-1);
					// else if("smart" === policy){
					// 	var len = history.length;
					// 	if(null != len){
					// 		if(len > 2){
					// 			history.go(-1);
					// 		}else{
					// 			globalLogger.info("Change to default view in that view back policy is smart.");
					// 			View.changeTo(viewRepresentation.PSVIEW_DEFAULT);
					// 		}
					// 	}else
					// 		history.go(-1);
					// }else{
					// 	globalLogger.warn("Unknown view back policy: {}. Supported policy: 'mandatory', 'smart'", policy);
					// 	history.go(-1);
					// }

					return;
				}

				/* 前进操作（":forward"） */
				if(util.ifStringEqualsIgnoreCase(viewRepresentation.PSVIEW_FORWARD, targetViewId)){
					history.go(1);/* browser support */
					return;
				}

				/* 默认视图（":default-view"） */
				if(util.ifStringEqualsIgnoreCase(viewRepresentation.PSVIEW_DEFAULT, targetViewId)){
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

					var groupName = m[1].trim(), _options = util.parseParams(m[2]);
					var firstViewId = viewInternalVariable.findFirstViewIdOfGroupName(groupName);
					if(null == firstViewId)
						return;

					targetViewId = firstViewId;
					options = _options;
				}else{
					var rst = viewRepresentation.parseViewInfoFromHash("#" + targetViewId);

					targetViewId = rst.viewId;
					options = rst.options;
				}

				/* 允许同一视图连续跳转 */

				var namespace = tmp.getAttribute(viewAttribute.attr$view_rel_namespace);
				if(util.isEmptyString(namespace, true))
					namespace = viewInternalVariable.defaultNamespace;

				var relType = tmp.getAttribute(viewAttribute.attr$view_rel_type);
				relType = util.isEmptyString(relType, true)? "nav": relType;
				if(!/^(?:nav)|(?:change)$/.test(relType)){
					globalLogger.warn("Unknown view switch type: {}. {}", relType, tmp);
					relType = "nav";
				}

				/* 呈现ID指定的视图 */
				View[relType + "To"](targetViewId, namespace, {options: options});
			}, {useCapture: true});
		})();

		/* 使能属性：data-view-whr */
		;(function(){
			var whr = document.documentElement.getAttribute(viewAttribute.attr$view_whr);
			if(null == whr || (whr = whr.trim().toLowerCase()) === ""){
				layout.init();
				return;
			}

			var r = /(\d+(?:\.\d*)?)\s*\/\s*(\d+(?:\.\d*)?)/i;
			var tmp = whr.match(r);
			if(null == tmp){
				globalLogger.warn("Invalid view expected width height ratio: {}. Value such as '320/568'(iPhone 5) is valid. Using '{}' instead.", whr, viewInternalVariable.defaultWidthHeightRatio);
				tmp = viewInternalVariable.defaultWidthHeightRatio.exec(r);
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
					globalLogger.warn("No default view(id: '{}', namespace: '{}') found.", defaultViewId, defaultViewNamespace);

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