var fs = require("fs"),
	utils = require("wzh.node-utils"),
	lib = require("./lib");

var action = utils.cli.getParameter("action"),
	version = utils.cli.getParameter("version"),
	updateNumber = utils.cli.getParameter("updateNumber");

var validActionList = ["min", "src", "releaseToDoc"];
if(null == action || validActionList.indexOf(action) === -1)
	throw new Error("Unknown action: " + action);

if('--updateNumber' === version){
	version = null;
	updateNumber = null;
}

var buf = Buffer.from(new Array(1024)), len;
while(utils.string.isEmptyString(version)){
	process.stdout.write("[必填] 请输入版本号（如 1.0.0）：");
	len = fs.readSync(process.stdin.fd, buf, 0, buf.length, 0);
	version = buf.toString("utf8", 0, len).trim();
}
if(utils.string.isEmptyString(updateNumber) || isNaN(updateNumber = Number(updateNumber))){
	process.stdout.write("[选填] 请输入更新序号：");
	len = fs.readSync(process.stdin.fd, buf, 0, buf.length, 0);
	updateNumber = buf.toString("utf8", 0, len).trim();
}

/* 设置版本号 */
if(!utils.string.isEmptyString(updateNumber)){
	lib.setVersion(version);
}else{
	updateNumber = Number(updateNumber);
	lib.setVersion(version, updateNumber);
}

console.log(version, updateNumber || "");

/* 执行动作 */
switch(action){
case "min":
	lib.execCmd_generateMinifiedFile();
	break;

case "src":
	lib.execCmd_generateSourceFile();
	break;

case "releaseToDoc":
	lib.execCmd_releaseToDoc();
	break;

default:
	throw new Error("Unknown action: " + action);
}