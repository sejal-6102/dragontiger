const connection = require("../config/connectDB");

const Aviator = async (io) => {
  let current_Value = 1.00;
  let speed = 0.01;
  let isFlying = true;
  let multiplierInterval;
  let betArray = [];
  
  let [poolValue] = await connection.execute('SELECT total_pool FROM admin');
  let [periodData] = await connection.execute('SELECT id FROM aviator WHERE status = 0');
  let currentPeriod = periodData[0]?.id;
  let pool = parseFloat(poolValue[0]?.total_pool);
  let flagPool = pool;
  let crashValue = 20;
  let amountToDistribute = 0;
  let totalAmount;
  let adminSet = 0;
  

  calculateCrash();
  startMultiplierCalculation();



  async function reduceWallet(amount,phone,bet){
    const [user] = await connection.execute('select money,win_wallet from users where phone = ?',[phone]);
    let wallet = user[0].money;
    let win = user[0].win_wallet;
    if(bet>wallet+win){
      return {status:false};
    }
    if(amount>wallet+win){
        return {status:false};
    }
    else{
        wallet = wallet - amount;
        if(wallet<0){
            win = win + wallet;
            wallet = 0 ;
        }
       await connection.execute('UPDATE users SET money = ? , win_wallet = ? where phone = ?',[wallet,win,phone]);
       return {status:true,wallet:win+wallet};
    }
  }

  function getRandomBetween(max) {
    let randomValue;
    do {
      randomValue = Math.random() * (max - 1) + 1;
    } while (randomValue === 1 || randomValue === max);
    return randomValue;
  }

  function startMultiplierCalculation() {
    const acceleration = 0.00005; 

     multiplierInterval = setInterval(() => {
        // Increase the multiplier based on the current speed
        current_Value += speed;


        // Increase the speed over time to add acceleration
        if(current_Value<5){
          speed += acceleration;
        }
        else if(current_Value<20){
          speed += acceleration*4;
        }

        else if(current_Value<50){
          speed += acceleration*20;
        }
       
        else if(current_Value<50){
          speed += acceleration*50;
        }

        else{
          speed += acceleration*100;
        }

        // Check if the current value has reached or exceeded the crash value
        if (current_Value >= crashValue) {
            handleCrash(crashValue);
            clearInterval(multiplierInterval); // Stop the interval
        }

        // Optional: Log the current value for debugging
        // console.log(`Current Value: ${current_Value.toFixed(2)}, Speed: ${speed.toFixed(4)}`);
    }, 100);
}


  async function handleCrash(val) {
    if(val<1.1){
      console.log(val,'crash value')
    }

    console.log(val,'crash value');

    crashValue = 5.0;
    
    io.emit('crash', { crash: val,period:currentPeriod });
    isFlying = false;
   
    

    if (betArray.length > 0) {
      await insertBetResults();
    }

    betArray = [];
    const [oldPool] = await connection.execute('select total_pool from admin');
    console.log(oldPool[0].total_pool,flagPool,'pool comarison')
    if(oldPool[0].total_pool==flagPool){
      await connection.execute('UPDATE admin SET total_pool = ?', [pool + amountToDistribute]);
    }
    const [updatedPool] = await connection.execute('SELECT total_pool FROM admin');
    pool = parseFloat(updatedPool[0].total_pool);
    flagPool = pool;
    amountToDistribute = 0;
     
    await connection.execute('UPDATE aviator SET status = ?, result = ? WHERE status = 0', [1, val]);
    await connection.execute('INSERT INTO aviator SET status = 0');
    const [newPeriod] = await connection.execute('SELECT id FROM aviator WHERE status = 0');
    currentPeriod = newPeriod[0].id;
   
    const [result] = await connection.execute('select aviator from admin');
    let adminValue = result[0].aviator;
    await connection.execute('UPDATE admin SET aviator = ?',[0.00]);



    setTimeout(() => {
    
      current_Value = 1;
      speed = 0.01;
      setTimeout(()=>{
        isFlying = true;
        if(adminValue != 0){
          crashValue = parseFloat(adminValue);
        }
        else{
          calculateCrash();
        }
      
      io.emit('newbet',betArray);
      startMultiplierCalculation();
      },1000)
      
    }, 6000);

  }

  async function insertBetResults() {
    const placeholders = betArray.map(() => '(?, ?, ?, ?, ?, ?)').join(', ');
    const query = `INSERT INTO aviator_result (phone, amount, type, period, crash, status) VALUES ${placeholders}`;
    const values = betArray.flatMap(bet => [
      bet.phone,
      parseInt(bet.bet_amount, 10) || 0,
      parseInt(bet.bet_type, 10) || 0,
      currentPeriod,
      parseFloat(bet.cashout) || 0.0,
      bet.status || 0
    ]);

    try {
      await connection.execute(query, values);
    } catch (error) {
      console.error("Error inserting bet data:", error);
    }
  }

  function calculateCrash() {
    totalAmount = betArray.reduce((acc, bet) => acc + parseInt(bet.bet_amount), 0);

    console.log(totalAmount,'_',betArray,'bet array');

    if (betArray.length < 1) {
      console.log('case1')
      const randomNum = Math.floor(Math.random() * 10) + 1;
      if(randomNum==7){
        crashValue = 1.00;
      }
      else if(randomNum==1 || randomNum==6){
        crashValue = getRandomBetween(5);
      }
      else if(randomNum==2){
        crashValue = getRandomBetween(10);
      }
      else if(randomNum==3){
        crashValue = getRandomBetween(30);
      }
      else if(randomNum==4){
        crashValue = getRandomBetween(100);
      }
      else if(randomNum==5){
        crashValue = getRandomBetween(200);
      }
    else{
      crashValue = getRandomBetween(300);
    }


     
    // console.log('step1')
    // crashValue = 100.00;
      return;
    }

    if (betArray.length <= 5 && totalAmount<=300 || betArray.length==1) {
      console.log('case2')
      const randomNum = Math.floor(Math.random() * 10) + 1;
      if(randomNum<=2){
        console.log('step1')
      crashValue = 1.00;
        return;
      }

      console.log('step2')
      const maxValue = (pool*0.25) / totalAmount;
      crashValue = maxValue <= 1 ? 1.00 : getRandomBetween(maxValue);
    } else {
      console.log('step3')
      amountToDistribute = totalAmount / 2;
    }
  }

 async function updateBetStatus(msg) {
    betArray = betArray.map(bet => (
      bet.phone === msg.phone && bet.section_no === msg.section_no
        ? { ...bet, status: 1,cashout:msg.crashOut}
        : bet
    ))
    await connection.execute('UPDATE users SET win_wallet = win_wallet + ? WHERE phone = ?',[parseInt(msg.bet_amount)*msg.crashOut,msg.phone]);
  }

  io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('initialValReq', () => {
      socket.emit('initialVal', { isFlying, current_Value,speed});
    });

    socket.on('bet', async (msg, callback) => {
      console.log('bet',msg)

      const totalBet = parseFloat(msg.reduce((acc, bet) => acc + parseFloat(bet.bet_amount), 0)/2);
        
        let data = [];
    
        for (const [index, val] of msg.entries()) {
            let data1 = await reduceWallet(parseInt(val.bet_amount), val.phone,totalBet);
            
            if (data1.status === false) {
                data.push(data1);
                // msg.splice(index, 1);
                break;


            } 
            else{
              console.log('hello at bet')
              pool = pool + parseFloat(val.bet_amount)/2;
              data.push(data1);
              betArray.push(val);
            }
           
               
        }
        // const pooltoAdd = parseFloat(msg.reduce((acc, bet) => acc + parseFloat(bet.bet_amount), 0)/2);
       
      
        callback(data);
    });
    

    socket.on('cashout', (msg, callback) => {
      if (!(betArray.length <= 5 && totalAmount <= 300 || betArray.length === 1) && amountToDistribute < parseInt(msg.bet_amount) * msg.crashOut) {
        handleCrash(current_Value);
        clearInterval(multiplierInterval);
        callback({status:false})
      } else {
        pool = pool - parseInt(msg.bet_amount)*msg.crashOut;
        updateBetStatus(msg);
        io.emit('cashoutNew',parseInt(msg.bet_amount)*msg.crashOut)
        callback(true);
      }
      
    });

    socket.on('getBetHistory',async (msg,callback)=>{
      const [betHistory] = await connection.execute(
        `SELECT ar.*, a.*, 
                DATE_FORMAT(ar.time, '%Y-%m-%d %H:%i:%s') AS formatted_time
         FROM aviator_result ar
         JOIN aviator a ON ar.period = a.id
         WHERE ar.phone = ? AND ar.period = ?
         ORDER BY ar.period DESC`,  // Reverse order by period
        [msg.phone,msg.period]
      );
      callback(betHistory);
    })

    socket.on('betData', (callback) => { 

      callback(betArray);
  });

  socket.on('crashNow',(callback)=>{
     if(isFlying){
      handleCrash(current_Value);
      clearInterval(multiplierInterval);
      callback(true)
     }
     else{
        callback(false);
     }
  })
  

    socket.on('disconnect', () => {
      console.log('A user disconnected');
    });
  });
};

module.exports = { Aviator };
