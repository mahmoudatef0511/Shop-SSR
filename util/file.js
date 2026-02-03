const fs = require('fs');

const modifyURL = (url) => {
    return url.slice(1);
}

exports.deleteFile = (filePath) => {
    filePath = modifyURL(filePath);
    fs.unlink(filePath, (err) => {
        console.log(err);
    })
}