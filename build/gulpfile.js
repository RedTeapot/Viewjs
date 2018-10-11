var fs = require("fs"),
	path = require("path"),
	merge2 = require("merge2"),
	Transform = require("stream").Transform,
	gulp = require("gulp"),
	rename = require('gulp-rename'),
	concat = require('gulp-concat'),
	uglify = require("gulp-uglify"),
	gap = require("gulp-append-prepend"),
	cleanCss = require("gulp-clean-css"),
	gulpif = require("gulp-if"),
	zip = require("gulp-zip"),
	del = require("del");

var version = "1.5.3";

/**
 * 获取命令行中指定名称的参数
 * @param {String} name 参数名。区分大小写
 */
var getParameter = function(name){
	var args = process.argv;
	var index = args.indexOf("--" + name);
	if(-1 == index)
		return undefined;

	if(args.length == index + 1)
		return null;

	return args[index + 1];
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
	
	return year + month + date + hours + minutes;
};

var getVersion = function(){
	return version + "-B" + getTime();
};

var concatJs = function(){
	return gulp.src([
		"../src/entrance.js",
		"../src/eventDrive.js",
		"../src/Logger.js",
		"../src/util.js",
		"../src/resolution.js",
		"../src/layout.js",
		"../src/touch.js",

		"../src/ViewContext.js",
		"../src/ViewConfiguration.js",
		"../src/ViewConfigurationSet.js",
		"../src/ViewLayout.js",
		"../src/ViewState.js",
		"../src/OperationState.js",
		"../src/ViewWantedData.js",

		"../src/view.js",
	])
		.pipe(concat("view.js"))
		.pipe(gap.prependText('/**\n * View.js v' + getVersion() + '\n * author: Billy, wmjhappy_ok@126.com\n * license: MIT\n */'));
};

var min = function(){
	concatJs()
		.pipe(rename("view." + getVersion() + ".min.js"))
        .pipe(uglify())
		.pipe(gap.prependText('/**\n * View.js v' + getVersion() + '\n * author: Billy, wmjhappy_ok@126.com\n * license: MIT\n */'))
        .pipe(gulp.dest('../'));
};

var copySource = function(version, target){
	if(arguments.length < 2)
		target = '../release/' + version;
	
	gulp.src("../src/*").pipe(gulp.dest(target + "/src"));
};

var copyMin = function(version, target){
	if(arguments.length < 2)
		target = '../release/' + version;
	
	concatJs()
		.pipe(rename("view." + version + ".min.js"))
        .pipe(uglify())
		.pipe(gap.prependText('/**\n * View.js v' + version + '\n * author: Billy, wmjhappy_ok@126.com\n * license: MIT\n */'))
        .pipe(gulp.dest(target));

	gulp.src('../view.css')
		.pipe(rename("view." + version + ".min.css"))
        .pipe(cleanCss())
        .pipe(gulp.dest(target));
};

var stage = function(version){
	if(arguments.length < 1)
		version = getVersion();
	copySource(version);
	copyMin(version);
};

var releaseToDoc = function(version){
	if(arguments.length < 1)
		version = getVersion();

	var docRoot = '../docs/web/www/';
	var dist = docRoot + "/dist/",
		zipFileName = "viewjs-" + version + ".zip";

	del.sync(dist + "/**/*", {force: true});

	var stream = merge2();
	stream.add(
		concatJs()
		.pipe(rename("view." + version + ".min.js"))
		.pipe(uglify())
		.pipe(gap.prependText('/**\n * View.js v' + version + '\n * author: Billy, wmjhappy_ok@126.com\n * license: MIT\n */'))
	);
	stream.add(
		gulp.src("../view.css")
		.pipe(rename("view." + version + ".min.css"))
		.pipe(cleanCss())
	);
	
	stream.pipe(zip(zipFileName))
		.pipe(gulp.dest(dist));
	
	/* 创建版本文件 */
	var ws = fs.createWriteStream(docRoot + "js/page/define.version.js");
	ws.write(';(function(){\n	window.viewJsNewestVersion = "' + version + '";\n	window.viewJsNewestZipFile = "dist/' + zipFileName + '";\n})();');
	ws.end();
};

var stageAndreleaseToDoc = function(){
	var version = getVersion();
	stage(version);
	releaseToDoc(version);
};

var cleanup = function(){
	var target = getParameter("target");
	del.sync(target, {force: true});
};

gulp.task('concat', function(){
	concatJs().pipe(gulp.dest("../"));
});
gulp.task('min', function(){min();});
gulp.task('stage', function(){stage();});
gulp.task('releaseToDoc', function(){releaseToDoc();});
gulp.task('stageAndreleaseToDoc', stageAndreleaseToDoc);
gulp.task('cleanup', cleanup);