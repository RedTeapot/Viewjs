;(function(ctx, name){
	var util = ctx[name].util;
	
	/**
	 * 浏览状态
	 * @param {String} viewId 视图ID
	 * @param {String} viewNamespace 视图隶属的命名空间
	 * @param {String} [timeBasedUniqueString=util.getUniqueString()] 基于时间戳的浏览操作流水号
	 * @param {Object} options 选项集合
	 */
	var ViewState = (function(){
		var prefix = "ViewState_";
		var flag = util.randomString(prefix);

		var Clazz = function(viewId, viewNamespace, timeBasedUniqueString, options){
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
		Clazz.isConstructorOf = function(obj){
			if(null == obj || typeof obj !== "object")
				return false;

			return obj.hasOwnProperty("viewId") && obj.hasOwnProperty("sn") && String(obj.flag).startsWith(prefix);
		};

		return Clazz;
	})();


	ctx[name].ViewState = ViewState;
})(window, "View");