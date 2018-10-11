;(function(ctx, name){
	var util = ctx[name].util,
		eventDrive = ctx[name].eventDrive;

	var NOT_SUPPLIED = {};

	var evtName = "fulfilled";
	var listenFlagAttr = util.randomString("__ViewWantedDataListenFlag__"),
		sepFlag = util.randomString("_@sep@_");

	/**
	 * 创建的实例集合
	 * @type {Object<String, ViewWantedData>}
	 */
	var instances = {};

	var WantedData = function(name){
		var data = NOT_SUPPLIED;

		eventDrive(this, this);
		var self = this;

		/**
		 * 索要数据
		 * @param {Function} callback 数据索要成功后执行的方法
		 * @param {Function} [notFulfilledCallback] 数据当前不存在时执行的方法
		 * @returns {WantedData}
		 */
		this.want = function(callback, notFulfilledCallback){
			if(this.isFulfilled()){
				util.try2Call(callback, null, data);
			}else
				util.try2Call(notFulfilledCallback);

			return this;
		};

		/**
		 * 添加数据监听，使得数据在被满足时执行相关方法
		 * @param {Function} callback 回调监听
		 */
		this.listen = function(callback){
			if(this.isFulfilled())
				util.try2Call(callback, null, data);

			if(typeof callback[listenFlagAttr] !== "function"){
				callback[listenFlagAttr] = function(e){
					util.try2Call(callback, null, e.data);
				};
			}
			self.on(evtName, callback[listenFlagAttr]);

			return this;
		};

		/**
		 * 提供数据
		 * @param {*} _data
		 * @returns {WantedData}
		 */
		this.fulfill = function(_data){
			data = _data;
			this.fire(evtName, _data);

			return this;
		};

		/**
		 * 判断数据是否存在
		 * @returns {boolean}
		 */
		this.isFulfilled = function(){
			return NOT_SUPPLIED !== data;
		}
	};

	var ViewWantedData = function(viewId){
		if(viewId in instances)
			throw new Error("Instance for view of id: " + viewId + " exists already.");

		var wanted = {};

		this.ofName = function(name){
			if(name in wanted)
				return wanted[name];

			wanted[name] = new WantedData(name);
			return wanted[name];
		};

		this.want = function(name, callback, notFulfilledCallback){
			var instance = this.ofName(name);
			return instance.want(callback, notFulfilledCallback);
		};

		this.listen = function(name, callback){
			var instance = this.ofName(name);
			return instance.listen(callback);
		};

		this.fulfill = function(name, data){
			var instance = this.ofName(name);
			return instance.fulfill(data);
		};

		this.isFulfilled = function(name){
			var instance = this.ofName(name);
			return instance.isFulfilled();
		};

		instances[viewId] = this;
	};

	ViewWantedData.ofName = function(viewId, name){
		if(viewId in instances)
			return instances[viewId].ofName(name);

		var instance = instances[viewId] = new ViewWantedData(viewId);
		return instance.ofName(name);
	};

	ctx[name].ViewWantedData = ViewWantedData;
})(window, "View");