;(function(ctx, name){
	var util = ctx[name].util,
		layout = ctx[name].layout,
		globalLogger = ctx[name].Logger.globalLogger;

	var docEle = document.documentElement;
	var NOT_SUPPLIED = {};

	/**
	 * 视图布局
	 * @param {String} viewId 关联的视图编号
	 * @param {String} viewNamespace 视图隶属的命名空间
	 */
	var ViewLayout = (function(){
		var instances = {};

		var previousWidth = -1,
			previousHeight = -1,

			currentWidth = 0,
			currentHeight = 0;

		var Clazz = function(viewId, viewNamespace){
			var layoutAction = function doNothing(){},/** 布局动作 */
				layoutWhenLayoutChanges = true,/** 设备方向改变时，是否执行布局动作 */
				layoutCushionTime = 50,/** 布局连续发生改变时，缓冲布局动作执行的时长。单位：毫秒 */
				latestLayoutOrientation = NOT_SUPPLIED;/** 最后一次布局时设备的方向（portrait：竖屏；landscape：横屏1） */

			/**
			 * 设置布局方法
			 * @param {Function} _layoutAction 布局方法
			 */
			util.defineReadOnlyProperty(this, "setLayoutAction", function(_layoutAction){
				if(typeof _layoutAction != "function"){
					globalLogger.error("Layout action for view of id: '{}' namespace: '{}' should be of type: Function.", viewId, viewNamespace);
					return this;
				}

				if(layoutAction != _layoutAction){
					latestLayoutOrientation = NOT_SUPPLIED;
					layoutAction = _layoutAction;
				}

				return this;
			});
			
			/**
			 * 获取布局方法
			 */
			util.defineReadOnlyProperty(this, "getLayoutAction", function(){
				return layoutAction;
			});

			/**
			 * 执行布局动作
			 */
			util.defineReadOnlyProperty(this, "doLayout", function(){
				if(typeof layoutAction != "function")
					return this;

				if(Math.abs(currentWidth - previousWidth) > 0.05 || Math.abs(currentHeight - previousHeight) > 0.05)
					docEle.offsetWidth = docEle.offsetHeight;

				layoutAction();

				previousWidth = currentWidth;
				previousHeight = currentHeight;

				return this;
			});
			
			/**
			 * 设置布局缓冲时长
			 * @param {String} v 缓冲时长。设置0以代表不缓冲立即执行。单位：毫秒
			 */
			util.defineReadOnlyProperty(this, "setLayoutCushionTime", function(v){
				if(null == v || isNaN(v = Number(v)) || v < 0){
					globalLogger.error("Invalid layout cushion time. Should be a digit greater than or equal to 0.");
					return this;
				}
				
				layoutCushionTime = v;
				return this;
			});
			
			/**
			 * 获取设置的布局缓冲时长
			 */
			util.defineReadOnlyProperty(this, "getLayoutCushionTime", function(v){
				return layoutCushionTime;
			});
			
			/**
			 * 设置布局选项：是否在外层布局发生改变时执行布局动作
			 */
			util.defineReadOnlyProperty(this, "setIfLayoutWhenLayoutChanges", function(_layoutWhenLayoutChanges){
				layoutWhenLayoutChanges = _layoutWhenLayoutChanges;
				return this;
			});

			var self = this;
			var timer;
			layout.addLayoutChangeListener(function(newWidth, newHeight){
				if(!layoutWhenLayoutChanges)
					return;

				if(!View.ofId(viewId, viewNamespace).isActive())
					return;

				globalLogger.debug("Layout changes, doing layout for view of id: '{}' namespace: '{}'. Width: {}, height: {}", viewId, viewNamespace, newWidth, newHeight);

				currentWidth = newWidth;
				currentHeight = newHeight;
			
				clearTimeout(timer);
				if(layoutCushionTime > 0)
					timer = setTimeout(function(){
						self.doLayout();
					}, layoutCushionTime);
				else
					self.doLayout();
			});
		};

		/**
		 * 获取指定编号的视图对应的视图布局。如果实例并不存在，则自动创建一个
		 */
		Clazz.ofId = function(id, namespace){
			var str = id + "@" + namespace;
			if(str in instances)
				return instances[str];

			var inst = new Clazz(id, namespace);
			instances[str] = inst;

			return inst;
		};

		/**
		 * 【已废弃】
		 * @deprecated
		 *
		 * 提供自定义的“判断当前是否是竖屏（或需要以竖屏方式渲染）”方法。方法需要返回布尔值。true：竖屏；false：横屏；
		 * @param {Function} impl 实现方法
		 */
		Clazz.implIsPortrait = function(impl){
			globalLogger.warn("This method is redundant and deprecated and will be removed in the future.");
			return Clazz;
		};

		return Clazz;
	})();


	ctx[name].ViewLayout = ViewLayout;
})(window, "View");