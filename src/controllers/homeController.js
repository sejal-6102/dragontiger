const { select } = require("async");
const connection = require("../config/connectDB");
// import jwt from 'jsonwebtoken'
// import md5 from "md5";
// import e from "express";

const homePage = async (req, res) => {
    let [setting] = await connection.query('SELECT `app`,`telegram` FROM admin');
    let app = setting[0].app;
    let telegram = setting[0].telegram;
    return res.render("home/index.ejs", { app,telegram});
}

const checkInPage = async (req, res) => {
    return res.render("checkIn/checkIn.ejs");
}

const checkDes = async (req, res) => {
    return res.render("checkIn/checkDes.ejs");
}

const checkRecord = async (req, res) => {
    return res.render("checkIn/checkRecord.ejs");
}

const addBank = async (req, res) => {
    return res.render("wallet/addbank.ejs");
}

// promotion
const promotionPage = async (req, res) => {
    return res.render("promotion/promotion.ejs");
}

const promotionmyTeamPage = async (req, res) => {
    return res.render("promotion/myTeam.ejs");
}

const promotionDesPage = async (req, res) => {
    return res.render("promotion/promotionDes.ejs");
}

const tutorialPage = async (req, res) => {
    return res.render("member/beginnersGuide.ejs");
}

const bonusRecordPage = async (req, res) => {
    return res.render("promotion/bonusrecord.ejs");
}

const partnerRewardPage = async (req, res) => {
    try {
        const auth = req.cookies.auth;

        const [userInfo] = await connection.execute('SELECT code FROM users WHERE token = ?', [auth]);
        if (userInfo.length === 0) {
            return res.status(404).send('User not found');
        }

        let totalCount = 0;

        async function fetchUserDataByCode(code, depth = 1) {
            if (depth > 6) {
                return;
            }

          
            const [userData] = await connection.query(
                "SELECT `id_user`, `name_user`, `phone`, `code`, `invite`, `rank`, `total_money` FROM users WHERE `invite` = ?",
                [code]
            );

            if (userData.length > 0) {
                for (const user of userData) {
                    totalCount++;
                    await fetchUserDataByCode(user.code, depth + 1);
                }
            }
        }

        
        await fetchUserDataByCode(userInfo[0].code);

        const [count] = await connection.execute(`
            SELECT 
              COUNT(DISTINCT member_phone) AS effectiveCount, 
              SUM(amount) AS totalAmount 
            FROM partner_reward
          `);
        const active = count[0].effectiveCount;
        const totalAmount = count[0].totalAmount;

        return res.render('promotion/partnerReward.ejs', { totalCount, active,totalAmount});

    } catch (error) {
        console.error('Error in partnerRewardPage:', error);
        return res.status(500).send('Internal Server Error');
    }
};


const comissionDetailsPage = async(req,res)=>{
    return res.render("promotion/commissionDetails.ejs");
}

// wallet
const walletPage = async (req, res) => {
    return res.render("wallet/index.ejs");
}

const rechargePage = async (req, res) => {
    return res.render("wallet/recharge.ejs", {
        MinimumMoney: process.env.MINIMUM_MONEY
    });
}

const rechargerecordPage = async (req, res) => {
    return res.render("wallet/rechargerecord.ejs");
}

const withdrawalPage = async (req, res) => {
    return res.render("wallet/withdrawal.ejs");
}

const withdrawalrecordPage = async (req, res) => {
    return res.render("wallet/withdrawalrecord.ejs");
}
const transfer = async (req, res) => {
    return res.render("wallet/transfer.ejs");
}

// member page
const mianPage = async (req, res) => {
    let auth = req.cookies.auth;
    const [user] = await connection.query('SELECT `level` FROM users WHERE `token` = ? ', [auth]);
    const [settings] = await connection.query('SELECT `cskh` FROM admin');
    let cskh = settings[0].cskh;
    let level = user[0].level;
    return res.render("member/index.ejs", { level, cskh });
}
const aboutPage = async (req, res) => {
    return res.render("member/about/index.ejs");
}

const attendance = async (req,res) => {
    return res.render("checkIn/reward.ejs")
}

const recordsalary = async (req, res) => {
    return res.render("member/about/recordsalary.ejs");
}

const Confidentiality = async (req, res) => {
    return res.render("member/about/Confidentiality.ejs");
}

