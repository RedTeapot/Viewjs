;(function(ctx, name){
	var util = ctx[name].util;

	/**
	 * 视图上下文
	 */
	var ViewContext = function ViewContext(){
		var obj = {};

		/**
		 * 判定上下文中是否含有指定名称的键
		 * @param {String} name 名称
		 */
		util.defineReadOnlyProperty(this, "has", function(name){
			return name in obj;
		});
		
		/**
		 * 设置属性。如果相同名称的属性已经存在，则覆盖。
		 * @param {String} name 属性名称
		 * @param {Any} value 属性取值
		 */
		util.defineReadOnlyProperty(this, "set", function(name, value){
			obj[name] = value;
			return this;
		});
		
		/**
		 * 获取指定名称的属性。如果属性不存在，则返回undefined
		 * @param {String} name 属性名称
		 */
		util.defineReadOnlyProperty(this, "get", function(name){
			return obj[name];
		});
		
		/**
		 * 移除指定名称的属性，并返回既有的属性值
		 * @param {String} name 属性名称
		 * @returns {Any} 既有取值
		 */
		util.defineReadOnlyProperty(this, "remove", function(name){
			var value = obj[name];
			delete obj[name];
			return value;
		});
		
		/**
		 * 清空所有属性
		 */
		util.defineReadOnlyProperty(this, "clear", function(){
			obj = {};
			return this;
		});
	};


	ctx[name].ViewContext = ViewContext;
})(window, "View");