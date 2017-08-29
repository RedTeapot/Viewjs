var fs = require("fs"),
	gulp = require("gulp"),
	merge2 = require("merge2"),
	concat = require('gulp-concat'),
	buildHtml = require("gulp-build-html"),
	zip = require("gulp-zip"),
	del = require("del"),
	gulpif = require("gulp-if"),
	uglify = require("gulp-uglify"),
	cssmin = require("gulp-cssmin"),
	sass = require("gulp-sass"),

	htmlViewMapping = require("./html-view-mapping");

var version = "1.0.0B1";

/**
 * 获取当前时间。格式：yyyyMMddHHmm，如：201701212057
 */
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

/**
 * 获取当前的构建版本号
 * @param {Boolean} [withTime=true] 是否包含时间信息
 */
var getBuildVersion = function(withTime){
	if(arguments.length < 1)
		withTime = true;

	if(withTime)
		return version + "-" + getTime();

	return version;
};

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

/**
 * 拷贝资源
 */
gulp.task("copySource", function(){
	var target = getBuildVersion(false) + "/";
	gulp.src("../www/**/*").pipe(gulp.dest(target));
});

/**
 * 生成Html页面
 */
gulp.task("concatHtml", function(){
	var root = getParameter("root");

	/**
	 * 生成Html页面
	 * @param {String} [root=getBuildVersion(false)] 工程根路径
	 * @param {StringArray} views 视图数组
	 * @param {String} htmlFileName html文件名（不包括后缀）。如：index
	 */
	var f = function(root, views, htmlFileName){
		if(null == root)
			root = getBuildVersion(false);

		var c = root + "/main/html/",
			v = root + "/view/";

		var stream_begin = gulp.src(c + htmlFileName + "_begin.partial.html"),
			stream_views = views.map(function(viewId){
				var file = v + viewId + "/section.partial.html";
				return gulp.src(file);
			}),
			stream_end = gulp.src(c + htmlFileName + "_end.partial.html");

		var stream = merge2();
		stream.add(stream_begin);
		stream.add(stream_views);
		stream.add(stream_end);
		stream.pipe(concat(htmlFileName + ".html")).pipe(gulp.dest(c));
	};

	for(var html in htmlViewMapping){
		f(root, htmlViewMapping[html], html);
	}
});

/**
 * 编译scss
 */
gulp.task("compileScss", function(root){
	var root = getParameter("root");
	if(null == root)
		root = getBuildVersion(false);

	var loc = root + "/main/css/";
	var commonPaths = [
		loc,
	];

	var htmlNames = Object.keys(htmlViewMapping);
	htmlNames.forEach(function(htmlName){
		var paths = commonPaths.concat();
		var file = loc + htmlName + ".scss";
		gulp.src(file).pipe(sass({includePaths: paths, outputStyle: "compact"}).on('error', sass.logError)).pipe(gulp.dest(loc));
	});
});

/**
 * 合并样式和脚本
 */
gulp.task("buildHtml", function(root){
	var root = getParameter("root");
	if(null == root)
		root = getBuildVersion(false);

	var p = root + "/main/html/";
	gulp.src(p + "/!(*.partial.html|*.jsref.html)")
		.pipe(gulpif("*.html", buildHtml()))
		.pipe(gulpif("*.js", uglify({compress: true})))
		.pipe(gulpif("*.css", cssmin()))
		.pipe(gulp.dest(p));
});

/**
 * 删除无用文件
 */
gulp.task("delUseless", function(){
	var target = getBuildVersion(false);
	del(target + "/main/css/**/*.scss");
	del(target + "/view/");
	del(target + "/main/html/**/*.partial.html");
});

/**
 * 程序打包，生成zip文件
 * @param {Boolean} [withTime=true] 是否包含时间信息
 */
gulp.task("packageZip", function(){
	var target = getBuildVersion(false) + "/";
	var version = getBuildVersion(true);

	/* 创建版本文件 */
	var ws = fs.createWriteStream(target + "version." + version + ".txt");
	ws.end();
	ws = fs.createWriteStream(target + "version.txt");
	ws.write("version: " + version + "\r\n", "utf8");
	ws.write("build-time: " + getTime(), "utf8");
	ws.end();

	gulp.src(target + "/**/*")
		.pipe(zip(version + ".zip"))
		.pipe(gulp.dest("."));
});

/**
 * 清理
 */
gulp.task("clean", function(){
	del(getBuildVersion(false));
});