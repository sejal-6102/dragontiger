const socket = io();

var increamtsappgame;

socket.on('connect', () => {
    console.log('Connected to server');
});

function gameover(lastint) {

    for (let i = bet_array.length - 1; i >= 0; i--) {
        if (bet_array[i].hasOwnProperty('is_bet')) {
            bet_array.splice(i, 1);
        }
    }
    // for(let i=0;i < bet_array.length; i++){
    //                      if(bet_array[i] && bet_array[i].is_bet){
    //                         bet_array.splice(i, i+1);
    //                    }
    //            }
    // $.ajax({
    //     url: '/game/game_over',
    //     type: "POST",
    //     data: {
    //         _token: hash_id,
    //         "last_time": lastint
    //     },
    //     dataType: "text",
    //     success: function (result) {
    //         $("#wallet_balance").text(currency_symbol + result);
    //         $("#header_wallet_balance").text(currency_symbol + result); // Show Header Wallet Balance
    //         for(let i=0;i < bet_array.length; i++){
    //             if(bet_array[i] && bet_array[i].is_bet){
    //                 bet_array.splice(i, 1);
    //             }
    //         }
    //         // bet_array = [];
    //     }
    // });
}
function currentid() {
    $.ajax({
        url: '/game/currentid',
        type: "post",
        data: {
            _token: hash_id
        },
        dataType: "json",
        success: function (result) {
        }
    });
}

// function gamegenerate() {
//     setTimeout(() => {
//         $("#auto_increment_number_div").hide();
//         $('.loading-game').addClass('show');
//         setTimeout(() => {
//             // $("#auto_increment_number_div").show();
//             hide_loading_game();
//             // $(".bottom-left-plane").show();

//             $.ajax({
//                 url: '/game/new_game_generated',
//                 type: "POST",
//                 data: {
//                     _token: hash_id
//                 },
//                 beforeSend: function () {
//                 },
//                 dataType: "json",
//                 success: function (result) {
//                         stage_time_out = 1;
//                     if (bet_array.length > 0) {
//                         place_bet_now();
//                     }
//                     $.ajax({
//                         url: '/game/currentlybet',
//                         type: "POST",
//                         data: {
//                             _token: hash_id
//                         },
//                         dataType: "json",
//                         success: function (intialData) {
//                             info_data(intialData);
//                         }
//                     });
//                     current_game_data = result;
//                     hide_loading_game();
//                     new_game_generated();
//                     lets_fly_one();
//                     lets_fly();
//                     let currentbet = 0;
//                     let a =1.0;
//                         $.ajax({
//                             url: '/game/increamentor',
//                             type: "POST",
//                             data: {
//                                 _token: hash_id
//                             },
//                             dataType: "json",
//                             success: function (data) {
//                                 currentbet = data.result;

//                         $.ajax({
//                         url: '/game/currentlybet',
//                         type: "POST",
//                         data: {
//                             _token: hash_id
//                         },
//                         dataType: "json",
//                         success: function (intialData) {
//                             info_data(intialData);
//                         }
//                         });
//                     let increamtsappgame = setInterval(() => {
//                         if ( a >= currentbet ) {
//                             let res = parseFloat(a).toFixed(2);
//                             let result = res;
//                             crash_plane(result);
//                             incrementor(res);
//                             gameover(result);
//                             $("#all_bets .mCSB_container").empty();
//                             $.ajax({
//                                 url: '/game/my_bets_history',
//                                 type: "POST",
//                                 data: {
//                                     _token: hash_id
//                                 },
//                                 dataType: "json",
//                                 success: function (data) {
//                                     $("#my_bet_list").empty();
//                                     for (let $i = 0; $i < data.length; $i++) {
//                                         let date = new Date(data[$i].created_at);
//                                         $("#my_bet_list").append(`
//                                     <div class="list-items">
//                                     <div class="column-1 users fw-normal">
//                                         `+date.getHours()+`:`+date.getMinutes()+`
//                                     </div>
//                                     <div class="column-2">
//                                         <button
//                                             class="btn btn-transparent previous-history d-flex align-items-center mx-auto fw-normal">
//                                             `+data[$i].amount+`₹
//                                         </button>
//                                     </div>
//                                     <div class="column-3">

//                                         <div class="bg3 custom-badge mx-auto">
//                                             `+data[$i].cashout_multiplier+`x</div>
//                                     </div>
//                                     <div class="column-4 fw-normal">
//                                         `+Math.round(data[$i].cashout_multiplier*data[$i].amount)+`₹
//                                     </div>
//                                 </div>
//                                 `);
//                                     }
//                                 }
//                             });
//                             clearInterval(increamtsappgame);
//                             gamegenerate();
//                         } else {
//                             a = parseFloat(a) + 0.01;
//                             incrementor(parseFloat(a).toFixed(2));
//                         }
//                     }, 100);
//                             }
//                         });
//                 }
//             });
//         }, 5000);
//     }, 1500);
// }



