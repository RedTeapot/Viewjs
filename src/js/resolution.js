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
	 */
	var addChangeListener = function(callback){
		if(changeCallbacks.indexOf(callback) !== -1)
			return;

		changeCallbacks.push(callback);
	};

	/**
	 * 执行监听回调
	 */
	var execResolutionChangeCallbacks = function(e){
		for(var i = 0; i < changeCallbacks.length; i++)
			util.try2Call(changeCallbacks[i], null, e);
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
		}else if(_currentWindowHeight - currentWindowHeight > 0.5){/* 宽度不变，高度变大（虚拟键盘的消失）。暂不处理虚拟键盘弹出，导致浏览窗口变小的现象（对于固定显示在底部的元素，处理后效果较差，效果等同于绝对定位） */
			ifChanges = true;
			changeDesc.push("height+");
		}

		currentDocWidth = _currentDocWidth;
		currentDocHeight = _currentDocHeight;

		currentWindowWidth = _currentWindowWidth;
		currentWindowHeight = _currentWindowHeight;

		isCurrentlyPortrait = _isCurrentlyPortrait;
		isCurrentlyViewingInPCMode = _isCurrentlyViewingInPCMode;

		if(ifChanges){
			globalLogger.debug("Resolution changes. Changed aspects: {}", changeDesc);
			execResolutionChangeCallbacks();
		}
	};

	updateState();
	setInterval(updateState, interval);

	var obj = {
		addChangeListener: addChangeListener
	};

	toolbox.set("resolution", obj);
})