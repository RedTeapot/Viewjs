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
			return viewName === v.getName()
				|| viewName === v.getGroupName();/* 向后兼容 */
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