let isInitial = true;
let current_Value = 1;



let crash = 0;

function gamegenerate(isflying, current_Value = 1.0, current_speed = 0.01) {

    console.log('game started');

    randomDataArray = Array.from({ length: Math.floor(Math.random() * 39) + 10 }, () => ({
        cashout_multiplier: -1,
        amount: Math.floor(Math.random() * 20000) + 10,
        userid: getRandomUserId(),
        image: getRandomItem(avatars)
    }));

    crash = 0;
    let a = 1.0;
    let speed = 0.01;
    let timeout = 5000;
    let timeout2 = 1000;
    if (isflying) {
        a = current_Value;
        timeout = 0;
        timeout2 = 0;
        speed = current_speed;
    }

    $("#auto_increment_number_div").hide();
    $('.loading-game').addClass('show');

    setTimeout(() => {
        hide_loading_game();

        // Simulate random game data instead of API calls
        // let result = generateRandomGameData();
        let currentbet = 15;

        current_game_data = { id: Math.random() * 100000 };

        // hide_loading_game();
        stage_time_out = 1;
        if (bet_array.length > 0) {
            place_bet_now();
        }
        new_game_generated();
        $('#main_bet_now').prop('disabled', false);
        $('#extra_bet_now').prop('disabled', false);
        hide_loading_game();
        setTimeout(() => {
            lets_fly_one();
            lets_fly(parseFloat(a));
            info_data({});
            const acceleration = 0.00005;
            increamtsappgame = setInterval(() => {
                a = a + speed;
                if(a<5){
                    speed += acceleration;
                  }
                  else if(a<20){
                    speed += acceleration*4;
                  }
          
                  else if(a<50){
                    speed += acceleration*20;
                  }
                 
                  else if(a<50){
                    speed += acceleration*50;
                  }
          
                  else{
                    speed += acceleration*100;
                  }

                incrementor(parseFloat(a).toFixed(2));

                if (crash === 1) {
                    clearInterval(increamtsappgame);
                }

            }, 100);
        }, timeout2)


        socket.off('crash').on('crash', (msg) => {
            crash = 1;
            console.log(msg, 'message')
            let res = parseFloat(a).toFixed(2);
            crash_plane(parseFloat(msg.crash.toFixed(2)));
            incrementor(parseFloat(msg.crash.toFixed(2)));
            gameover(msg.crash);
            $("#all_bets .mCSB_container").empty();
            clearInterval(increamtsappgame);

            // Simulate bet history with random data
            // let betHistory = generateRandomBetHistory();
            setTimeout(() => {
                socket.emit('getBetHistory', { phone, period: msg.period }, (betHistory) => {
                    for (let i = 0; i < betHistory.length; i++) {
                        console.log(betHistory, 'at crash')
                        $("#my_bet_list").prepend(`
                                <div class="list-items">
                                    <div class="column-1 users fw-normal">
                                        ${betHistory[i].formatted_time}
                                    </div>
                                    <div class="column-2">
                                        <button class="btn btn-transparent previous-history d-flex align-items-center mx-auto fw-normal">
                                            ${betHistory[i].amount}₹
                                        </button>
                                    </div>
                                    <div class="column-3">
                                        <div class="bg3 custom-badge mx-auto">
                                            ${parseFloat(betHistory[i].crash) > 1 ? betHistory[i].crash : betHistory[i].result}x
                                        </div>
                                    </div>
                                    <div class="column-4 fw-normal">
                                        ${parseFloat(betHistory[i].crash) > 1 ? (parseFloat(betHistory[i].crash) * betHistory[i].amount) + '₹' : ''}
                                    </div>
                                </div>
                            `);
                    }

                })
            }, 500)

            // $("#my_bet_list").empty();
            setTimeout(()=>{
            gamegenerate(false); // Start the game cycle again
            },1000)
             
        })

        // Simulate incrementor behavior with random game data
    }, timeout);
}

// Generate random game data
function generateRandomGameData() {
    return {
        game_id: Math.floor(Math.random() * 1000),
        multiplier: (Math.random() * (5 - 1) + 1).toFixed(2),
    };
}

// Generate a random current bet amount
function getRandomBetAmount() {
    return parseFloat((Math.random() * (10 - 1) + 1).toFixed(2));
}

// Generate random bet history
function generateRandomBetHistory() {
    let betHistory = [];
    for (let i = 0; i < 5; i++) {
        betHistory.push({
            created_at: new Date(),
            amount: (Math.random() * (100 - 10) + 10).toFixed(2),
            cashout_multiplier: (Math.random() * (5 - 1) + 1).toFixed(2),
        });
    }
    return betHistory;
}

// Simulate functions that were part of the original logic


function check_game_running(event) {

}

$(document).ready(function () {
    check_game_running("check");
    // gamegenerate();
});