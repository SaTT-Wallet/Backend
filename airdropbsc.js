const fs = require('fs');

try {

    const data = fs.readFileSync('./bsc.csv', 'UTF-8');

    // split the contents by new line
    const lines = data.split(/\r?\n/);

    // print all lines
    lines.forEach((line) => {
        var parts = line.split('"');
        var address = parts[1];
        var amount = new BN(parseFloat(parts[3]))
        var mul18  =  new BN("1000000000000000000");
        console.log(address,amount.mul(mul18).toString());
    });
} catch (err) {
    console.error(err);
}
