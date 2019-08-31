;(function(ctx, name){
	var util = ctx[name].util,
		Logger = ctx[name].Logger;

	var globalLogger = Logger.globalLogger;

	/** 分辨率组件 */
	var resolution = (function(){
		/** 周期性检测浏览器是否完成翻屏重绘的定时间隔。单位：毫秒 */
		var interval = 20;

		/**
		 * 当设备执行横竖屏切换操作，或屏幕尺寸发生变更时，需要执行的事件句柄
		 */
		var changeCallbacks = [];
		
		/**
		 * 执行监听回调
		 */
		var execResolutionChangeCallbacks = (function(){
			var timer;
			return function(e){
				clearTimeout(timer);
				timer = setTimeout(function(){
					for(var i = 0; i < changeCallbacks.length; i++)
						util.try2Call(changeCallbacks[i], null, e);
				}, 20);
			};
		})();

		/**
		 * 判断当前设备是否处于竖屏模式（宽度小于等于高度）
		 */
		var isPortrait = function(){
			var docEle = document.documentElement;
			return docEle.clientWidth <= docEle.clientHeight;
		};

		/**
		 * 判断当前设备是否处于横屏模式（宽度大于高度）
		 */
		var isLandscape = function(){
			var docEle = document.documentElement;
			return docEle.clientWidth > docEle.clientHeight;
		};

		/**
		 * 检测浏览器是否完成重绘操作
		 */
		var detectIfOrientationChangeCompletes = (function(){
			var isDetecting = false,
				detectStartTimestamp = -1,
				isCurrentPortrait = isPortrait();
			
			/**
			 * 开始检测
			 */
			var startDetecting = function(){
				isDetecting = true;
				detectStartTimestamp = Date.now();
			};
			
			/**
			 * 停止检测
			 */
			var stopDetecting = function(){
				isDetecting = false;
				detectStartTimestamp = -1;
			};
			
			/**
			 * 判断布局是否发生改变，并执行相应操作
			 */
			var judgeIfChanges = function(e){
				if(isCurrentPortrait == isPortrait()){/* 没有改变，继续检测 */
					setTimeout(detectIfOrientationChangeCompletes, interval);
				}else{
					stopDetecting();
					isCurrentPortrait = isPortrait();
					
					execResolutionChangeCallbacks(e);
				}
			};
			
			stopDetecting();
			
			return function(e){
				if(isDetecting){
					var ifDetectionCarryOn = Date.now() - detectStartTimestamp < 500;/* 假定所有机器均可以在500毫秒内完成横竖屏切换 */
					if(ifDetectionCarryOn)
						judgeIfChanges(e);
					else{
						stopDetecting();
					}
				}else{
					startDetecting();
					judgeIfChanges(e);
				}
			};
		})();

		/**
		 * 部分移动设备上虚拟键盘的呈现/隐藏会影响浏览窗口的大小。
		 * 以“宽度不变，高度变大”的表现形式猜测“虚拟键盘消失”现象。
		 * 暂不处理虚拟键盘弹出，导致浏览窗口变小的现象（对于固定显示在底部的元素，处理后效果较差，效果等同于绝对定位）
		 */
		var detectIfKeyboardDisappears = (function(){
			var width = 0, height = 0;

			var threshold = 1e-2;
			var delayTimer, delay = 20;

			var reset = function(){
				width = 0;
				height = 0;
			};

			var try2ExecChangeCallbacks = function(){
				clearTimeout(delayTimer);
				delayTimer = setTimeout(execResolutionChangeCallbacks, delay);
			};

			var doDetect = function(){
				var w = window.innerWidth,
					h = window.innerHeight;

				var wDelta = Math.abs(w - width);

				if(width == 0 || wDelta < threshold && h > height){
					width = w;
					height = h;

					try2ExecChangeCallbacks();
				}

				width = w;
				height = h;
			};
			doDetect.reset = reset;
			doDetect.try2ExecChangeCallbacks = try2ExecChangeCallbacks;

			return doDetect;
		})();

		/**
		 * 检测页面的浏览模式（PC浏览还是手机浏览）
		 */
		var detectPageViewingMode = (function(){
			var lastMode = null;
			var timer;

			var stopDetectIfKeyboardDisappears = function(){
				detectIfKeyboardDisappears.reset();
				clearInterval(timer);
				timer = null;
			};

			var startDetectIfKeyboardDisappears = function(){
				stopDetectIfKeyboardDisappears();
				timer = setInterval(detectIfKeyboardDisappears, 50);
			};

			return function(){
				setInterval(function(){
					util.env.refresh();

					if(util.env.isPc){
						if(lastMode != "pc"){
							globalLogger.debug("Page viewing mode is PC mode.");

							stopDetectIfKeyboardDisappears();
							window.removeEventListener("orientationchange", detectIfOrientationChangeCompletes);

							execResolutionChangeCallbacks();
							window.addEventListener("resize", execResolutionChangeCallbacks);
						}

						lastMode = "pc";
					}else{
						if(lastMode != "!pc"){
							globalLogger.debug("Page viewing mode is none-PC mode.");

							window.removeEventListener("resize", execResolutionChangeCallbacks);

							execResolutionChangeCallbacks();
							window.addEventListener("orientationchange", detectIfOrientationChangeCompletes);
							startDetectIfKeyboardDisappears();
						}

						lastMode = "!pc";
					}
				}, 30);
			};
		})();
		detectPageViewingMode();

		/**
		 * 添加方向切换时执行的事件句柄。该句柄只有在界面重绘完成时才会被执行
		 */
		var addChangeListener = function(callback){
			if(changeCallbacks.indexOf(callback) != -1)
				return;

			changeCallbacks.push(callback);
		};

		var obj = {
			isPortrait: isPortrait,
			isLandscape: isLandscape,

			addChangeListener: addChangeListener
		};
		Object.freeze && Object.freeze(obj);

		return obj;
	})();


	ctx[name].resolution = resolution;
})(window, "View");