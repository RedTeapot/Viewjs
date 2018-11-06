;(function(ctx, name){
	var util = ctx[name].util;
	var ViewConfiguration = ctx[name].ViewConfiguration;

	/**
	 * 视图配置集合
	 * @param {String} viewId 关联的视图编号
	 * @param {String} viewNamespace 视图隶属的命名空间
	 */
	var ViewConfigurationSet = function ViewConfigurationSet(viewId, viewNamespace){
		/** 配置项集合。key：配置项名称；value：ViewConfiguration */
		var configs = {};

		/**
		 * 判断特定名称的配置项是否存在
		 * @param {String} key 配置项名称
		 */
		this.has = function(key){
			return key in configs;
		};

		/**
		 * 获取指定名称对应的配置项，如果对应的配置项不存在，则自动创建一个
		 * @param {String} key 配置项名称
		 */
		this.get = function(key){
			var c;
			if(key in configs)
				c = configs[key];
			else{
				c = new ViewConfiguration(key, viewId, viewNamespace);
				configs[key] = c;
			}

			return c;
		};

		/**
		 * 应用所有配置
		 */
		this.applyAll = function(){
			var items = Object.keys(configs).map(function(k){
				return configs[k];
			});
			if(0 == items.length)
				return;
			
			setTimeout(function(){
				for(var i = 0; i < items.length; i++){
					var c = items[i];
					util.try2Call(c.apply, c);
				}
			}, 0);

			return this;
		};

		/**
		 * 列举所有的配置项名称
		 */
		this.listAll = function(){
			return Object.keys(configs);
		};
	};


	ctx[name].ViewConfigurationSet = ViewConfigurationSet;
})(window, "View");