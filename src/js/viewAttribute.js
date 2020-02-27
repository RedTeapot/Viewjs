View(function(toolbox){
	toolbox.set("viewAttribute", {
		attr$viewId: "data-view-id",
		attr$view_name: "data-view-name",
		attr$view_group: "data-view-group",
		attr$view_namespace: "data-view-namespace",
		attr$view_title: "data-view-title",

		attr$view_fallback: "data-view-fallback",
		attr$view_fallback_namespace: "data-view-fallback-namespace",

		attr$view: "data-view",
		attr$view_default: "data-view-default",
		attr$view_directly_accessible: "data-view-directly-accessible",

		/**
		 * width height ratio. Value: 'width / height'
		 */
		attr$view_whr: "data-view-whr",
		attr$view_state: "data-view-state",
		attr$view_os: "data-view-os",
		attr$active_view_id: "data-active-view-id",
		attr$active_view_namespace: "data-active-view-namespace",
		attr$view_container: "data-view-container",

		attr$view_rel: "data-view-rel",
		attr$view_rel_namespace: "data-view-rel-namespace",
		attr$view_rel_type: "data-view-rel-type",
		attr$view_rel_disabled: "data-view-rel-disabled"
	});
})