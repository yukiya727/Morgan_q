var res = [0, 0, 0];
var id = ["A", "B", "C"];
var trade = 0;
var trade_id = -1;

for (var t = 0; t < T; t++) {
    res[0] = quote(A, t + 1) - quote(A, t);
    res[1] = quote(B, t + 1) - quote(B, t);
    res[2] = quote(C, t + 1) - quote(C, t);

    let i = res.indexOf(Math.max(...res));

    if (res[i] < 0) {
        if (trade != 1) {
            continue;
        } else {
            sell(trade_id, t);
            trade = 0;
            trade_id = -1;
        }
    } else {
        if (i != trade_id) {
            if (trade == 1) {
                sell(trade_id, t);
                buy(i, t);
                trade_id = i;
            } else {
                buy(i, t);
                trade_id = i;
                trade = 1;
            }
        } else {
            continue;
        }
    }
}