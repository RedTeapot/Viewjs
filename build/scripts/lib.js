var fs = require("fs"),
	gulp = require("gulp"),
	concat = require('gulp-concat'),
	gap = require("gulp-append-prepend"),
	uglify = require("gulp-uglify"),
	cssmin = require("gulp-cssmin"),
	zip = require("gulp-zip"),
	del = require("del"),
	merge2 = require("merge2"),
	utils = require('wzh.node-utils');

/**
 * 版本号
 * @type {string}
 */
var version = "1.0.0";

/**
 * 更新版本号
 * 当新版本发布没多久，但出现了影响开发者使用，需要紧急、快速纠正问题时，
 * 需要将更新信息反映至版本号中。
 *
 * 例如：view-1.6.1.update2.min.js
 *
 * @type {number}
 */
var updateNumber = 0;

/**
 * 构建用途：开发测试 - dev；正式发布 - prod
 * @type {string}
 */
var buildTarget = "dev";

/**
 * view的js源码文件的文件名
 * @type {string}
 */
var fileSrcName_js = "view-${version}.js";
/**
 * view的js压缩文件的文件名
 * @type {string}
 */
var fileMinName_js = "view-${version}.min.js";

/**
 * view的.d.ts声明文件的文件名
 * @type {string}
 */
var fileSrcName_d_ts = "view-${version}.d.ts";
/**
 * view的.d.ts声明文件压缩文件的文件名
 * @type {string}
 */
var fileMinName_d_ts = "view-${version}.d.ts";

/**
 * view的css源码文件的文件名
 * @type {string}
 */
var fileSrcName_css = "view-${version}.css";
/**
 * view的css压缩文件的文件名
 * @type {string}
 */
var fileMinName_css = "view-${version}.min.css";

/**
 * 设置版本号
 * @param {String} _version 版本号
 * @param {Number} [_updateNumber] 更新序号
 */
var setVersion = function(_version, _updateNumber){
	if(!utils.string.isEmptyString(_version, true))
		version = _version;

	var tmp;
	if(!utils.string.isEmptyString(_updateNumber, true) && !isNaN(tmp = Number(_updateNumber)))
		updateNumber = tmp;
};

/**
 * 获取下一版的版本号
 * @returns {string}
 */
var getVersion = function(){
	var f = function(){
		var withUpdateNumber = typeof updateNumber === "number" && updateNumber > 0;
		if(!withUpdateNumber)
			return version;

		return version + ".update" + updateNumber;
	};

	if("dev" === buildTarget){
		return f() + ".dev";
	}else{
		return f();
	}
};

/**
 * 设置构建用途
 * @param {Boolean} [asProductionEnv=false] 是否作为 正式发布
 */
var setBuildTargetAsProductionEnv = function(asProductionEnv){
	if(arguments.length < 1)
		asProductionEnv = false;

	buildTarget = !!asProductionEnv? "prod": "dev";
};

/**
 * 获取构建用途
 * @returns {string} dev - 开发测试；prod - 正式发布
 */
var getBuildTarget = function(){
	return buildTarget;
};

/**
 * 获取js源文件的文件名
 * @returns {*}
 */
var getSrcJsFileName = function(){
	return utils.string.fillParamValue(fileSrcName_js, {version: getVersion()});
};
/**
 * 获取js压缩文件的文件名
 * @returns {*}
 */
var getMinifiedJsFileName = function(){
	return utils.string.fillParamValue(fileMinName_js, {version: getVersion()});
};

/**
 * 获取ts声明文件的文件名
 * @returns {*}
 */
var getSrcDTsFileName = function(){
	return utils.string.fillParamValue(fileSrcName_d_ts, {version: getVersion()});
};
/**
 * 获取ts声明文件的压缩文件的文件名
 * @returns {*}
 */
var getMinifiedDTsFileName = function(){
	return utils.string.fillParamValue(fileMinName_d_ts, {version: getVersion()});
};

/**
 * 获取css源文件的文件名
 * @returns {*}
 */
var getSrcCssFileName = function(){
	return utils.string.fillParamValue(fileSrcName_css, {version: getVersion()});
};
/**
 * 获取css压缩文件的文件名
 * @returns {*}
 */
var getMinifiedCssFileName = function(){
	return utils.string.fillParamValue(fileMinName_css, {version: getVersion()});
};

/**
 * 获取附加在插件正文前的，要展现给开发者的信息
 * @returns {string}
 */
var getPluginInfo = function(){
	var info = '\n * View.js v' + getVersion() + '\n * author: Billy, wmjhappy_ok@126.com\n * license: MIT\n * \n * -- ' + utils.date.formatDate(new Date(), 'yyyy-MM-dd HH:mm') + '\n */';
	if("dev" === buildTarget)
		info = "\n * This version is built for test only, we do not recommend you use it in production environment.\n" + info;
	info = "/**" + info;
	return info;
};

