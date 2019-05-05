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
	 * @type {Object<String, View>}
	 */
	var viewInstancesMap = {};

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
	 * @param {HTMLElement} domElement
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
		var objs = document.querySelectorAll("*[" + viewAttribute.attr$view + "=true]");

		var arr = [];
		for(var i = 0; i < objs.length; i++)
			if(isValidViewDomElement(objs[i]))
				arr.push(objs[i]);

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
	 * 获取当前正在呈现的，或即将呈现的视图ID。
	 * 如果视图切换过程中有动画，则通过navTo或changeTo方法执行视图切换动作后，地址栏中呈现的视图ID不一定是当前的活动视图的ID。
	 * 视图切换时，地址栏中的视图ID会被即时替换，替换为目标视图ID。
	 */
	var getRenderingViewId = function(){
		if(null == View.currentState)
			return null;

		return View.currentState.viewId;
	};

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
			targetView = getActiveOrDefaultView();
		}else{
			targetView = View.ofId(viewId, namespace);
			if(!targetView.isDirectlyAccessible())/** 判断指定的视图是否支持直接访问 */
			targetView = targetView.getFallbackView();
		}

		return targetView;
	};

	/**
	 * 列举所有视图
	 * @param {String} [groupName] 群组名称。不区分大小写。如果为空字符串，则返回所有视图
	 */
	var listAllViews = function(groupName){
		if(arguments.length > 1)
			groupName = String(groupName).toLowerCase();

		var arr = [];
		for(var namespace in viewInstancesMap)
			arr = arr.concat(viewInstancesMap[namespace]);

		if(arguments.length < 1 || util.isEmptyString(groupName, true))
			return arr;

		return arr.filter(function(v){
			return groupName === v.getGroupName();
		});
	};

	/**
	 * 查找隶属于给定名称的群组的第一个视图的视图ID
	 * @param {String} groupName 视图群组名称
	 */
	var findFirstViewIdOfGroupName = function(groupName){
		if(util.isEmptyString(groupName, true)){
			globalLogger.error("Empty view group name!");
			return null;
		}
		groupName = String(groupName).trim().toLowerCase();

		var groupViews = listAllViews(groupName);
		if(null == groupViews || 0 === groupViews.length){
			globalLogger.error("No view of group: {} found.", groupName);
			return null;
		}

		var groupViewIds = groupViews.map(function(v){
			return v.getId();
		});
		var targetViewId = groupViewIds[0];
		globalLogger.info("Found {} views of group: {}: {}, using the first one: {}.", groupViewIds.length, groupName, groupViewIds, targetViewId);

		return targetViewId;
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

	/**
	 * 切换视图
	 * @param {View} ops.srcView 源视图
	 * @param {View} ops.targetView 目标视图
	 * @param {String} ops.type 切换操作类型（View.SWITCHTYPE_HISTORYFORWARD || View.SWITCHTYPE_HISTORYBACK || View.SWITCHTYPE_VIEWNAV || View.SWITCHTYPE_VIEWCHANGE）
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
			var targetViewNamespace = targetView.getNamespace();
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

			var eventData = {sourceView: srcView, type: type, params: params};
			var fireEvent = function(evt, async){
				try{
					targetView.fire(evt, eventData, async);
				}catch(e){
					globalLogger.error("Error occurred while firing event: {} with data: {}", evt, eventData);

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
			ViewLayout.ofId(targetViewId, targetViewNamespace).doLayout();
			View.fire("change", viewChangeParams, false);
			if(!targetView.isReady()){
				readyViews.push(targetViewId);
				fireEvent("ready", false);
			}
			fireEvent("enter", false);
			fireEvent("afterenter", false);

			/* 在视图容器上标记活动视图 */
			var viewContainerObj = getViewContainerDomElement();
			viewContainerObj.setAttribute(viewAttribute.attr$active_view_id, targetView.id);
			viewContainerObj.setAttribute(viewAttribute.attr$active_view_namespace, targetView.namespace);

			/* 触发后置切换监听器 */
			View.fire("afterchange", viewChangeParams);
		};

		/* 触发前置切换监听器 */
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

		viewInstancesMap: viewInstancesMap,
		readyViews: readyViews,
		get viewSwitchAnimation(){return viewSwitchAnimation;},
		set viewSwitchAnimation(animation){viewSwitchAnimation = animation;},

		getPotentialViewId: getPotentialViewId,
		getViewContainerDomElement: getViewContainerDomElement,
		getViewDomElements: getViewDomElements,
		getViewDomElementOfId: getViewDomElementOfId,
		getRenderingViewId: getRenderingViewId,
		buildNamespace: buildNamespace,
		getFinalView: getFinalView,
		listAllViews: listAllViews,
		findFirstViewIdOfGroupName: findFirstViewIdOfGroupName,
		switchView: switchView,
		showView: showView
	};
})(window, "View");