;(function(ctx, name){
	var util = ctx[name].util,
		globalLogger = ctx[name].Logger.globalLogger,
		viewRepresentation = ctx[name].viewRepresentation;

	/**
	 * 自动保存至上下文中的视图参数的key的前缀
	 */
	var keyForParamsAutoSavedToContext = util.randomString("_autosavedparams_");

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
		keyForParamsAutoSavedToContext: keyForParamsAutoSavedToContext,

		hasParameters: hasParameters,
		getParameters: getParameters,
		setParameters: setParameters,
		removeParameters: removeParameters,

		setViewParameters: setViewParameters,
		clearViewParameters: clearViewParameters
	};
})(window, "View");