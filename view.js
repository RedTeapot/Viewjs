;window.View = (function(){
	var historyPushPopSupported = ("pushState" in history) && (typeof history.pushState == "function");
	console.log("history.pushState is " + (historyPushPopSupported? "": "not ") + "supported");
	
	/**
	 * 设定参数默认值
	 * @param ops {Json} 要设定默认值的目标
	 * @param dftOps {Json} 提供的默认值配置
	 */
	var setDftValue = function(ops, dftOps){
		ops = ops || {};
		dftOps = dftOps || {};
		
		/* 参数不存在时，从默认参数中读取并赋值 */
		for(var p in dftOps)
		if(!(p in ops))
			ops[p] = dftOps[p];

		return ops;
	};
	
	/**
	 * 为指定的对象添加事件驱动机制
	 * @param obj 要添加事件驱动机制的对象
	 * @param ctx 监听器触发时的this上下文
	 */
	var eventDrive = function(obj, ctx){
		(function(obj){
			/* 所有事件处理器。key为事件类型字符串（全小写），value为对应添加的事件处理器数组 */
			var eventHandlers = {};
			
			/**
			 * 添加事件监听器
			 * @param type 事件类型
			 * @param handler 事件处理器
			 */
			obj.on = function(type, handler){
				type = type.toLowerCase();
				
				eventHandlers[type] = eventHandlers[type] || [];
				if(eventHandlers[type].indexOf(handler) != -1)
					return;
				
				/* 加入列表 */
				eventHandlers[type].push(handler);
			};
			
			/**
			 * 移除事件监听器
			 * @param type 事件类型
			 * @param handler 事件处理器
			 */
			obj.off = function(type, handler){
				type = type.toLowerCase();
					
				eventHandlers[type] = eventHandlers[type] || [];
				var index = eventHandlers[type].indexOf(handler);
				if(index == -1)
					return;
				
				/* 加入列表 */
				eventHandlers[type].splice(index, 1);
			};
			
			/**
			 * 触发事件
			 * @param type {String} 事件类型（名称）
			 * @param data 需要传递至监听器的数据
			 */
			obj.fire = function(type, data){
				type = type.toLowerCase();
				
				/** 创建事件 */
				var event = new Event(type, data);
				
				/** 触发监听器 */
				eventHandlers[type] = eventHandlers[type] || [];
				eventHandlers[type].forEach(function(handler){
					handler.call(ctx, event);
				});
			};
		})(obj, ctx);
	};
	
	/**
	 * 向history中添加view浏览历史
	 * @param viewId 视图ID
	 */
	var pushViewState = function(viewId){
		history.pushState({viewId: viewId, timestamp: Date.now()}, "", "#" + viewId);
	};
	
	/**
	 * 更新history中最后一个view浏览历史
	 * @param viewId 视图ID
	 */
	var replaceViewState = function(viewId){
		history.replaceState({viewId: viewId, timestamp: Date.now()}, "", "#" + viewId);
	};
	
	/**
	 * 视图不存在错误
	 */
	var ViewNotExistError = function(msg){
		Error.call(this, msg);
	};
	ViewNotExistError.prototype = Object.create(Error.prototype);
	
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
	
	/**
	 * 视图类
	 * @param id {String} 视图对应的DOM元素的id
	 */
	var View = function(id){
		if(null == document.querySelector("#" + id + "[data-view=true]")){
			throw new ViewNotExistError("View of id: " + id + " does not exist(No element matching pattern: '#" + id + "[data-view=true]' found)!");
		}
		
		/** 上下文，用于存储视图相关的数据等 */
		var context = {};
		
		/**
		 * 启用事件驱动机制
		 * 事件 enter：当前视图变为活动视图时触发
		 * 事件 ready：当前视图变为活动视图时，且enter事件触发后触发
		 * 事件 leave：当前视图由活动视图变为非活动视图时触发
		 */
		eventDrive(this, document.querySelector("#" + id));
		
		/**
		 * 当前视图由活动视图变为非活动视图时执行的动画方法
		 * @param targetViewId {String} 新的活动视图的ID
		 * @param type {String} 当前视图是如何由活动视图变为非活动视图
		 * 		"history.back"：由浏览器的回退操作引起；
		 * 		"history.forward"：由浏览器的前进操作引起；
		 * 		"view.switch"：由本插件的切换操作引起
		 * @param render {Function} 本插件在切换视图时执行的界面渲染操作。在使用切换动画时，在动画执行完毕后需要手动执行本方法，否则界面渲染可能不正常。
		 */
		var leaveAnimation = function(targetViewId, type, render){/*render();*/};
		/**
		 * 当前视图变为活动视图时执行的动画方法
		 * @param sourceViewId {String} 原来的的活动视图的ID
		 * @param type {String} 当前视图是如何变为活动视图
		 * 		"history.back"：由浏览器的回退操作引起；
		 * 		"history.forward"：由浏览器的前进操作引起；
		 * 		"view.switch"：由本插件的切换操作引起
		 * @param render {Function} 本插件在切换视图时执行的界面渲染操作。在使用切换动画时，在动画执行完毕需要必手动执行本方法，否则界面渲染可能不正常。
		 */
		var enterAnimation = function(sourceViewId, type, render){render();};
		
		/**
		 * 返回视图对应的DOM元素的ID
		 */
		this.getId = function(){
			return id;
		};
		
		/**
		 * 获取视图对应的DOM元素
		 */
		this.getDomElement = function(){
			return document.querySelector("#" + id);
		};
		
		/**
		 * 获取视图上下文
		 */
		this.getContext = function(){
			return context;
		};
		
		/**
		 * 清除视图上下文
		 */
		this.clearContext = function(){
			context = {};
		};
		
		/**
		 * 判断当前视图是否为活动视图
		 */
		this.isActive = function(){
			return this.getDomElement().classList.contains("active");
		};
		
		/**
		 * 判断当前视图是否为默认视图
		 */
		this.isDefault = function(){
			return /true/i.test(this.getDomElement().getAttribute("data-view-default"));
		};
		
		/**
		 * 判断当前视图是否可以通过地址栏直接访问
		 */
		this.isDirectlyAccessible = function(){
			var keep = document.documentElement.getAttribute("data-view-directly-accessible");
			keep = null == keep? "false": keep;
			keep = keep.toLowerCase();
			
			var directAccessable = false;
			if("true" == keep){/** 如果设定全部可以直接访问 */
				/** 判定视图是否可以直接访问 */
				if("false" == this.getDomElement().getAttribute("data-view-directly-accessible"))
					directAccessable = false;
				else
					directAccessable = true;
			}else{
				/** 判定视图是否可以直接访问 */
				if("true" == this.getDomElement().getAttribute("data-view-directly-accessible"))
					directAccessable = true;
				else
					directAccessable = false;
			}
			
			return directAccessable;
		};
		
		/**
		 * 获取视图不能访问时需要呈现的视图
		 * 如果指定的视图不存在，则返回默认视图
		 */
		this.getFallbackView = function(){
			var view = this;
			var idChain = [this.getId()];
			
			do{
				/** 如果视图可以直接访问，则返回自身 */
				if(view.isDirectlyAccessible())
					return view;
				
				/** 取出配置的视图 */
				var fallbackViewId = this.getDomElement().getAttribute("data-view-fallback");
				/** 判断是否配置且配置的视图是否存在 */
				if(null == fallbackViewId || !View.isExisting(fallbackViewId)){
					console.warn("View: " + this.getId() + " is not permited to access directly, and no fallback configuration found, thus returning the default view");
					return View.getDefaultView();
				}else{
					view = View.ofId(fallbackViewId);
					
					if(idChain.indexOf(view.getId()) != -1){/** 循环引用 */
						console.error("cyclical reference of view on fallback configuration on view: " + this.getId());
						return View.getDefaultView();
					}
						
					idChain.push(fallbackViewId);
				}
			}while(true);
		};
		
		/**
		 * 设定视图由活动视图变为非活动视图时执行的动画
		 * @param animation {Function} 视图由活动视图变为非活动视图时执行的动画
		 */
		this.setLeaveAnimation = function(animation){
			leaveAnimation = animation;
		};
		
		/**
		 * 获取视图由活动视图变为非活动视图时执行的动画
		 */
		this.getLeaveAnimation = function(){
			return leaveAnimation;
		};
		
		/**
		 * 设定视图变为活动视图时执行的动画
		 * @param animation {Function} 视图变为活动视图时执行的动画
		 */
		this.setEnterAnimation = function(animation){
			enterAnimation = animation;
		};
		
		/**
		 * 获取视图变为活动视图时执行的动画
		 */
		this.getEnterAnimation = function(){
			return enterAnimation;
		};
		
		Object.freeze && Object.freeze(this);
	};
	
	/**
	 * 常量定义
	 */
	/** 视图切换操作类型：由浏览器前进操作触发 */
	View.SWITCHTYPE_HISTORYFORWARD = "history.forward";
	/** 视图切换操作类型：由浏览器后退操作触发 */
	View.SWITCHTYPE_HISTORYBACK = "history.back";
	/** 视图切换操作类型：由视图切换操作触发 */
	View.SWITCHTYPE_VIEWSWITCH = "view.switch";
	
	
	/** 通过文档扫描得出的配置的视图集合 */
	var viewInstances = [];
	
	/* history的最近一次状态 */
	View.currentState = null;
	
	/**
	 * 启用事件驱动机制
	 * 事件 beforechange：视图切换前触发
	 * 事件 afterchange：视图切换后触发
	 */
	eventDrive(View);
	
	/**
	 * 查找给定ID对应的视图实例，如果不存在则创建，否则返回已经存在的实例
	 * @param id
	 */
	View.ofId = function(id){
		for(var i = 0; i < viewInstances.length; i++)
			if(viewInstances[i].getId().toLowerCase().trim() == id.toLowerCase().trim())
				return viewInstances[i];
		
		/* 创建实例 */
		var instance = new View(id);
		
		/* 加入到管理集合中 */
		viewInstances.push(instance);
		
		return instance;
	};
	
	/**
	 * 判断指定ID的视图是否存在
	 * @param id 视图ID
	 */
	View.isExisting = function(id){
		for(var i = 0; i < viewInstances.length; i++)
			if(viewInstances[i].getId().toLowerCase().trim() == id.toLowerCase().trim())
				return true;
		
		return false;
	};
	
	/**
	 * 返回当前活动的视图
	 */
	View.getActiveView = function(){
		for(var i = 0; i < viewInstances.length; i++)
			if(viewInstances[i].isActive())
				return viewInstances[i];
		
		return null;
	};
	
	/**
	 * 返回默认视图
	 */
	View.getDefaultView = function(){
		for(var i = 0; i < viewInstances.length; i++)
			if(viewInstances[i].isDefault())
				return viewInstances[i];
		
		return null;
	};
	
	/**
	 * 切换视图
	 * @param targetViewId 目标视图ID
	 * @param type 切换操作类型（View.SWITCHTYPE_HISTORYFORWARD || View.SWITCHTYPE_HISTORYBACK || View.SWITCHTYPE_VIEWSWITCH）
	 * @param withAnimation 是否执行动画
	 */
	View.switchView = function(targetViewId, type, withAnimation){
		/* 当前活动视图 */
		var currentView = View.getActiveView();
		if(arguments.length < 3)
			withAnimation = true;
		if(arguments.length < 2)
			type = View.SWITCHTYPE_VIEWSWITCH;
		type = type || View.SWITCHTYPE_VIEWSWITCH;
		
		if("" == targetViewId.trim()){
			if(null == View.getDefaultView())
				return;
			else
				targetViewId = View.getDefaultView().getId();
		}
		
		/** 检查目标视图是否存在 */
		if(!View.isExisting(targetViewId)){
			console.error("target view: " + targetViewId + " does not exist!");
			return;
		}
		
		console.log(currentView.getId() + " -> " + targetViewId, type);
		
		/* 如果切换目标是自己，则直接返回 */
		if(currentView.getId().toLowerCase() == targetViewId.toLowerCase())
			return;
		
		/** 触发前置切换监听器 */
		View.fire("beforechange", {currentView: currentView, targetView: targetView, type: type});
		
		/* 目标视图 */
		var targetView = View.ofId(targetViewId);
		type = (type.toLowerCase() == View.SWITCHTYPE_HISTORYFORWARD? View.SWITCHTYPE_HISTORYFORWARD: (
				type.toLowerCase() == View.SWITCHTYPE_HISTORYBACK? View.SWITCHTYPE_HISTORYBACK: View.SWITCHTYPE_VIEWSWITCH));
		
		var display = function(){
			currentView.getDomElement().classList.remove("active");
			targetView.getDomElement().classList.add("active");
		};
		
		/* 执行切换操作 */
		currentView.fire("leave", type);
		if(!withAnimation){
			display();
			targetView.fire("enter", type);
			targetView.fire("ready", type);
		}else{
			currentView.getLeaveAnimation() && currentView.getLeaveAnimation().call(currentView.getDomElement(), targetViewId, type, display);
			targetView.getEnterAnimation() && targetView.getEnterAnimation().call(targetView.getDomElement(), currentView.getId(), type, function(){/* animation */
				display();
				
				targetView.fire("enter", type);
				targetView.fire("ready", type);
			});
		}
		
		/** 触发后置切换监听器 */
		View.fire("afterchange", {currentView: currentView, targetView: targetView, type: type});
	};
	
	/**
	 * 切换视图，同时更新相关状态
	 * @param targetViewId 目标视图ID
	 * @param type 切换操作类型（View.SWITCHTYPE_HISTORYFORWARD || View.SWITCHTYPE_HISTORYBACK || View.SWITCHTYPE_VIEWSWITCH）
	 */
	View.updateView = function(targetViewId, type){
		var state = {viewId: targetViewId, timestamp: Date.now()};
		
		/** 伪视图支持 */
		/* 回退操作(":back") */
		if(":back" == targetViewId.toLowerCase().trim()){
			history.go(-1);/* browser support */
			
			return;
		}
		/* 前进操作（":forward"） */
		if(":forward" == targetViewId.toLowerCase().trim()){
			history.go(1);/* browser support */
			
			return;
		}
		
		/** 检查目标视图是否存在 */
		if(!View.isExisting(targetViewId)){
			console.error("target view: " + targetViewId + " does not exist!");
			return;
		}
		
		View.currentState = state;
		
		if(historyPushPopSupported){
			pushViewState(targetViewId);
			
			console.log("pushed state by update view", state);
		}else
			location.hash = targetViewId;
		
		View.switchView(targetViewId, type);
	};
	
	/**
	 * 响应地址栏的hash进行渲染操作
	 */
	var stateChangeListener =  function(e){
		var currentActiveView = View.getActiveView();
		
		console.log(historyPushPopSupported? "state poped!": "hash changed!", "current: " + currentActiveView.getId());
		historyPushPopSupported && console.log("poped state", JSON.stringify(e.state));
		
		var tarId, type = View.SWITCHTYPE_VIEWSWITCH, targetView = null;;
		if(!historyPushPopSupported || null == e.state){
			tarId = location.hash.replace(/^#/, "").toLowerCase();
			
			if("" == tarId){/** 判断是否指定目标视图 */
				targetView = View.getDefaultView();
			}else if(!View.isExisting(tarId)){/** 判断指定的视图是否存在 */
				targetView = View.getDefaultView();
			}else if(View.ofId(tarId).isDirectlyAccessible())/** 判断指定的视图是否支持直接访问 */
				targetView = View.ofId(tarId);
			else
				targetView = View.ofId(tarId).getFallbackView();
						
			type = View.SWITCHTYPE_VIEWSWITCH;
		}else{
			var popedNewState = e.state;
		
			tarId = popedNewState.viewId;
			if(null == tarId || !View.isExisting(tarId))
				targetView = View.getDefaultView();
			else
				targetView = View.ofId(tarId);
		
			if(View.currentState != null)
				type = popedNewState.timestamp < View.currentState.timestamp? View.SWITCHTYPE_HISTORYBACK: View.SWITCHTYPE_HISTORYFORWARD;
			
			View.currentState = popedNewState;
		}
		
		/* 视图切换 */
		targetView && View.switchView(targetView.getId(), type);
		/** 保持地址栏的一致性 */
		if(null != targetView){
			if(historyPushPopSupported){
				replaceViewState(targetView.getId());
			}else
				location.hash = targetView.getId();
		}
	};
	
	var init = function(){
		/* 扫描文档，遍历定义的视图 */
		[].forEach.call(document.querySelectorAll("*[data-view=true]"), function(viewObj){
			View.ofId(viewObj.id);
		});		
		
		/**
		 * 指令：data-view 视图定义
		 * 		取值：true 所在元素为视图
		 */
		[].forEach.call(document.querySelectorAll("*[data-view=true]"), function(viewObj){
			viewObj.classList.add("view");
		});	
		
		/**
		 * 指令：data-view-default 配置默认视图（在视图(data-view = true)中配置，且只能有一个）
		 * 		取值：true 所在元素是默认视图
		 */
		(function(){
			/** 查找配置的默认视图 */
			var defaultViewObj = null;
			/* 查找配置的第一个视图 */
			var defaultViewObjs = document.querySelectorAll("*[data-view-default=true][data-view=true]");
			if(0 == defaultViewObjs.length){
				/* 查找顺序定义的第一个视图 */
				defaultViewObj = document.querySelector("*[data-view=true]");
				
				if(null == defaultViewObj){
					console.warn("No view found!");
				}else
					defaultViewObj.setAttribute("data-view-default", "true");
			}else{
				/* 无效的属性定义去除 */
				defaultViewObj = defaultViewObjs[0];
				for(var i = 1; i < defaultViewObjs.length; i++)
					defaultViewObjs[i].removeAttribute("data-view-default");
			}
		})();
		
		/**
		 * 指令：data-view-rel 配置视图导向
		 * 		取值：[view-id] 目标视图ID
		 * 		取值：:back 回退至上一个视图
		 * 		取值：:forward 前进至下一个视图
		 * 
		 * 指令：data-view-rel-disabled 配置导向开关
		 * 		取值：true 触摸时不导向至通过data-view-rel指定的视图
		 */
		(function(){
			document.addEventListener("touchend", function(e){
				var eventTarget = e.changedTouches[0].target;
				
				/* 视图导向定义检测 */
				var targetViewId;
				var tmp = eventTarget;
				while(null == tmp.getAttribute("data-view-rel")){
					tmp = tmp.parentNode;
					
					if(!(tmp instanceof HTMLElement))
						tmp = null;
					if(null == tmp)
						break;
				}
				if(null != tmp)
					targetViewId = tmp.getAttribute("data-view-rel");
				
				if(null == targetViewId)
					return;
				
				/* 视图切换禁用标志检测 */
				var isViewRelDisabled = false;
				tmp = eventTarget;
				while(null == tmp.getAttribute("data-view-rel-disabled")){
					tmp = tmp.parentNode;
					
					if(!(tmp instanceof HTMLElement))
						tmp = null;
					if(null == tmp)
						break;
				}
				if(null != tmp)
					isViewRelDisabled = "true" == tmp.getAttribute("data-view-rel-disabled");
				
				/* 如果当前禁用视图跳转 */
				if(isViewRelDisabled)
					return;
				
				/* 阻止ghost click */
				e.preventDefault();
				
				/* 回退操作(":back") */
				if(":back" == targetViewId.toLowerCase().trim()){
					history.go(-1);/* browser support */
					
					return;
				}
				
				/* 前进操作（":forward"） */
				if(":forward" == targetViewId.toLowerCase().trim()){
					history.go(1);/* browser support */
					
					return;
				}
				
				/* 呈现ID指定的视图 */
				View.updateView(targetViewId, View.SWITCHTYPE_VIEWSWITCH);
			}, true);
		})();
		
		/**
		 * 呈现指定视图
		 */
		(function(){
			var targetViewId = location.hash.replace(/^#/i, "").toLowerCase();
			var targetView = null;
			
			if("" == targetViewId){/** 判断是否指定目标视图 */
				targetView = View.getDefaultView();
			}else if(!View.isExisting(targetViewId)){/** 判断指定的视图是否存在 */
				targetView = View.getDefaultView();
			}else if(View.ofId(targetViewId).isDirectlyAccessible())/** 判断指定的视图是否支持直接访问 */
				targetView = View.ofId(targetViewId);
			else
				targetView = View.ofId(targetViewId).getFallbackView();
			
			if(null != targetView){
				/** 保持地址栏的一致性 */
				if(historyPushPopSupported){
					replaceViewState(targetView.getId());
				}else
					location.hash = targetView.getId();
				
				targetView.getDomElement().classList.add("active");
			}
		})();
		
		/** 事件监听 */
		window.addEventListener(historyPushPopSupported? "popstate": "hashchange", stateChangeListener);
	};
	
	document.addEventListener("DOMContentLoaded", function(){
		init();
		
		/** 页面的监听器触发 */
		var activeView = View.getActiveView();
		if(activeView){
			activeView.fire("enter", View.SWITCHTYPE_VIEWSWITCH);
			activeView.fire("ready", View.SWITCHTYPE_VIEWSWITCH);
		}
	});
	
	return View;
})();