const weeklyDeposit = [
    {
        deposit:10000,
        bonus:40,
    },
    {
        deposit:50000,
        bonus:250,
    },
    {
        deposit:200000,
        bonus:600,
    },
    {
        deposit:800000,
        bonus:2000,
    },
    {
        deposit:2000000,
        bonus:6000,
    },
    {
        deposit:5000000,
        bonus:13000,
    },
    {
        deposit:10000000,
        bonus:25000,
    },
]
  


const getActivityPage = async (req,res) => {
    const auth = req.cookies.auth;
    const currentDate = new Date();

    let [user] = await connection.query('SELECT * FROM users WHERE token = ?',[auth]);

    const weeklyClaimedArray = user[0].weekly_claimed.split(',').map(Number);
    

    // Print the array
    console.log(weeklyClaimedArray,'array'); // Output: [0, 0, 0, 0, 0, 0, 0]

    const startTime = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - (user[0].current_day - 1), 0, 1).getTime();

    const query = `
    SELECT *
    FROM recharge
    WHERE status = 1
      AND phone = ?
      AND time > ?
`;

   const [recharge] = await connection.execute(query, [user[0].phone, startTime])

const total = recharge.reduce((acc,val)=>acc+val.money,0) ;


    return res.render('Activity/Index.ejs',{total,weeklyDeposit,flagArray:weeklyClaimedArray});
}

const newtutorial = async (req, res) => {
    return res.render("member/newtutorial.ejs");
}

const activityRecords = async (req,res)=>{
    return res.render('Activity/record.ejs')
}

const forgot = async (req, res) => {
    let auth = req.cookies.auth;
    const [user] = await connection.query('SELECT `time_otp` FROM users WHERE token = ? ', [auth]);
    let time = user[0].time_otp;
    return res.render("member/forgot.ejs", { time });
}

const redenvelopes = async (req, res) => {
    return res.render("member/redenvelopes.ejs");
}

const riskAgreement = async (req, res) => {
    return res.render("member/about/riskAgreement.ejs");
}

const myProfilePage = async (req, res) => {
    return res.render("member/myProfile.ejs");
}

const getSalaryRecord = async (req, res) => {
    const auth = req.cookies.auth;

    const [rows] = await connection.query(`SELECT * FROM users WHERE token = ?`, [auth]);
    let rowstr = rows[0];
    if (!rows) {
        return res.status(200).json({
            message: 'Failed',
            status: false,

        });
    }
    const [getPhone] = await connection.query(
        `SELECT * FROM salary WHERE phone = ? ORDER BY time DESC`,
        [rowstr.phone]
    );


    console.log("asdasdasd : " + [rows.phone])
    return res.status(200).json({
        message: 'Success',
        status: true,
        data: {

        },
        rows: getPhone,
    })
}

let invitationMetrix = [
    {
        team:1,
        deposit:300,
        Bonus:55
    },
    {
        team:3,
        deposit:300,
        Bonus:155
    },
    {
        team:10,
        deposit:500,
        Bonus:555
    },
    {
        team:30,
        deposit:500,
        Bonus:1555
    },
    {
        team:70,
        deposit:500,
        Bonus:3555
    },
    {
        team:100,
        deposit:500,
        Bonus:5555
    },
    {
        team:200,
        deposit:500,
        Bonus:11555
    },
    {
        team:500,
        deposit:300,
        Bonus:25555
    },
    {
        team:1000,
        deposit:500,
        Bonus:55555
    },
    {
        team:2000,
        deposit:500,
        Bonus:111111
    },
    {
        team:5000,
        deposit:500,
        Bonus:277777
    },
    {
        team:10000,
        deposit:500,
        Bonus:555555
    },
    {
        team:20000,
        deposit:500,
        Bonus:1111111
    }
]

const invitationRewardPage = async (req,res)=>{
const auth = req.cookies.auth;
const [user] = await connection.execute('SELECT * FROM users WHERE token = ?',[auth]);

if(!user[0]){
    return res.status(200).json({
        message: 'Failed',
        status: false,

    });
}

const claimedArray = user[0].invitation_claimed.split(',').map(Number);
console.log(claimedArray,'claimedArray')
const [memebers] = await connection.execute('SELECT * FROM users WHERE invite = ?',[user[0].code]);
let activecount = 0;
let totalMember = memebers.length;

async function checkDeposit(phone,amount){
    let total = 0;
   const [recharge] = await connection.execute('SELECT money FROM recharge WHERE phone = ?',[phone]);

   recharge.forEach(val=>{
    total  = total + val.money;
    if(total>=amount){
        return true;
    }
   })

   return false;
 
}

if(memebers.length<=2){
    memebers.forEach(member=>{
     if(checkDeposit(member.phone,300)){
        activecount++;
     }
    })
}
else{
    memebers.forEach(member=>{
        if(checkDeposit(member.phone,500)){
           activecount++;
        }
       })
}
return res.render("Activity/invitationBonus.ejs",{activecount,totalMember,invitationMetrix,claimedArray});
}

