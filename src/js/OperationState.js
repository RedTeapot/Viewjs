;(function(ctx, name){
	var util = ctx[name].util;
	
	/**
	 * 操作状态
	 * @param {String} serialNumber 操作流水
	 * @param {String} [timeBasedUniqueString=util.getUniqueString()] 基于时间戳的操作流水号
	 */
	var OperationState = (function(){
		var prefix = "OperationState_";
		var flag = util.randomString(prefix);

		var Clazz = function(serialNumber, timestamp){
			if(arguments.length < 2)
				timeBasedUniqueString = util.getUniqueString();
			timeBasedUniqueString = timeBasedUniqueString || util.getUniqueString();

			util.defineReadOnlyProperty(this, "serialNumber", serialNumber);
			util.defineReadOnlyProperty(this, "sn", timeBasedUniqueString);
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
		 * @param {JsonObject} obj 要判断的对象
		 */
		Clazz.isConstructorOf = function(obj){
			if(null == obj || typeof obj != "object")
				return false;

			return obj.hasOwnProperty("serialNumber") && obj.hasOwnProperty("sn") && util.startsWith(obj.flag, prefix);
		};

		/* 最近一次操作的状态 */
		var currentState = null;

		/* 操作集合 */
		var callbacks = {};

		/**
		 * 压入操作堆栈
		 */
		Clazz.pushState = function(serialNumber, callback){
			var state = new OperationState(serialNumber).clone();
	
			history.pushState(state, "", "");
			currentState = state;

			callbacks[serialNumber] = callback;
		};

		window.addEventListener("popstate", function(e){
			if(Clazz.isConstructorOf(currentState)){
				var isBack = e.state && e.state.sn && e.state.sn < currentState.sn;
				var callback = callbacks[currentState.serialNumber];
				if(isBack && null != callback){
					util.try2Call(callback);
					delete callbacks[currentState.serialNumber];
				}
			}

			var state = e.state;
			currentState = Clazz.isConstructorOf(state)? state: null;
		});

		return Clazz;
	})();


	ctx[name].OperationState = OperationState;
})(window, "View");