var stocks_id = [0, 1, 2];
var tax = 0.01;
var a_tax = 1 - tax;

class Market {
    constructor(id) {
        this.marketID = id;
        this.trend = [];
        this.market_charts = [];
    }

    id_to_num(id) {
        return stocks_id.indexOf(id);
    }

    updateHistory() {
        let charts = [];
        let chart = [];

        for (var id = 0; id < 3; id++) {
            for (var t = 0; t < T; t++) {
                chart = [];

                chart.push({id: id, price: quote(id, t), time: t})
            }
            charts.push(chart)
        }
        this.market_charts = charts;
        return charts;
    }

    checkTime() {
        return this.market_charts[0].length
    }


    checkPrice(t, id, checkDelta) {
        let i = id;

        if (typeof (i) == "string") {
            i = this.id_to_num(i);
        }

        if (checkDelta === true) {
            return this.market_charts[i][t].price - this.market_charts[i][t - 1].price;
        } else {
            return this.market_charts[i][t].price;
        }
    }

    checkTrend(start_time, end_time, id) {
        let i = id;

        if (typeof (i) == "string") {
            i = this.id_to_num(i);
        }

        if (this.market_charts[i][end_time] >= this.market_charts[i][start_time]) {
            return "bull";
        } else if (this.market_charts[i][end_time] < this.market_charts[i][start_time]) {
            return "bear";
        }
    }

    sortTrend(arr, t) {
        var trend = arr;
        var max = Math.max.apply(null, trend),
            maxi = trend.indexOf(max),
            min = Math.min.apply(null, trend),
            mini = trend.indexOf(min),
            Max = [
                {
                    id: maxi,
                    trend: this.checkTrend(t - 1, t, maxi),
                    price_change: max
                }
            ];
        trend[maxi] = -Infinity;
        var max_second = Math.max.apply(null, trend),
            maxi_second = trend.indexOf(secondMax);
        Max.push(
            {
                id: maxi_second,
                trend: this.checkTrend(t - 1, t, maxi_second),
                price_change: max_second
            }
        );
        Max.push(
            {
                id: mini,
                trend: this.checkTrend(t - 1, t, mini),
                price_change: min
            }
        );

        trend[maxi] = max;
        return Max;
    }
}

class Portfolio {
    constructor() {
        this.balance = 1000000;
        this.tickets = [];
        this.position = {
            trades: [],
            isTrading: false,
            opened_position: []
        };

        this.top_trend = {
            id: null,
            start_time: null,
            end_time: null,
            start_price: null,
            end_price: null
        };
        this.current_trend = [];
        this.history_trend = [];
    }

    logOngoingTrends(trends, cmd) {
        if (cmd === "start") {

        }
    }

    logTrade(id, t, type, x, price) {
        this.tickets[t].push = {
            id: id,
            type: type,
            amount: x,
            price: price
        };
    }

    checkTrade(id, t) {
        let isTrading;
        let trade_type;
        // let on_trade;

        if (this.tickets[id][t] === undefined) {
            isTrading = false;
            return {
                isTrading,
                trade_type
            };
        } else {
            isTrading = true;
            trade_type = this.tickets[id][t].type;
            return {
                isTrading,
                trade_type
            };
        }
    }

