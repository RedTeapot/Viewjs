;window.View = (function(){
	var historyPushPopSupported = ("pushState" in history) && (typeof history.pushState == "function");
	console.log("history.pushState is " + (historyPushPopSupported? "": "not ") + "supported");
	
	var util = {};
	
	/**
	 * 设定参数默认值
	 * @param ops {Json} 要设定默认值的目标
	 * @param dftOps {Json} 提供的默认值配置
	 */
	util.setDftValue = function(ops, dftOps){
		ops = ops || {};
		dftOps = dftOps || {};
		
		/* 参数不存在时，从默认参数中读取并赋值 */
		for(var p in dftOps)
		if(!(p in ops))
			ops[p] = dftOps[p];

		return ops;
	};
	
	/**
	 * 视图类
	 * @param id {String} 视图对应的DOM元素的id
	 */
	var View = function(id){
		if(null == document.querySelector("#" + id + "[data-view=true]")){
			throw new Error("View of id: " + id + " does not exist(No element matching pattern: '#" + id + "[data-view=true]' found)!");
		}
		
		/** 当前视图由活动视图变为非活动视图时执行的回调方法 */
		var leaveCallbacks = [];
		/** 当前视图变为活动视图时执行的回调方法 */
		var enterCallbacks = [];
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
		 * 获取当前视图由活动视图变为非活动视图时执行的方法
		 */
		this.getLeaveListeners = function(){
			return leaveCallbacks;
		};
		
		/**
		 * 获取当前视图变为活动视图时执行的方法
		 */
		this.getEnterListeners = function(){
			return enterCallbacks;
		};
		
		/**
		 * 添加监听器：视图由活动视图变为非活动视图时执行的方法
		 * @param callback {Function} 要添加的回调方法
		 */
		this.addLeaveListener = function(callback){
			if(leaveCallbacks.indexOf(callback) == -1)
				leaveCallbacks.push(callback);
		};
		
		/**
		 * 移除监听器：视图由活动视图变为非活动视图时执行的方法
		 * @param callback {Function} 要移除的回调方法
		 */
		this.removeLeaveListener = function(callback){
			var index = leaveCallbacks.indexOf(callback);
			if(-1 != index)
				leaveCallbacks.splice(index, 1);
		};
		
		/**
		 * 添加监听器：视图变为活动视图时执行的方法
		 * @param callback {Function} 要添加的回调方法
		 */
		this.addEnterListener = function(callback){
			if(enterCallbacks.indexOf(callback) == -1)
				enterCallbacks.push(callback);
		};
		
		/**
		 * 移除监听器：视图变为活动视图时执行的方法
		 * @param callback {Function} 要移除的回调方法
		 */
		this.removeEnterListener = function(callback){
			var index = enterCallbacks.indexOf(callback);
			if(-1 != index)
				enterCallbacks.splice(index, 1);
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
		
		targetViewId = "" == targetViewId.trim()? View.getDefaultView().getId(): targetViewId;
		
		console.log(currentView.getId() + " -> " + targetViewId, type);
		
		/* 如果切换目标是自己，则直接返回 */
		if(currentView.getId().toLowerCase() == targetViewId.toLowerCase())
			return;
		
		/* 目标视图 */
		var targetView = View.ofId(targetViewId);
		type = (type.toLowerCase() == View.SWITCHTYPE_HISTORYFORWARD? View.SWITCHTYPE_HISTORYFORWARD: (
				type.toLowerCase() == View.SWITCHTYPE_HISTORYBACK? View.SWITCHTYPE_HISTORYBACK: View.SWITCHTYPE_VIEWSWITCH));
		
		var display = function(){
			currentView.getDomElement().classList.remove("active");
			targetView.getDomElement().classList.add("active");
		};
		
		/* 执行切换操作 */
		currentView.getLeaveListeners().forEach(function(leaveCallback){/* callbacks */
			leaveCallback.call(currentView.getDomElement(), type);
		});
		if(!withAnimation){
			display();
			targetView.getEnterListeners().forEach(function(enterCallback){/* callbacks */
				enterCallback.call(targetView.getDomElement(), type);
			});
		}else{
			currentView.getLeaveAnimation() && currentView.getLeaveAnimation().call(currentView.getDomElement(), targetViewId, type, display);
			targetView.getEnterAnimation() && targetView.getEnterAnimation().call(targetView.getDomElement(), currentView.getId(), type, function(){/* animation */
				display();
				
				targetView.getEnterListeners().forEach(function(enterCallback){/* callbacks */
					enterCallback.call(targetView.getDomElement(), type);
				});
			});
		}
	};
	
	/**
	 * 切换视图，同时更新相关状态
	 * @param targetViewId 目标视图ID
	 * @param type 切换操作类型（View.SWITCHTYPE_HISTORYFORWARD || View.SWITCHTYPE_HISTORYBACK || View.SWITCHTYPE_VIEWSWITCH）
	 */
	View.updateView = function(targetViewId, type){
		var state = {viewId: targetViewId, timestamp: new Date().getTime()};
		
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
		
		View.currentState = state;
		
		if(historyPushPopSupported){
			history.pushState(state, "", "#" + targetViewId);/* browser support */
			
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
		
		/* 如果目标页面是当前页面，则直接返回 */
		if(location.hash.toLowerCase() == "#" + currentActiveView.getId().toLowerCase() ||
				(location.hash == "" && View.getDefaultView().getId().toLowerCase() == currentActiveView.getId().toLowerCase()))
			return;
		
		var tarId, type = View.SWITCHTYPE_VIEWSWITCH;
		if(!historyPushPopSupported){
			tarId = location.hash.replace(/^#/, "");
			type = View.SWITCHTYPE_VIEWSWITCH;
		}else{
			var popedNewState = e.state;
			
			console.log("poped state", JSON.stringify(popedNewState));
			
			if(popedNewState == null){/* default view */
				tarId = View.getDefaultView().getId();
				
				if(View.currentState != null)
					type = View.SWITCHTYPE_HISTORYBACK;
			}else{
				tarId = popedNewState.viewId;
				type = View.SWITCHTYPE_VIEWSWITCH;
				
				if(View.currentState != null)
					type = popedNewState.timestamp < View.currentState.timestamp? View.SWITCHTYPE_HISTORYBACK: View.SWITCHTYPE_HISTORYFORWARD;
			}
			
			View.currentState = popedNewState;
		}
		
		/* 视图切换 */
		View.switchView(tarId, type);
	};
	
	/**
	 * 文档解析器
	 */
	var Initializer = {
		/**
		 * 解析可识别的指令
		 */
		init: function(){
			/* 扫描文档，遍历定义的视图 */
			[].forEach.call(document.querySelectorAll("*[data-view=true]"), function(viewObj){
				View.ofId(viewObj.id);
			});		
			
			/**
			 * 指令：data-view 视图定义
			 * 		取值：true 所在元素为视图
			 */
			(function(){
				var viewObjs = document.querySelectorAll("*[data-view=true]");
				[].forEach.call(viewObjs, function(viewObj){
					viewObj.classList.add("view");
				});					
			})();
			
			/**
			 * 指令：data-view-default 配置默认视图（在视图(data-view = true)中配置，且只能有一个）
			 * 		取值：true 所在元素是默认视图
			 */
			(function(){
				var defaultViewObj = null;
				/* 查找配置的第一个视图 */
				var defaultViewObjs = document.querySelectorAll("*[data-view-default=true][data-view=true]");
				if(0 == defaultViewObjs){
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
				defaultViewObj.classList.add("active");
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
			 * 指令：data-view-direct-accessable 配置活动视图在浏览器地址刷新后是否仍然是活动视图
			 * 		取值：true 刷新后仍然保持活动视图的活动状态
			 */
			(function(){
				var keep = document.documentElement.getAttribute("data-view-direct-accessable");
				keep = null == keep? "false": keep;
				keep = keep.toLowerCase();
				
				if("" != location.hash){
					var targetViewId = location.hash.replace(/^#/i, "");
					
					var directAccessable = false;
					if("true" == keep){/** 如果设定全部可以直接访问 */
						/** 判定视图是否可以直接访问 */
						if("false" == View.ofId(targetViewId).getDomElement().getAttribute("data-view-direct-accessable"))
							directAccessable = false;
						else
							directAccessable = true;
					}else{
						/** 判定视图是否可以直接访问 */
						if("true" == View.ofId(targetViewId).getDomElement().getAttribute("data-view-direct-accessable"))
							directAccessable = true;
						else
							directAccessable = false;
					}
					
					if(directAccessable){
						if(historyPushPopSupported){
							var state = {viewId: targetViewId, timestamp: new Date().getTime()};
							history.pushState(state, "", "#" + targetViewId);/* browser support */
							
							console.log("pushed state by initializer", state);
						}
						
						/** 呈现指定视图 */
						View.switchView(targetViewId, View.SWITCHTYPE_VIEWSWITCH, false);
					}else{
						/** 保持地址栏的一致性 */
						location.hash = "";
						
						if(historyPushPopSupported){
							var state = null;
							history.pushState(state, "", "");/* browser support */
							
							console.log("pushed state by initializer", state);
						}
						
						/** 呈现默认视图 */
						View.switchView(View.getDefaultView().getId(), View.SWITCHTYPE_VIEWSWITCH, false);
					}
				}
			})();
			
			/** 事件监听 */
			window.addEventListener(historyPushPopSupported? "popstate": "hashchange", stateChangeListener);
		}
	};
	
	document.addEventListener("DOMContentLoaded", function(){
		Initializer.init();
		
		/** 默认页面的监听器触发 */
		var activeView = View.getActiveView();
		var defaultView = View.getDefaultView();
		if(activeView == defaultView)
			activeView.getEnterListeners().forEach(function(enterCallback){/* callbacks */
				enterCallback.call(activeView.getDomElement(), View.SWITCHTYPE_VIEWSWITCH);
			});
	});
	
	return View;
})();