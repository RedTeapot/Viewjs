;(function(ctx, name){
	var globalLogger = ctx[name].Logger.globalLogger,
		util = ctx[name].util;

	var PSVIEW_BACK = ":back",/* 伪视图：后退 */
		PSVIEW_FORWARD = ":forward",/* 伪视图：前进 */
		PSVIEW_DEFAULT = ":default-view";/* 伪视图：默认视图 */

	var defaultNamespace = "default";

	var viewUrlRepresentation = /^#([\w$\-]+)(?:@([^!]+))?(?:!+(.*))?/;

	/**
	 * 判断指定编号对应的视图是否是伪视图
	 * @param {String} viewId 视图编号
	 */
	var isPseudoView = function(viewId){
		return PSVIEW_BACK === viewId || PSVIEW_FORWARD === viewId || PSVIEW_DEFAULT === viewId;
	};

	/**
	 * 从地址栏hash中解析视图信息
	 * @param {String} hash 地址栏Hash
	 * @return {Object} {viewId: [视图编号], viewNamespace: [视图所属命名空间], specifiedViewNamespace: [字符串中指定的命名空间], options: [选项集合]}
	 */
	var parseViewInfoFromHash = function(hash){
		if("" === hash)
			return null;

		var m = hash.match(viewUrlRepresentation);
		if(null == m)
			return null;

		var viewId = m[1],
			viewNamespace = m[2],
			options = util.parseParams(m[3]);

		if(util.isEmptyString(viewNamespace, true))
			viewNamespace = defaultNamespace;

		return {
			viewId: viewId,
			viewNamespace: viewNamespace,
			specifiedViewNamespace: m[2],
			options: options
		};
	};

	ctx[name].viewRepresentation = {
		PSVIEW_BACK: PSVIEW_BACK,
		PSVIEW_FORWARD: PSVIEW_FORWARD,
		PSVIEW_DEFAULT: PSVIEW_DEFAULT,

		isPseudoView: isPseudoView,
		parseViewInfoFromHash: parseViewInfoFromHash
	};
})(window, "View");