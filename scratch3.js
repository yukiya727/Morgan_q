var stocks_id = ["A", "B", "C"];
var tax = 0.01;

var a_tax = 1 - tax;
// var sortMax = function (arr) {
//     var max = Math.max.apply(null, arr),
//         maxi = arr.indexOf(max),
//         min = Math.min.apply(null, arr),
//         mini = arr.indexOf(min),
//         Max = [{id: maxi, "diff": max}];
//     arr[maxi] = -Infinity;
//     max_second = Math.max.apply(null, arr);
//     maxi_second = arr.indexOf(secondMax);
//     Max.push({id: maxi_second, "diff": max_second});
//     Max.push({id: mini, "diff": min});
//     arr[maxi] = max;
//     return Max;
// };

class Market {
    constructor(id, hist) {
        this.marketID = id;
        this.trend = [];
        this.market_charts = hist;
    }

    id_to_num(id) {
        return stocks_id.indexOf(id);
    }

    getHistory() {
        let charts = [];
        let chart = [];

        for (var id = 0; id < 3; id++) {
            for (var t = 0; t < T; t++) {
                chart = [];

                chart.push({id: id, price: quote(id, t), time: t})
            }
            charts.push(chart)
        }
        return charts;
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
                    trend: market.checkTrend(t - 1, t, maxi),
                    price_change: max
                }
            ];
        trend[maxi] = -Infinity;
        var max_second = Math.max.apply(null, trend),
            maxi_second = trend.indexOf(secondMax);
        Max.push(
            {
                id: maxi_second,
                trend: market.checkTrend(t - 1, t, maxi_second),
                price_change: max_second
            }
        );
        Max.push(
            {
                id: mini,
                trend: market.checkTrend(t - 1, t, mini),
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
    checkPosition(trend, time) {
        const checkTradability = function (trend) {
            return true;
        }

        const checkBalance = function (price) {
            return this.balance >= price * 10000;
        }

        const checkIfRebalance = function (p1, p2, p1_n, p2_n, f) {
            var x1 = Math.pow(f, 2) * p2_n;
            x1 *= Math.floor(p1 / p1_n);
            x1 -= Math.floor(p1 / p1_n) * f * p1_n;
            var y1 = f * p2 - p1;

            return x1 > y1;
        }

        const checkIfTrade = function (p1, p2, f) {
            return p2 * f > p1;
        }

        // if bear
        if (trend[0].trend === "bear") {
            // !isTrading
            if (this.position.isTrading === false) {
                return {skip: true};
            }

            // opened pos exist
            else {
                try {
                    if (this.position.opened_position === []) {
                        throw "noTrades";
                    }
                    // log end of the trends
                    this.logOngoingTrends(trend, "Bear");
                    // close all pos
                    var close_cmd = [];
                    var id_prev = null;

                    for (var i = 0; i <= this.position.opened_position.length; i++) {
                        if (id_prev === this.position.opened_position[i].id) {
                            market.checkPrice(,id_prev)

                            close_cmd.push(
                                {
                                    type: "sell",
                                    id: this.position.opened_position[i].id,
                                    time: this.current_trend[0].start_time,
                                    amount: this.position.opened_position[i].amount
                                }
                            )
                        }
                        close_cmd.push(
                            {
                                type: "sell",
                                id: this.position.opened_position[i].id,
                                time: this.current_trend[0].start_time,
                                amount: this.position.opened_position[i].amount
                            }
                        )
                        id_prev = this.position.opened_position[i].id;
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
            // *if no opened pos
            if (this.position.isTrading === false) {
                // if balance below trading limit
                if (!checkBalance(this.current_trend[0].start_price)) {
                    var p1 = this.current_trend[0].start_price;
                    var p2 = this.current_trend[0].end_price;

                    if (checkIfTrade(p1, p2, a_tax)) {
                        return {
                            commands: [
                                {
                                    type: "buy",
                                    id: this.current_trend[0].id,
                                    time: this.current_trend[0].start_time,
                                    amount: Math.floor(this.balance / p1)
                                }
                            ]
                        };
                    } else {
                        return {skip: true};
                    }
                }
                // if balance above trading limit
                else {
                }
            }
            // *if opened pos exist
            else {
                try {
                    if (this.position.opened_position === []) {
                        throw "noTrades";
                    }

                    // (Multi opened pos)
                    if (this.position.opened_position.length > 1) {
                    }
                    // (Only one opened pos) - check if rebalance
                    else {
                        var id = this.position.opened_position[0].id;
                        var p1 = this.position.opened_position[0].start_price;
                        var p2 = this.position.opened_position[0].end_price;
                        var p1_n = this.current_trend[0].start_price;
                        var p2_n = this.current_trend[0].end_price;

                        if (checkIfRebalance(p1, p2, p1_n, p2_n, a_tax)) {
                            var rebalance_cmd = [
                                {
                                    type: "sell",
                                    id: id,
                                    time: this.current_trend[0].start_price,
                                    amount: this.position.opened_position[0].amount
                                },
                                {
                                    type: "buy",
                                    id: this.current_trend[0].id,
                                    time: this.current_trend[0].start_time,
                                    amount: Math.floor(this.balance / this.current_trend[0].start_price)
                                }
                            ]
                            return {commands: rebalance_cmd};
                        } else {
                            return {skip: true}
                        }
                    }
                } catch (err) {
                    if (err === "noTrades") {
                        return {
                            exit: true,
                            error: "isTrading === true but there are no trades(newSeq)"
                        }
                    }
                }
            }
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


let market = new Market(0, history_chart);
let history_chart = market.getHistory();
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

    let commands = Q3.checkPosition(sorted_trend, t-1);

    // if no need to trade, continue
    if (commands.skip === true) {
        continue;
    }

    // if (t=T){
    //     Q3.closingMarket();
    // }

    if (Q3.trade_signal()) {
        trade(Q3.trade_cmd());
    }
    if (Q3.rebalance_signal()) {
        rebalance(Q3.reblance_cmd());
    }

    t++;
}