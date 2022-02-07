const fs = require('fs');
const fileName = './package.json';
const file = require(fileName);
let version = file.version.split(".")
var myArgs = process.argv.slice(2);

if ((!myArgs[0]) || (myArgs[0] === "developement")) {
  version[2] = parseInt(version[2]) + 1
}
if (myArgs[0] === "qa") {
  version[2] = 0
  version[1] = parseInt(version[1]) + 1
}

if (myArgs[0] === "prod") {
  version[2] = 0
  version[1] = 0
  version[0] = parseInt(version[0]) + 1
}

file.version = version[0] + "." + version[1] + "." + version[2] ;

fs.writeFile(fileName, JSON.stringify(file, null, 4), function writeJSON(err) {
  if (err) return console.log(err);
  console.log('version node project ' + "V" +file.version);
});