    // check if make trade decision
    checkPosition(trend, time, market) {
        const checkBalance = function (price, opened_pos) {
            var pos = 0;
            if (opened_pos > 0) {
                pos = opened_pos
            }
            return this.balance >= price * (10000 - pos) * (1 + tax);
        }

        const checkIfRebalance = function (p1, p1_i, p2_i, x, mode) {
            var b = x * p1 * (1 - tax);
            var x_i = Math.floor(b / (p1_i * (1 + tax)));
            var b_i = b - (x_i * p1_i * (1 + tax));
            var cash_r = b_i / b;

            if (mode === "p2") {
                return (p1_i * (1 + tax) * (1 + cash_r)) / ((1 - tax) * (1 - cash_r));
            }
            return p2_i * (1 - tax) > p1_i * (1 + tax);
        }

        const checkIfTrade = function (p1, p2, mode) {
            if (mode === "p2") {
                return (p1 * (1 + tax)) / (1 - tax);
            }
            if (mode === "p2_close") {
                return (p1 * (1 - tax)) / (1 + tax);
            }
            return p2 * (1 - tax) > p1 * (1 + tax);
        }

        const checkIfClose = function (pos, t, market) {
            var count = [0, 0, 0]
            var pos_closed = [
                [], [], []
            ];
            var cmd = [];

            for (var i = 0; i < pos.length; i++) {
                var id = pos[i].id;
                var amount_filled = 0;

                var p1 = [],
                    p2_b = [],
                    p2_s = [];
                var close_t = [];
                var t_st = 0,
                    pos_left = 0;
                // check threshold
                for (var ii = 0; ii < 3; ii++) {
                    // if more than 1 trade within same ID
                    if (count[id] >= 1) {
                        var p1_temp = 0,
                            time_temp = 0;
                        pos_left = pos[i].amount;
                        // sort relatively high price point
                        for (var iii = t - count[id]; iii < t + count[id]; iii++) {
                            if (pos_closed[ii][iii] >= 10000 || iii === pos[i].start_time) {
                                continue;
                            }
                            if (pos_closed[ii][iii] + pos_left >= 10000) {
                                pos_left -= 10000 - pos_closed[ii][iii];
                                pos_closed[ii][iii] = 10000;
                                continue;

                            }
                            p1[ii] = market.checkPrice(t, iii);
                            if (p1[ii] > p1_temp) {
                                p1_temp = p1[ii];
                                time_temp = iii;
                            }
                        }
                        p1[ii] = p1_temp;
                        t_st = time_temp;
                    }
                    // if the 1st trade within same ID
                    else {
                        pos_left = pos[i].amount;
                        p1[ii] = market.checkPrice(t, ii);
                        t_st = t;
                    }
                    amount_filled = pos_left;
                    p2_s[ii] = checkIfTrade(p1[ii], null, "p2_close");

                    if (ii === id) {
                        p2_b[ii] = checkIfTrade(p1[ii], null, "p2");
                    } else {
                        p2_b[ii] = checkIfRebalance(market.checkPrice(t_st, id), p1[ii], null, pos[i].amount, "p2");
                    }

                    // check the time each stock reaches threshold
                    for (var iii = t_st; iii < market.checkTime(); iii++) {
                        if (market.checkPrice(iii, ii) > p2_b[ii]) {
                            close_t[ii] = {
                                type: "flow",
                                time: iii
                            }
                            break;
                        }
                        if (market.checkPrice(iii, ii) < p2_s[ii]) {
                            close_t[ii] = {
                                type: "blow",
                                time: iii
                            }
                            break;
                        }
                    }
                }
                // sort time at threshold
                const min = Math.min.apply(Math, close_t.map(function (o) {
                    return o.time;
                }));
                const mini = close_t.findIndex(function (close_t) {
                    return close_t.time === min;
                });
                const min_type = close_t[mini].type;
                // final step - add commands
                if (min_type === "flow") {
                    cmd[i] = {
                        ifClose: false
                    }
                } else {
                    cmd[i] = {
                        id: id,
                        ifClose: true,
                        time: t_st,
                        amount: amount_filled
                    }
                    pos_closed[id][t_st] = amount_filled;
                }

                count[id] += 1;
            }
            return cmd;
        }

        const fillPosition = function (pos_x, p1, p2, id, time, mode) {
            var cmd =
                {
                    filled: false,
                    commands: [],
                    cash_used: 0
                }

            if (checkIfTrade(p1, p2)) {
                var amount_temp = 10000 - pos_x;
                cmd.commands.push(
                    {
                        type: "buy",
                        id: id,
                        time: time,
                        amount: amount_temp
                    });
                cmd.filled = true;
                cmd.cash_used = amount_temp * a_tax * p1;
            }
            return cmd;
        }

        // if bear
        if (trend[0].trend === "bear") {
            // !isTrading
            if (this.position.isTrading === false) {
                // return {skip: true};
            }

            // opened pos exist
            else {
                try {
                    if (this.position.opened_position === []) {
                        throw "noTrades";
                    }
                    // log end of the trends
                    this.logOngoingTrends(trend, "Bear");
                    // check all pos
                    const pos_checked = checkIfClose(this.position.opened_position, time, market);
                    var close_cmd = [];
                    for (var ii = 0; ii < pos_checked.length; ii++) {
                        if (pos_checked[ii].ifClose === true) {
                            close_cmd.push(
                                {
                                    type: "sell",
                                    id: pos_checked[ii].id,
                                    time: pos_checked[ii].time,
                                    amount: pos_checked[ii].amount
                                }
                            )
                        }
                    }
                    return {commands: close_cmd};
                } catch (err) {
                    if (err === "noTrades") {
                        return {
                            exit: true,
                            error: "isTrading === true but there are no trades(bear)"
                        }
                    }
                }
            }
        }

        // if new start of a trend
        if (this.current_trend[0].id === null) {
            // log all sorted trends
            this.logOngoingTrends(trend, "start");
            return {skip: true};
        }

        // if a change of trend sequence
        if (this.current_trend[0].id !== trend[0].id
            || this.current_trend[1].id !== trend[1].id) {
            // log new sorted trends
            this.logOngoingTrends(trend, "newSeq");

            // check if make trades
            var cmd_ii = {commands: null};
            // *if no opened pos
            if (this.position.isTrading === false) {
                var id_temp = this.history_trend[0].id;
                var startTime_temp = this.history_trend[0].start_time;
                var open_cmd = [];
                // if balance below trading limit
                if (!checkBalance(this.history_trend[0].start_price, this.position.trades[id_temp][startTime_temp])) {
                    var p1 = this.history_trend[0].start_price;
                    var p2 = this.history_trend[0].end_price;

                    if (checkIfTrade(p1, p2)) {
                        open_cmd.push(
                            {
                                commands: [
                                    {
                                        type: "buy",
                                        id: this.history_trend[0].id,
                                        time: this.history_trend[0].start_time,
                                        amount: Math.floor(this.balance / p1)
                                    }
                                ]
                            }
                        );
                    } else {
                        return {skip: true};
                    }
                }
                // if balance above trading limit
                else {
                    var count = 0;
                    var cash_left = this.balance;

                    for (var i = this.history_trend[0].start_time; i < this.history_trend[0].end_time; i++) {
                        for (var ii = 0; ii < 3; ii++) {
                            if (this.history_trend[ii].trend === "bear") {
                                continue;
                            }
                            var p1 = this.history_trend[ii].start_price;
                            var p2 = this.history_trend[ii].end_price;
                            var cmd = {};

                            id_temp = this.history_trend[ii].id;
                            startTime_temp = this.history_trend[ii].start_time; // redundant

                            cmd = fillPosition(this.position.trades[id_temp][startTime_temp], p1, p2, id_temp, startTime_temp);
                            if (cmd.filled === false && ii === 0 && count === 0) {
                                return {skip: true};
                            }
                            cash_left -= cmd.cash_used;
                        }
                        count += 1;
                    }
                    open_cmd = cmd.commands;
                }
                cmd_ii.commands = open_cmd;
            }
            // *if opened pos exist
            else {
                try {
                    if (this.position.opened_position === []) {
                        throw "noTrades";
                    }
                    var pos_checked_i = checkIfClose(this.position.opened_position, time, market);
                    var close_cmd_i = [];
                    for (var iii = 0; iii < pos_checked_i.length; iii++) {
                        if (pos_checked_i[ii].ifClose === true) {
                            close_cmd_i.push(
                                {
                                    type: "sell",
                                    id: pos_checked_i[iii].id,
                                    time: pos_checked_i[iii].time,
                                    amount: pos_checked_i[iii].amount
                                }
                            )
                        }
                    }
                    cmd_ii.commands = cmd_ii.commands.concat(close_cmd_i);
                    // // (Multi opened pos)
                    // if (this.position.opened_position.length > 1) {
                    // }
                    // // (Only one opened pos) - check if rebalance
                    // else {
                    //     var id = this.position.opened_position[0].id;
                    //     var p1i = this.position.opened_position[0].start_price;
                    //     var p2i = this.history_trend[0].end_price;
                    //     var p1i_n = this.current_trend[0].start_price;
                    //     var p2i_n = this.current_trend[0].end_price;
                    //
                    //     if (checkIfRebalance(p1i, p2i, p1i_n, p2i_n)) {
                    //         var rebalance_cmd = [
                    //             {
                    //                 type: "sell",
                    //                 id: id,
                    //                 time: this.current_trend[0].start_price,
                    //                 amount: this.position.opened_position[0].amount
                    //             },
                    //             {
                    //                 type: "buy",
                    //                 id: this.current_trend[0].id,
                    //                 time: this.current_trend[0].start_time,
                    //                 amount: Math.floor(this.balance / this.current_trend[0].start_price)
                    //             }
                    //         ]
                    //         return {commands: rebalance_cmd};
                    //     } else {
                    //         return {skip: true}
                    //     }
                    // }
                } catch (err) {
                    if (err === "noTrades") {
                        return {
                            exit: true,
                            error: "isTrading === true but there are no trades(newSeq)"
                        }
                    }
                }
            }
            return cmd_ii;
        }
    }