const invitationRewardClaim = async (req,res)=>{
    const auth = req.cookies.auth;
    const {index,amount} = req.body;

    if(amount!==invitationMetrix[index].Bonus){
        return res.status(200).json({
            message: 'Failed',
            status: false,
    
        });
    }
    const [user] = await connection.execute('SELECT * FROM users WHERE token = ?',[auth]);
    if(!user[0]){
        return res.status(200).json({
            message: 'Failed',
            status: false,
    
        });

    }

    const claimedArray = user[0].invitation_claimed.split(',').map(Number);

    if(claimedArray[index] === 1){
        return res.status(200).json({
            message: 'Failed',
            status: false,
    
        }); 
    }

    claimedArray[index] = 1 ;

    const claimedStr = claimedArray.join(',');

    await connection.execute('UPDATE users SET win_wallet = win_wallet + ? ,invitation_claimed = ?',[amount,claimedStr]);

    
    return res.status(200).json({
        message: `Successfully received ${amount}`,
        status: true,
    });
}

const invitationRewardRules = async (req,res)=>{
    return res.render("Activity/invitationBonusRules.ejs");
}

const invitationRules = async (req,res)=>{
    return res.render("promotion/invitationRules.ejs");
}

const commisionDetailsPage = async (req,res)=>{
    return res.render("promotion/commissionDetails.ejs");
}

const rebateRatio = async (req,res)=>{
    return res.render("promotion/rebateRatio.ejs");
}

const partnerRecord = async (req,res)=>{
    const auth = req.cookies.auth;
    return res.render("promotion/partnerRewardRecord.ejs");
 }

 const notificationPage = async (req,res)=>{
    const [data] = await connection.execute('SELECT * FROM notification');
    return res.render("member/notification.ejs",{data});
 }


 const gamePage = async (req,res) =>{
    const auth = req.cookies.auth;
    const [user] = await connection.execute('SELECT phone,money,win_wallet FROM users WHERE token = ?',[auth]);
    const query = `
  SELECT * 
  FROM aviator WHERE status != 0
  ORDER BY id DESC 
  LIMIT 30;
`;

const [result] = await connection.execute(query);
const [betHistory] = await connection.execute(
    `SELECT ar.*, a.*, 
            DATE_FORMAT(ar.time, '%Y-%m-%d %H:%i:%s') AS formatted_time
     FROM aviator_result ar
     JOIN aviator a ON ar.period = a.id
     WHERE ar.phone = ?
     ORDER BY ar.period DESC`,  // Reverse order by period
    [user[0].phone]
  );
  
  
  
    res.render('aviator.ejs', {
        csrfToken: 'your_csrf_token',
        user: {
            currency: '₹',
            id: 12345,
        },
        wallet: user[0].money+user[0].win_wallet,
        settings: {
            minBetAmount: 10,
            maxBetAmount: 10000,
        },
        phone:user[0].phone,
        currentGameData: JSON.stringify({ id: 1, name: 'Game Name' }),
        result:result,
        betHistory:betHistory
    });
}


module.exports = {
    homePage,
    checkInPage,
    promotionPage,
    walletPage,
    mianPage,
    myProfilePage,
    promotionmyTeamPage,
    promotionDesPage,
    tutorialPage,
    bonusRecordPage,
    rechargePage,
    rechargerecordPage,
    withdrawalPage,
    withdrawalrecordPage,
    aboutPage,
    riskAgreement,
    newtutorial,
    redenvelopes,
    forgot,
    checkDes,
    checkRecord,
    addBank,
    transfer,
    recordsalary,
    getSalaryRecord,
    attendance,
    getActivityPage,
    activityRecords,
    partnerRewardPage,
    comissionDetailsPage,
    invitationRewardPage,
    invitationRewardClaim,
    invitationRewardRules,
    invitationRules,
    commisionDetailsPage,
    rebateRatio,
    partnerRecord,
    Confidentiality,
    notificationPage,
    gamePage
}