var gulp = require("gulp"),
	rename = require('gulp-rename'),
	uglify = require("gulp-uglify"),
	gap = require("gulp-append-prepend"),
	cleanCss = require("gulp-clean-css"),
	zip = require("gulp-zip"),
	del = require("del");

var version = "1.5.0";

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

var min = function(){
	gulp.src('../view.js')
		.pipe(rename("view." + getVersion() + ".min.js"))
        .pipe(uglify())
		.pipe(gap.prependText('/**\n * View.js v' + getVersion() + '\n * author: Billy, wmjhappy_ok@126.com\n * license: MIT\n */'))
        .pipe(gulp.dest('../'));
};

var copySource = function(version){
	gulp.src('../view.js')
		.pipe(rename("view." + version + ".js"))
        .pipe(gulp.dest('../release/' + version));
	
	gulp.src('../view.css')
		.pipe(rename("view." + version + ".css"))
        .pipe(gulp.dest('../release/' + version));
};

var copyMin = function(version){
	gulp.src('../view.js')
		.pipe(rename("view." + version + ".min.js"))
        .pipe(uglify())
		.pipe(gap.prependText('/**\n * View.js v' + getVersion() + '\n * author: Billy, wmjhappy_ok@126.com\n * license: MIT\n */'))
        .pipe(gulp.dest('../release/' + version));

	gulp.src('../view.css')
		.pipe(rename("view." + version + ".min.css"))
        .pipe(cleanCss())
        .pipe(gulp.dest('../release/' + version));
};

var stage = function(){
	var version = getVersion();
	copySource(version);
	copyMin(version);
};

gulp.task('min', min);
gulp.task('stage', stage);