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
		 * @returns {Boolean}
		 */
		this.has = function(name){
			return name in obj;
		};
		
		/**
		 * 设置属性。如果相同名称的属性已经存在，则覆盖。
		 * @param {String} name 属性名称
		 * @param {*} value 属性取值
		 * @returns {ViewContext}
		 */
		this.set = function(name, value){
			obj[name] = value;
			return this;
		};
		
		/**
		 * 获取指定名称的属性。如果属性不存在，则返回undefined
		 * @param {String} name 属性名称
		 * @returns {*}
		 */
		this.get = function(name){
			return obj[name];
		};
		
		/**
		 * 移除指定名称的属性，并返回既有的属性值
		 * @param {String} name 属性名称
		 * @returns {*} 既有取值
		 */
		this.remove = function(name){
			var value = obj[name];
			delete obj[name];
			return value;
		};
		
		/**
		 * 清空所有属性
		 * @returns {ViewContext}
		 */
		this.clear = function(){
			for(var p in obj)
				delete obj[p];
			return this;
		};

		/**
		 * 列举所有属性名
		 * @returns {String[]}
		 */
		this.listKeys = function(){
			return Object.keys(obj);
		};

		/**
		 * 获取属性个数
		 * @returns {Number}
		 */
		this.size = function(){
			var c = 0;
			for(var p in obj)
				c++;

			return c;
		};

		Object.freeze(this);
	};


	ctx[name].ViewContext = ViewContext;
})(window, "View");