    trade_signal() {
        return !!this.checkPosition("ifTrade");
    }

    rebalance_signal() {
        return !!this.checkPosition("ifRebalance");
    }

    trade_cmd() {

    }

    rebalance_cmd() {

    }
}

var trade = function (cmds, t) {
    for (cmd in cmds) {
        let price = quote(cmd.id, t);

        if (cmd.type === "buy") {
            buy(cmd.id, cmd.time, cmd.amount);
        }
        if (cmd[0] === "sell") {
            sell(cmd[1], cmd[2]);
        }

        Q3.logTrade(cmd.id, cmd.time, cmd.type, cmd.ammount, price);
    }
}


let market = new Market(0);
let history_chart = market.updateHistory();
let Q3 = new Portfolio(2);

// start from time(1)
for (let t = 1; t < T;) {
    let sorted_trend = [],
        unsorted_trend = [];

    for (var i in stocks_id) {
        unsorted_trend.push(
            market.checkPrice(t, stocks_id[i], true)
        );
    }

    sorted_trend = market.sortTrend(unsorted_trend, t);

    const commands = Q3.checkPosition(sorted_trend, t - 1, market);

    // if no need to trade, continue
    if (commands.skip === true) {
        continue;
    }

    // if (t=T){
    //     Q3.closingMarket();
    // }
    for(var ii = 0; ii < commands.commands.length; ii++){
        if (commands.commands[ii].type === "buy") {
            Q3.buy();
        }
        if (commands.commands[ii].type === "sell") {
            Q3.sell();
        }
    }
    t++;
}