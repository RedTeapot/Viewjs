;(function(ctx, name){
	if(name in ctx){
		console.error("Plugin name: 'View' has already been used.");
		return;
	}

	ctx[name] = {};
})(window, "View");