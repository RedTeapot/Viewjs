;(function(ctx, name){
	/**
	 * 为指定的对象添加事件驱动机制
	 * @param {Object} obj 要添加事件驱动机制的对象
	 * @param {Object} ctx 监听器触发时的this上下文
	 */
	var eventDrive = (function(){
		/**
		 * @constructor
		 *
		 * 事件
		 * @param type {String} 事件类型（名称）
		 * @param data {JSON} 需要传递至监听器的数据
		 */
		var Event = function(type, data){
			this.type = type;
			this.timestamp = new Date().getTime();
			this.data = data;

			Object.freeze && Object.freeze(this);
		};

		return function(obj, ctx){
			/* 所有事件处理器。key为事件类型字符串（全小写），value为对应添加的事件处理器数组 */
			var eventHandlers = {};

			var build = function(type){
				eventHandlers[type] = eventHandlers[type] || [];
			};

			/**
			 * 添加事件监听器
			 * @param {String} type 事件类型。可以同时传入多个类型，多个类型之间使用英文半角逗号分隔
			 * @param {Function} handler 事件处理器
			 */
			obj.on = function(type, handler){
				var types = String(type).replace(/(\s*,){2,}/, ",").toLowerCase().split(/\s*,\s*/);
				types.forEach(function(_type){
					build(_type);
					if(eventHandlers[_type].indexOf(handler) != -1)
						return;

					/* 加入列表 */
					eventHandlers[_type].push(handler);
				});
			};

			/**
			 * 移除事件监听器
			 * @param {String} type 事件类型。可以同时传入多个类型，多个类型之间使用英文半角逗号分隔
			 * @param {Function} handler 事件处理器
			 */
			obj.off = function(type, handler){
				var types = String(type).replace(/(\s*,){2,}/, ",").toLowerCase().split(/\s*,\s*/);
				types.forEach(function(_type){
					build(_type);
					var index = eventHandlers[_type].indexOf(handler);
					if(index == -1)
						return;

					/* 加入列表 */
					eventHandlers[_type].splice(index, 1);
				});
			};

			/**
			 * 触发事件
			 * @param {String} type 事件类型。可以同时传入多个类型，多个类型之间使用英文半角逗号分隔
			 * @param data {Any} 附加的数据。亦即，需要传递至监听器的数据
			 * @param [async=true] {Boolean} 是否以异步的方式执行处理器
			 */
			obj.fire = function(type, data, async){
				if(arguments.length < 3)
					async = true;

				var types = String(type).replace(/(\s*,){2,}/, ",").toLowerCase().split(/\s*,\s*/);
				types.forEach(function(_type){
					/** 创建事件 */
					var event = new Event(_type, data);

					/** 触发监听器 */
					var t = function(){
						build(_type);
						for(var i = 0; i < eventHandlers[_type].length; i++){
							var handler = eventHandlers[_type][i];
							if(typeof handler != "function")
								continue;

							try{
								handler.call(ctx, event)
							}catch(e){
								console.error(e, e.stack);
							}
						};
					};

					if(async)
						setTimeout(t, 0);
					else
						t();
				});
			};
		};
	})();


	ctx[name].eventDrive = eventDrive;
})(window, "View");