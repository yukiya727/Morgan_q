var trade = 0;

for (var t = 0; t < T; t++) {

    if (quote(A, t) < quote(A, t + 1) && trade!=1){
        buy(A, t);
        trade = 1;
    }
    if (quote(A, t) > quote(A, t + 1) && trade!=2){
        sell(A, t);
        trade = 2;
    }
}
