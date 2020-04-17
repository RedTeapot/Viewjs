var fs = require("fs"),
	utils = require("wzh.node-utils"),
	lib = require("./lib");

var action = utils.cli.getParameter("action"),
	version = utils.cli.getParameter("version"),
	updateNumber = utils.cli.getParameter("updateNumber"),
	buildTarget = utils.cli.getParameter("buildTarget");

var validActionList = ["min", "src", "minAndZip"];
if(null == action || validActionList.indexOf(action) === -1)
	throw new Error("Unknown action: " + action);

if('--updateNumber' === version){
	version = null;
	updateNumber = null;
}

var buf = Buffer.from(new Array(1024)), len;
process.stdout.write("[选填] 请输入版本号（如 1.0.0）：");
len = fs.readSync(process.stdin.fd, buf, 0, buf.length, 0);
version = buf.toString("utf8", 0, len).trim();
if(utils.string.isEmptyString(updateNumber) || isNaN(updateNumber = Number(updateNumber))){
	process.stdout.write("[选填] 请输入更新序号：");
	len = fs.readSync(process.stdin.fd, buf, 0, buf.length, 0);
	updateNumber = buf.toString("utf8", 0, len).trim();
}
if(utils.string.isEmptyString(buildTarget)){
	process.stdout.write("[选填] 是否用于正式发布：");
	len = fs.readSync(process.stdin.fd, buf, 0, buf.length, 0);
	buildTarget = buf.toString("utf8", 0, len).trim();
}

/* 设置版本号 */
if(utils.string.isEmptyString(version))
	version = "newest";
if(!utils.string.isEmptyString(updateNumber)){
	lib.setVersion(version);
}else{
	updateNumber = Number(updateNumber);
	lib.setVersion(version, updateNumber);
}

/* 设置构建用途 */
if(!utils.string.isEmptyString(buildTarget)){
	lib.setBuildTargetAsProductionEnv(["1", "true", "y"].indexOf(buildTarget.toLowerCase()) !== -1);
}else
	lib.setBuildTargetAsProductionEnv(false);

console.log(version, updateNumber || "", lib.getBuildTarget());

/* 执行动作 */
switch(action){
case "min":
	lib.execCmd_generateMinifiedFile();
	break;

case "src":
	lib.execCmd_generateSourceFile();
	break;

case "minAndZip":
	lib.execCmd_minAndZip();
	break;

default:
	throw new Error("Unknown action: " + action);
}