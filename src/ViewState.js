;(function(ctx, name){
	var util = ctx[name].util,
		globalLogger = ctx[name].Logger.globalLogger;

	var prefix = "ViewState_";
	var flag = util.randomString(prefix);

	var defaultNamespace = "default";

	var stack = [], pos = -1;

	/**
	 * 使用给定的视图编号和视图选项构造地址栏字符串
	 */
	var concatViewOptions = function(viewId, namespace, options){
		var nspc = util.isEmptyString(namespace, true) || defaultNamespace === namespace? "": ("@" + String(namespace));

		/** 视图编号与参数集合之间的分隔符 */
		var sep = "!";

		var str = String(viewId) + nspc;
		var paramKeys = null == options? []: Object.keys(options);
		var tmp = paramKeys.reduce(function(start, e){
			return start + "&" + util.xEncodeURIComponent(e) + "=" + util.xEncodeURIComponent(options[e]);
		}, "");

		if(tmp.length > 0)
			str += sep + tmp.substring(1);

		return str;
	};

	/**
	 * 浏览状态
	 * @param {String} viewId 视图ID
	 * @param {String} viewNamespace 视图隶属的命名空间
	 * @param {String} [timeBasedUniqueString=util.getUniqueString()] 基于时间戳的浏览操作流水号
	 * @param {Object} options 选项集合
	 */
	var ViewState = function(viewId, viewNamespace, timeBasedUniqueString, options){
		if(arguments.length < 3)
			options = null;
		if(arguments.length < 2)
			timeBasedUniqueString = util.getUniqueString();
		timeBasedUniqueString = timeBasedUniqueString || util.getUniqueString();

		util.defineReadOnlyProperty(this, "viewId", viewId);
		util.defineReadOnlyProperty(this, "viewNamespace", viewNamespace);
		util.defineReadOnlyProperty(this, "sn", timeBasedUniqueString);
		util.defineReadOnlyProperty(this, "options", options);
		util.defineReadOnlyProperty(this, "flag", flag);

		this.toString = function(){
			return JSON.stringify(this);
		};

		this.clone = function(){
			return JSON.parse(this.toString());
		};
	};

	/**
	 * 判断特定的对象是否是ViewState的实例
	 * @param {Object} obj 要判断的对象
	 */
	ViewState.isConstructorOf = function(obj){
		if(null == obj || typeof obj !== "object")
			return false;

		return obj.hasOwnProperty("viewId") && obj.hasOwnProperty("sn") && String(obj.flag).startsWith(prefix);
	};

	/**
	 * 向history中添加view浏览历史
	 * @param {String} viewId 视图ID
	 * @param {String} viewNamespace 视图隶属的命名空间
	 * @param {String} [timeBasedUniqueString=util.getUniqueString()] 基于时间戳的视图压入堆栈的唯一标识
	 * @param {Object} [options=null] 选项集合
	 */
	ViewState.pushViewState = function(viewId, viewNamespace, timeBasedUniqueString, options){
		if(arguments.length < 4)
			options = null;
		if(arguments.length < 3)
			timeBasedUniqueString = util.getUniqueString();
		if(arguments.length < 2 || util.isEmptyString(viewNamespace, true))
			viewNamespace = defaultNamespace;

		timeBasedUniqueString = timeBasedUniqueString || util.getUniqueString();

		var state = new ViewState(viewId, viewNamespace, timeBasedUniqueString, options).clone();
		globalLogger.log("↓ {}", JSON.stringify(state));

		if(util.env.isHistoryPushPopSupported)
			history.pushState(state, "", "#" + concatViewOptions(viewId, viewNamespace, options));
		else
			location.hash = concatViewOptions(viewId, viewNamespace, options);

		stack.push(state);
		pos++;
		outputStack();

		View.currentState = state;
	};

	/**
	 * 更新history中最后一个view浏览历史
	 * @param {String} viewId 视图ID
	 * @param {String} viewNamespace 视图隶属的命名空间
	 * @param {String} [timeBasedUniqueString=util.getUniqueString()] 基于时间戳的视图更新堆栈的唯一标识
	 * @param {Object} [options=null] 选项集合
	 */
	ViewState.replaceViewState = function(viewId, viewNamespace, timeBasedUniqueString, options){
		if(arguments.length < 4)
			options = null;
		if(arguments.length < 3)
			timeBasedUniqueString = util.getUniqueString();
		if(arguments.length < 2 || util.isEmptyString(viewNamespace, true))
			viewNamespace = defaultNamespace;

		timeBasedUniqueString = timeBasedUniqueString || util.getUniqueString();

		var state = new ViewState(viewId, viewNamespace, timeBasedUniqueString, options).clone();
		globalLogger.log("% {}", JSON.stringify(state));

		if(util.env.isHistoryPushPopSupported)
			history.replaceState(state, "", "#" + concatViewOptions(viewId, viewNamespace, options));
		else
			location.hash = concatViewOptions(viewId, viewNamespace, options);

		if(0 === stack.length){
			stack.push(state);
			pos++;
		}else{
			var previous = stack[pos - 1],
				next = stack[pos + 1];
			if(null != previous && previous.sn === timeBasedUniqueString){/* 通过浏览器执行回退操作 */
				pos--;
			}else if(null != next && next.sn === timeBasedUniqueString){/* 通过浏览器执行前进操作 */
				pos++;
			}else{
				stack[pos] = state;
			}
			outputStack();
		}

		View.currentState = state;
	};

	/**
	 * 获取堆栈大小
	 * @returns {Number}
	 */
	ViewState.getStackSize = function(){
		return stack.length;
	};

	/**
	 * 根据当前位置确定是否可以向前返回
	 * @returns {Boolean}
	 */
	ViewState.ifCanGoBack = function(){
		return pos > 0;
	};

	var outputStack = function(){
		globalLogger.debug("View state stack: {}, {}", stack.map(function(v){return v.sn}), pos);
	};

	ctx[name].ViewState = ViewState;
})(window, "View");