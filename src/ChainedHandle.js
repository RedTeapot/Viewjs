;(function(ctx, name){
	var util = ctx[name].util,
		Logger = ctx[name].Logger;

	var globalLogger = Logger.globalLogger;

	/**
	 * @type {Object<String, ChainedHandle>}
	 */
	var instances = {};

	/**
	 * @callback NamedHandle 链式处理器中的单个处理器
	 * @param {Function} resolve 处理成功回调
	 * @param {Function} reject 处理失败回调
	 */

	/**
	 * 链式处理器
	 * @param {String} name 处理器名称
	 */
	var ChainedHandle = function ChainedHandle(name){
		var sequence = [];

		var context = {};

		var handles = {};

		var isExecuting = false;

		/**
		 * 获取链式处理器的名称
		 * @returns {String}
		 */
		this.getName = function(){
			return name;
		};

		/**
		 * 设置处理器的先后顺序
		 * @param {String[]} _sequence 处理器名称列表。名称索引越小，其对应的处理器将越优先执行
		 * @returns {ChainedHandle}
		 */
		this.setSequence = function(_sequence){
			if(isExecuting){
				globalLogger.error("Sequence is prohibited to change while executing.");
				return this;
			}

			if(!Array.isArray(_sequence))
				return this;

			_sequence = _sequence.map(function(handleName){
				return null == handleName? "": String(handleName).trim().toLowerCase();
			}).reduce(function(rst, handleName){
				if(!util.isEmptyString(handleName, true) && rst.indexOf(handleName) === -1)
					rst.push(handleName);

				return rst;
			}, []);
			sequence = _sequence;

			return this;
		};

		/**
		 * 向上下文中设置属性
		 * @param {String} name 属性名称。区分大小写
		 * @param {*} value 属性值
		 * @returns {ChainedHandle}
		 */
		this.setProperty = function(name, value){
			context[String[name]] = value;
			return this;
		};

		/**
		 * 向上下文中批量设置多个属性
		 * @param {Object} props 属性集合
		 * @returns {ChainedHandle}
		 */
		this.setProperties = function(props){
			if(null == props || typeof props !== "object")
				return this;

			for(var p in props)
				this.setProperty(p, props[p]);

			return this;
		};

		/**
		 * 从上下文中读取属性。如果给定的属性名称不存在，则返回设定的默认值
		 * @param {String} name 属性名称。区分大小写
		 * @param {*} dftValue 属性名称不存在时需要使用的取值
		 * @returns {*}
		 */
		this.getProperty = function(name, dftValue){
			name = String(name);
			if(name in context)
				return context[name];

			if(arguments.length > 1)
				return dftValue;
			return null;
		};

		/**
		 * 设置处理器
		 * @param {String} handleName 处理器名称
		 * @param {NamedHandle} handle 处理器
		 */
		this.setHandle = function(handleName, handle){
			if(isExecuting){
				globalLogger.error("Handle is prohibited to change while executing.");
				return this;
			}

			handles[String(handleName).toLowerCase()] = handle;
			return this;
		};

		/**
		 * 开始执行链式处理器中的每个处理器。处理过程中不允许修改顺序
		 * @returns {Promise}
		 */
		this.exec = function(){
			globalLogger.debug("Executing chained handle: {}", name);

			isExecuting = true;

			var resolveFinalPromise, rejectFinalPromise;
			var finalPromise = new Promise(function(resolve, reject){
				resolveFinalPromise = resolve;
				rejectFinalPromise = reject;
			});

			finalPromise.then(function(){
				isExecuting = false;
			}, function(){
				isExecuting = false;
			});

			if(sequence.length === 0){
				resolveFinalPromise();
				return finalPromise;
			}

			var execHandle = function(index){
				if(index >= sequence.length){
					resolveFinalPromise();
					return;
				}

				var promise = new Promise(function(resolve, reject){
					var handleName = sequence[index];
					var handle = handles[handleName];

					globalLogger.debug("Executing handle: {}", handleName);

					/* 如果在顺序中设定的处理器不存在，则跳过该处理器 */
					if(null == handle){
						resolve();
						return;
					}

					try{
						handle(resolve, function(err){
							var msg = "Handle of name: " + handleName + "rejects";
							if(arguments.length > 1)
								globalLogger.error(msg, err);
							else
								globalLogger.error(msg);

							reject(err);
						});
					}catch(e){
						globalLogger.error("Error occurred while executing handle of name: " + handleName);
						console.error(e);
						reject(e);
					}
				});

				promise.then(function(){
					execHandle(index + 1);
				}, rejectFinalPromise);
			};

			execHandle(0);
			return finalPromise;
		};
	};

	/**
	 * 获取指定名称的链式处理器。如果对应实例尚不存在，则自动创建一个
	 * @param {String} name 处理器名称
	 * @returns {ChainedHandle}
	 */
	ChainedHandle.ofName = function(name){
		var instance = instances[name];
		if(null == instance)
			instance = instances[name] = new ChainedHandle(name);

		return instance;
	};

	ctx[name].ChainedHandle = ChainedHandle;
})(window, "View");