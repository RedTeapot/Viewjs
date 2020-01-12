View(function(toolbox){
	var util = toolbox.get("util");

	var MOBILE_REGEX = /mobile|tablet|ip(ad|hone|od)|android/i,
		SUPPORT_TOUCH = ('ontouchstart' in window),
		IS_MOBILE = MOBILE_REGEX.test(navigator.userAgent);

	/* 添加的依附于DOM元素的，用于记录其相关取值的属性名称 */
	var touchAttributeName = "  __com.soft.plugin.touch#" + new Date().getTime() + "__  ";

	/**
	 * 定位至指定的命名空间。如果命名空间不存在，则顺序创建
	 * @param obj {Object} 创建空间的对象
	 * @param name {String} 要创建的空间（空间之间以“.”分割，如："a.b.c"）
	 */
	var mapNamespace = function(obj, name){
		obj = obj || {};
		obj[name] = obj[name] || {};
		return obj[name];
	};

	/**
	 * 添加“轻触”事件监听器
	 * @param target {HTMLElement} 要添加监听事件的元素
	 * @param callback {Function} 事件触发时执行的回调函数
	 * @param options {Object} 控制选项
	 * @param options.timespan {Number} 轻触开始和轻触结束之间的最大事件间隔。单位：毫秒
	 * @param options.delta {Object} 轻触操作在触摸屏上产生的位移
	 * @param options.delta.x {Number} 允许的最大横向位移
	 * @param options.delta.y {Number} 允许的最大纵向位移
	 * @param options.useCapture {Boolean} 是否在捕获阶段监听事件
	 */
	var addTapListener = function(target, callback, options){
		/* 如果浏览器不支持触摸事件，则改用click */
		if(!IS_MOBILE){
			target.addEventListener? target.addEventListener("click", callback): target.attachEvent("onclick", callback);
			return;
		}

		/* 在元素上创建空间，用于存储相关信息 */
		var tapNamespace = mapNamespace(target, touchAttributeName + ".tap");
		tapNamespace.callbacks = tapNamespace.callbacks || [];

		/* 如果事件已经添加，则直接返回 */
		if(tapNamespace.callbacks.indexOf(callback) !== -1)
			return;

		/* 添加回调函数至响应队列中 */
		tapNamespace.callbacks.push(callback);

		/* 选项配置 */
		options = util.setDftValue(options, {timespan: 500, delta: {}, useCapture: false});
		options.delta = util.setDftValue(options.delta, {x: 10, y: 15});

		/* 保留添加的touchstart, touchend回调函数引用，以支持事件移除 */
		var metaNamespace = mapNamespace(target, touchAttributeName + ".tap.meta");
		/* 轻触开始 */
		if(null == metaNamespace.touchstart){
			metaNamespace.touchstart = function(e){
				var touch = e.changedTouches? e.changedTouches[0]: e;
				tapNamespace.startX = touch.screenX;
				tapNamespace.startY = touch.screenY;
				tapNamespace.startTimestamp = Date.now();
			};
			target.addEventListener("touchstart", metaNamespace.touchstart);
		}
		/* 轻触结束 */
		if(null == metaNamespace.touchend){
			metaNamespace.touchend = function(e){
				var touch = e.changedTouches? e.changedTouches[0]: e;
				tapNamespace.stopX = touch.screenX;
				tapNamespace.stopY = touch.screenY;
				tapNamespace.stopTimestamp = Date.now();

				var timespan = tapNamespace.stopTimestamp - tapNamespace.startTimestamp,
					deltaX = Math.abs(tapNamespace.stopX - tapNamespace.startX),
					deltaY = Math.abs(tapNamespace.stopY - tapNamespace.startY);

				/* 仅当误差在允许的范围内时才调用回调函数 */
				if(timespan <= options.timespan && deltaX <= options.delta.x && deltaY <= options.delta.y){
					for(var i = 0; i < tapNamespace.callbacks.length; i++)
						util.try2Call(tapNamespace.callbacks[i], target, e);
				}
			};
			target.addEventListener("touchend", metaNamespace.touchend, options.useCapture);
		}
	};

	/**
	 * 移除添加的轻触事件监听器
	 * @param target {HTMLElement} 要移除事件的元素
	 * @param callback {Function} 要移除的回调函数
	 * @param useCapture {Boolean} 是否在捕获阶段监听事件
	 */
	var removeTapListener = function(target, callback, useCapture){
		/* 如果浏览器不支持触摸事件，则改用click */
		if(!IS_MOBILE){
			target.removeEventListener? target.removeEventListener("click", callback): target.detachEvent("onclick", callback);
			return;
		}

		if(!target.hasOwnProperty(touchAttributeName))
			return;

		/* 判断回调函数是否存在 */
		var tapNamespace = mapNamespace(target, touchAttributeName + ".tap");
		var index = tapNamespace.callbacks.indexOf(callback);
		if(index === -1){
			return;
		}

		/* 移除回调函数 */
		tapNamespace.callbacks.splice(index, 1);

		/* 如果所有回调函数都被移除，则清除所有数据 */
		if(tapNamespace.callbacks.length === 0){
			/* 移除添加的touchstart，touchend回调函数 */
			var metaNamespace = mapNamespace(target, touchAttributeName + ".tap.meta");
			target.removeEventListener("touchstart", metaNamespace.touchstart);
			target.removeEventListener("touchend", metaNamespace.touchend, useCapture);

			delete target[touchAttributeName].tap;
		}
	};

	toolbox.set("touch", {
		addTapListener: addTapListener,
		removeTapListener: removeTapListener
	});
})