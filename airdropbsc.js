(async function() {
  var app = {};
const fs = require('fs');
var BN = require("bn.js");
app = await require("./conf/config")(app);
app = await require("./conf/const")(app);

app = await require("./db/db")(app);

app = await require("./web3/provider")(app);

app = await require("./manager/bep20")(app);
app = await require("./manager/account")(app);

try {

    const data = fs.readFileSync('./bsc.csv', 'UTF-8');

    var reservePath = fs.readFileSync("./conf/steps/campaign.json",'utf8');
    var reserveBep20 = JSON.parse(reservePath);

    app.web3Bep20.eth.accounts.wallet.decrypt([reserveBep20], app.config.SattReservePass);

    // split the contents by new line
    const lines = data.split(/\r?\n/);

      var total = new BN("0");

    // print all lines
    for (var i = 0;i<lines.length;i++) {
        var parts = line[i].split('"');
        var address = parts[1];
        var amount = new BN(parseFloat(parts[3]))
        var mul18  =  new BN("1000000000000000000");
        var bonus = amount.mul(mul18).div(new BN(20));


        total = total.add(bonus);

        console.log(address,amount.toString());
        var receipt = await app.bep20.transferBEP(address,bonus,{address:"0x"+reserveBep20.address});
        console.log(receipt);


    }
} catch (err) {
    console.error(err);
}
})()
