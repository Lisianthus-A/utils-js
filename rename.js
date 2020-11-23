const fs = require('fs');
const path = require('path');

const regex = /test/;  //匹配规则

/**
 * 根据匹配到的字符串，返回新的文件名
 * @param {string} matchString 匹配到的字符串
 * @returns {string} 新的文件名
 */
const replacer = (matchString) => {
    return matchString + '_new';
}

const self = path.parse(__filename).base;  //自身的文件名

//当前目录除自身外的所有文件
const files = fs.readdirSync('./', { withFileTypes: true })
    .filter(e => e.isFile())
    .map(e => e.name);
files.splice(files.indexOf(self), 1);

//开始重命名
files.forEach(name => {
    const match = name.match(regex);
    if (match) {
        const newName = name.replace(regex, replacer);
        fs.rename(name, newName, (err) => {
            err && console.log(err);
            !err && console.log(`${name} --> ${newName}, rename ok`);
        });
    }
});