/**
 * 获取待处理的js源文件列表
 * @returns {Stream}
 */
var getSrcJsStream = function(){
	return gulp.src(([
		"../src/js/_begin.js",

		"../src/js/ViewLogger.js",

		"../src/js/eventDrive.js",
		"../src/js/util.js",
		"../src/js/resolution.js",
		"../src/js/layout.js",
		"../src/js/touch.js",

		"../src/js/ViewContext.js",
		"../src/js/ViewConfiguration.js",
		"../src/js/ViewConfigurationSet.js",
		"../src/js/ViewState.js",
		"../src/js/ViewLayout.js",
		"../src/js/ViewOperationState.js",
		"../src/js/ViewChainedHandle.js",

		"../src/js/viewAttribute.js",
		"../src/js/viewRepresentation.js",
		"../src/js/viewParameter.js",
		"../src/js/viewInternalVariable.js",

		"../src/js/ViewConstructor.js",
		"../src/js/view.js",

		"../src/js/_end.js"
	]));
};

/**
 * 获取待处理的ts声明文件源文件列表
 * @returns {Stream}
 */
var getSrcDTsStream = function(){
	return gulp.src(["../src/ts/view.d.ts"]);
};

/**
 * 获取待处理的css源文件列表
 * @returns {Stream}
 */
var getSrcCssStream = function(){
	return gulp.src(["../src/css/view.css"]);
};

/**
 * 获取待处理的js压缩文件流
 * @returns {Stream}
 */
var getMinifiedJsStream = function(){
	return utils.stream.xpipe(
		getSrcJsStream(),
		concat(getMinifiedJsFileName(), {newLine: ","}),
		uglify(),
		gap.prependText(getPluginInfo())
	);
};

/**
 * 获取待处理的ts声明文件压缩文件流
 * @returns {Stream}
 */
var getMinifiedDTsStream = function(){
	return utils.stream.xpipe(
		getSrcDTsStream(),
		concat(getMinifiedDTsFileName()),
		gap.prependText(getPluginInfo())
	);
};

/**
 * 获取待处理的css压缩文件流
 * @returns {Stream}
 */
var getMinifiedCssStream = function(){
	return utils.stream.xpipe(
		getSrcCssStream(),
		concat(getMinifiedCssFileName()),
		cssmin(),
		gap.prependText(getPluginInfo())
	);
};

////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////

/**
 * 执行命令：生成源码
 * @param {String} [outputDirPath=../] 文件的目标输出位置
 */
var execCmd_generateSourceFile = function(outputDirPath){
	if(arguments.length < 1)
		outputDirPath = "../";

	utils.stream.xpipe(
		getSrcJsStream(),
		concat(getSrcJsFileName(), {newLine: ","}),
		gap.prependText(getPluginInfo()),
		gulp.dest(outputDirPath)
	);

	utils.stream.xpipe(
		getSrcCssStream(),
		concat(getSrcCssFileName()),
		gap.prependText(getPluginInfo()),
		gulp.dest(outputDirPath)
	);

	utils.stream.xpipe(
		getSrcDTsStream(),
		concat(getSrcDTsFileName()),
		gap.prependText(getPluginInfo()),
		gulp.dest(outputDirPath)
	);
};

/**
 * 执行命令：生成压缩文件
 * @param {String} [outputDirPath=../] 文件的目标输出位置
 */
var execCmd_generateMinifiedFile = function(outputDirPath){
	if(arguments.length < 1)
		outputDirPath = "../";

	utils.stream.xpipe(
		getMinifiedJsStream(),
		gulp.dest(outputDirPath)
	);

	utils.stream.xpipe(
		getMinifiedCssStream(),
		gulp.dest(outputDirPath)
	);

	utils.stream.xpipe(
		getMinifiedDTsStream(),
		gulp.dest(outputDirPath)
	);
};

var execCmd_minAndZip = function(){
	var version = getVersion();
	var dist = "../dist-" + version + "/",
		zipFileName = "viewjs-" + version + ".zip";

	var clear = function(){
		del.sync(dist + "/**/*", {force: true});
	};

	clear();
	var stream = utils.stream.xpipe(
		merge2(getMinifiedJsStream(), getMinifiedCssStream(), getMinifiedDTsStream()),
		zip(zipFileName),
		gulp.dest("../")
	);
	stream.on("end", clear);
};

module.exports = {
	setVersion: setVersion,
	setBuildTargetAsProductionEnv: setBuildTargetAsProductionEnv,
	getBuildTarget: getBuildTarget,

	execCmd_generateSourceFile: execCmd_generateSourceFile,
	execCmd_generateMinifiedFile: execCmd_generateMinifiedFile,
	execCmd_minAndZip: execCmd_minAndZip
};