View(function(toolbox){
	var util = toolbox.get("util"),
		layout = toolbox.get("layout"),
		globalLogger = toolbox.get("Logger").globalLogger;

	var docEle = document.documentElement;
	var doNothing = function doNothing(){};

	var instances = {};

	var previousWidth = -1,
		previousHeight = -1,

		currentWidth = 0,
		currentHeight = 0;

	/**
	 * 视图布局
	 * @param {String} viewId 关联的视图编号
	 * @param {String} viewNamespace 视图隶属的命名空间
	 */
	var ViewLayout = function(viewId, viewNamespace){
		var layoutAction = doNothing,/** 布局动作 */
			layoutWhenLayoutChanges = true,/** 设备方向改变时，是否执行布局动作 */
			layoutCushionTime = 50;/** 布局连续发生改变时，缓冲布局动作执行的时长。单位：毫秒 */

		/**
		 * 设置布局方法da
		 * @param {Function} _layoutAction 布局方法
		 * @returns {ViewLayout}
		 */
		this.setLayoutAction = function(_layoutAction){
			if(typeof _layoutAction != "function"){
				globalLogger.error("Layout action should be of type: 'Function'");
				return this;
			}

			if(layoutAction !== _layoutAction){
				layoutAction = _layoutAction;
			}

			return this;
		};

		/**
		 * 获取布局方法
		 * @returns {Function}
		 */
		this.getLayoutAction = function(){
			return layoutAction;
		};

		/**
		 * 执行布局动作
		 * @returns {ViewLayout}
		 */
		this.doLayout = function(){
			if(typeof layoutAction != "function")
				return this;

			if(Math.abs(currentWidth - previousWidth) > 0 || Math.abs(currentHeight - previousHeight) > 0)
				docEle.offsetWidth, docEle.offsetHeight;

			layoutAction();

			previousWidth = currentWidth;
			previousHeight = currentHeight;

			return this;
		};

		/**
		 * 设置布局缓冲时长
		 * @param {Number} v 缓冲时长。设置0以代表不缓冲立即执行。单位：毫秒
		 * @returns {ViewLayout}
		 */
		this.setLayoutCushionTime = function(v){
			if(null == v || isNaN(v = Number(v)) || v < 0){
				globalLogger.error("Invalid layout cushion time. Should be a digit greater than or equal to 0");
				return this;
			}

			layoutCushionTime = v;
			return this;
		};

		/**
		 * 获取设置的布局缓冲时长
		 * @returns {Number}
		 */
		this.getLayoutCushionTime = function(){
			return layoutCushionTime;
		};

		/**
		 * 设置布局选项：是否在外层布局发生改变时执行布局动作
		 * @param {Boolean} v 布局空间发生变化时是否自动执行布局动作
		 * @returns {ViewLayout}
		 */
		this.setIfLayoutWhenLayoutChanges = function(v){
			layoutWhenLayoutChanges = !!v;
			return this;
		};

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
	ViewLayout.ofId = function(id, namespace){
		var str = id + "@" + namespace;
		if(str in instances)
			return instances[str];

		var inst = new ViewLayout(id, namespace);
		instances[str] = inst;

		return inst;
	};


	toolbox.set("ViewLayout", ViewLayout);
})