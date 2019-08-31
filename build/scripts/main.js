var utils = require("_wzh.node-utils@0.0.10@wzh.node-utils"),
	lib = require("./lib");

var action = utils.cli.getParameter("action"),
	version = utils.cli.getParameter("version"),
	updateNumber = utils.cli.getParameter("updateNumber");

var validActionList = ["min", "src", "releaseToDoc"];
if(null == action || validActionList.indexOf(action) === -1)
	throw new Error("Unknown action: " + action);

/* 设置版本号 */
lib.setVersion(version, Number(updateNumber));

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