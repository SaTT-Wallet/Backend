const fs = require('fs');

try {

    const data = fs.readFileSync('./bsc', 'UTF-8');

    // split the contents by new line
    const lines = data.split(/\r?\n/);

    // print all lines
    lines.forEach((line) => {
        var parts = line.split('"');
        console.log(parts[1],parts[3]);
    });
} catch (err) {
    console.error(err);
}
