;(function(name){
	var ctx;
	if(typeof window !== "undefined")
		ctx = window;
	else if(typeof global !== "undefined")
		ctx = global;
	else if(typeof self !== "undefined")
		ctx = self;
	else
		ctx = this;

	if(name in ctx){
		console.error("Plugin name: 'View' has already been used");
		return;
	}

	/**
	 * 命名空间，用于存储所有独立的模块
	 */
	var namespace = {};


	var _has = function(key){
		return key in namespace;
	};

	var _set = function(key, value){
		if(key in namespace)
			throw new Error("Internal error: Key: '" + key + "' has already been used");

		namespace[key] = value;
	};

	var _get = function(key){
		return namespace[key];
	};

	var _expose = function(entrance){
		if(typeof define === "function" && define.amd){
			try{
				define([name], factory());
				return;
			}catch(e){}
		}

		if(typeof module === "object" && null != module && module.exports){
			try{
				module.exports = factory();
				return;
			}catch(e){}
		}

		ctx[name] = entrance;
	};

	var toolbox = {
		has: _has,
		set: _set,
		get: _get,
		expose: _expose
	};

	_expose(function(fn){
		if(typeof fn === "function")
			try{
				fn(toolbox);
			}catch(e){console.error(e);}
	});
})("View")