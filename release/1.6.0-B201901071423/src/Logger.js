;(function(ctx, name){
	/** 日志输出组件 */
	var Logger = (function(){
		/**
		 * 填充字符串中的占位符："{}"。使用“\\”进行转义，以输出字符串：“{}”
		 * @param {String} arguments[0] 包含有占位符的源字符串
		 * @param {Any} arguments[1...n] 占位符取值。将使用String()方法转换输出
		 */
		var fillPlaceholders = function(){
			if(arguments.length == 0)
				return;

			var args = arguments;
			var str = " " + String(arguments[0]);
			var index = 1;
			str = str.replace(/([^\\])\{\}/g, function($0, $1){
				var value = (args.length - 1) < index? "{}": String(getNotion(args[index]));
				index++;
				return $1 + value;
			});
			str = str.replace(/\\\{\}/g, "{}");
			return str.substring(1);
		};

		/** 获取当前时间 */
		var getTime = function(){
			var time = new Date();
			var year = time.getFullYear();
			var month =  "0" + String(time.getMonth() + 1);
			month = month.substring(month.length - 2);
			var date =  "0" + String(time.getDate());
			date = date.substring(date.length - 2);
			var hours = "0" + String(time.getHours());
			hours = hours.substring(hours.length - 2);
			var minutes = "0" + String(time.getMinutes());
			minutes = minutes.substring(minutes.length - 2);
			var seconds = "0" + String(time.getSeconds());
			seconds = seconds.substring(seconds.length - 2);

			return month + date + " " + hours + ":" + minutes + ":" + seconds;
		};

		/**
		 * 获取指定对象的简略表达方式
		 */
		var getNotion = function(obj){
			if(null == obj)
				return null;

			if((typeof obj == "number") || (typeof obj == "string") || (typeof obj == "boolean"))
				return obj;
			else if(typeof obj == "function")
				return "function " + obj.name + "(){...}";
			else if(typeof obj == "object" && !Array.isArray(obj)){
				if(String(obj) != "[object Object]")/* 优先使用toString方法 */
					return String(obj);
				else{
					var _s = JSON.stringify(obj);
					if(_s != "{}")
						return _s;
					
					try{
						var tmp = {};
						for(var p in obj)
							tmp[p] = getNotion(obj[p]);
						return JSON.stringify(tmp);
					}catch(e){
						return _s;
					}
				}
			}else if(obj instanceof Array)
				return "[" + obj.map(function(ele){
					return getNotion(ele);
				}).join(", ") + "]";
			else
				return obj;
		};

		/** 获取日志前缀 */
		var getLogPrefix = function(name){
			return getTime() + " [" + name + "]: ";
		};

		var loggers = {};

		/** 获取，及设置日志输出状态全局状态的方法 */
		var isGloballyEnabled, setIsGloballyEnabled;
		;(function(){
			var flag = true;

			isGloballyEnabled = function(){
				return flag;
			};

			setIsGloballyEnabled = function(v){
				flag = v;
			};
		})();

		/**
		 * @constructor
		 * 日志输出组件
		 */
		var Logger = function(name){
			var isEnabled = true;

			/**
			 * 判断日志组件是否启用
			 * @return {Boolean} 当前对象日志输出是否启用
			 */
			this.isEnabled = function(){
				return isGloballyEnabled() && isEnabled;
			};

			/**
			 * 设置日志输出的启用状态
			 * @param {Boolean} v 是否启用
			 */
			this.setIsEnabled = function(v){
				isEnabled = v;
				return this;
			};

			/**
			 * 获取日志组件名称
			 */
			this.getName = function(){
				return name;
			};

			this.debug = function(){
				if(!this.isEnabled())
					return;

				var msg = fillPlaceholders.apply(null, arguments);
				console.debug(getLogPrefix(name) + msg);
			};

			this.info = function(){
				if(!this.isEnabled())
					return;

				var msg = fillPlaceholders.apply(null, arguments);
				console.info(getLogPrefix(name) + msg);
			};

			this.warn = function(){
				if(!this.isEnabled())
					return;

				var msg = fillPlaceholders.apply(null, arguments);
				console.warn(getLogPrefix(name) + msg);
			};

			this.error = function(){
				if(!this.isEnabled())
					return;

				var msg = fillPlaceholders.apply(null, arguments);
				console.error(getLogPrefix(name) + msg);
			};

			this.log = function(){
				if(!this.isEnabled())
					return;

				var msg = fillPlaceholders.apply(null, arguments);
				console.log(getLogPrefix(name) + msg);
			};
		};

		/**
		 * 获取指定名称的logger。如果相同名称的实例已经存在，则返回既有的实例。如果不存在，则自动创建一个
		 * @param {String} name 名称
		 */
		var ofName = function(name){
			if(name in loggers)
				return loggers[name];

			var instance = new Logger(name);
			loggers[name] = instance;

			return instance;
		};
		Logger.ofName = ofName;

		Logger.isGloballyEnabled = isGloballyEnabled;
		Logger.setIsGloballyEnabled = setIsGloballyEnabled;

		return Logger;
	})();

	Logger.globalLogger = Logger.ofName("View");

	ctx[name].Logger = Logger;
})(window, "View");