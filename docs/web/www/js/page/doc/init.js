;View.ready(function(){
	var divCodeObjs = document.querySelectorAll("div.code");
	[].forEach.call(divCodeObjs, function(obj){
		obj.innerHTML = obj.innerHTML.trim();
	});
});