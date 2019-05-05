;(function(ctx, name){
	/** DOM属性集合 */
	ctx[name].viewAttribute = {
		attr$view: "data-view",
		attr$viewId: "data-view-id",
		attr$view_namespace: "data-view-namespace",
		attr$view_default: "data-view-default",
		attr$view_directly_accessible: "data-view-directly-accessible",
		attr$view_group: "data-view-group",
		attr$view_fallback: "data-view-fallback",
		attr$view_rel: "data-view-rel",

		// /**
		//  * 与data-view-back: ":back"结合使用，用于告知框架回退策略：
		//  * 1. mandatory：固定的执行history.go(-1)；
		//  * 2. smart：如果前面有浏览历史，则执行history.go(-1)；如果没有，则View.changeTo()跳转至默认视图
		//  *
		//  * @type {string}
		//  */
		// attr$view_back_policy: "data-view-back-policy",

		attr$view_rel_disabled: "data-view-rel-disabled",
		attr$view_rel_type: "data-view-rel-type",
		attr$view_rel_namespace: "data-view-rel-namespace",
		attr$view_title: "data-view-title",
		attr$view_container: "data-view-container",
		attr$view_os: "data-view-os",

		/**
		 * width height ratio. Value: 'w/h'
		 */
		attr$view_whr: "data-view-whr",

		attr$active_view_id: "data-active-view-id",
		attr$active_view_namespace: "data-active-view-namespace"
	};
})(window, "View");