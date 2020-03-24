View(function(toolbox){
	var util = toolbox.get("util"),
		Logger = toolbox.get("Logger");

	var globalLogger = Logger.globalLogger;

	var docEle = document.documentElement;
	var currentWindowWidth = 0,
		currentWindowHeight = 0,

		currentDocWidth = 0,
		currentDocHeight = 0,

		isCurrentlyPortrait = null,
		isCurrentlyViewingInPCMode = null;

	var interval = 20;
	var changeCallbacks = [];

	/**
	 * 判断当前设备是否处于竖屏模式（宽度小于等于高度）
	 */
	var isPortrait = function(){
		return currentWindowWidth <= currentWindowHeight;
	};

	/**
	 * 添加方向切换时执行的事件句柄。该句柄只有在界面重绘完成时才会被执行
	 * @param {String[]} [listeningChangeAspects] 监听的变化方面
	 * @param {Function} callback 回调方法
	 */
	var addChangeListener = function(listeningChangeAspects, callback){
		if(arguments.length === 1 && typeof arguments[0] === "function"){
			callback = arguments[0];
			listeningChangeAspects = null;
		}

		if(changeCallbacks.indexOf(callback) !== -1)
			return;

		if(Array.isArray(listeningChangeAspects))
			listeningChangeAspects = listeningChangeAspects.map(function(aspect){
				return String(aspect).trim().toLowerCase();
			});

		callback.listeningChangeAspects = listeningChangeAspects;
		changeCallbacks.push(callback);
	};

	/**
	 * 执行监听回调
	 * @param {String[]} changeAspects 变化方面
	 */
	var execResolutionChangeCallbacks = function(changeAspects){
		for(var i = 0; i < changeCallbacks.length; i++){
			var cb = changeCallbacks[i];
			var listeningChangeAspects = cb.listeningChangeAspects;

			if(!Array.isArray(listeningChangeAspects)){
				util.try2Call(cb, null, changeAspects);
				continue;
			}

			var ifMatches = false;
			for(var j = 0; j < listeningChangeAspects.length; j++){
				if(changeAspects.indexOf(listeningChangeAspects[j]) !== -1){
					ifMatches = true;
					break;
				}
			}

			if(ifMatches)
				util.try2Call(cb, null, changeAspects);
		}
	};

	/**
	 * 更新状态
	 */
	var updateState = function(){
		var _currentDocWidth = docEle.clientWidth,
			_currentDocHeight = docEle.clientHeight;

		var _currentWindowWidth = window.innerWidth || _currentDocWidth,
			_currentWindowHeight = window.innerHeight || _currentDocHeight;

		var _isCurrentlyPortrait = isPortrait();

		util.env.refresh();
		var _isCurrentlyViewingInPCMode = util.env.isPc;

		/* 检测变化 */
		var ifChanges = false, changeDesc = [];

		/* 使用开发工具时，浏览模式的改变 */
		if(_isCurrentlyViewingInPCMode !== isCurrentlyViewingInPCMode){
			ifChanges = true;
			changeDesc.push("env");
		}

		/* 宽度的变化 */
		if(Math.abs(_currentWindowWidth - currentWindowWidth) > 0.5){
			ifChanges = true;
			changeDesc.push("width");
			changeDesc.push("width" + (_currentDocWidth > currentDocWidth? "+": "-"));
		}else if(Math.abs(_currentWindowHeight - currentWindowHeight) > 0.5){
			ifChanges = true;
			changeDesc.push("height");
			changeDesc.push("height" + (_currentWindowHeight > currentWindowHeight? "+": "-"));
		}

		currentDocWidth = _currentDocWidth;
		currentDocHeight = _currentDocHeight;

		currentWindowWidth = _currentWindowWidth;
		currentWindowHeight = _currentWindowHeight;

		isCurrentlyPortrait = _isCurrentlyPortrait;
		isCurrentlyViewingInPCMode = _isCurrentlyViewingInPCMode;

		if(ifChanges){
			globalLogger.debug("Resolution changes. Changed aspects: {}", changeDesc);
			execResolutionChangeCallbacks(changeDesc);
		}
	};

	updateState();
	setInterval(updateState, interval);

	var obj = {
		addChangeListener: addChangeListener
	};

	toolbox.set("resolution", obj);
})