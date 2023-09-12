const Razorpay = require('razorpay');
const Order = require('../models/orders');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
// const userController = require('../controllers/user');

const generateAccessToken = (id, name, ispremiumuser) => {
    return jwt.sign({ userId: id, name: name, ispremiumuser} , process.env.JWT_token);
}

const purchasepremium = async (req,res,next) => {
    try {
        var rzp = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        })
        const amount = 2500;

        rzp.orders.create({amount, currency: "INR"}, (err, norder) => {
            if(err) {
                throw new Error(JSON.stringify(err));
            }
            const order = new Order({paymentid:"PENDING",orderid: norder.id, status: 'PENDING', userId: req.user._id})
            order.save()
            .then(() => {
                return res.status(201).json({ order , key_id : rzp.key_id});
            })
            .catch(err => {
                throw new Error(err);
            })
        })
    }
    catch(err) {
        console.log(err);
        res.status(403).json({ message: 'Something went wrong', error: err})
    }
}

const updateTransactionStatus = async (req,res,next) => {
    console.log(req.body);
    try {
        const userid = req.user.id;
        const { payment_id, order_id, id } = req.body;
        console.log(payment_id);
        console.log(order_id);
        console.log(id);

        await Order.findByIdAndUpdate({_id:id}, {paymentid:payment_id,orderid:order_id,status:"SUCCESSFULL",userId:req.user._id});
        await User.findByIdAndUpdate({_id:req.user._id},{isPremium:true})
        return res.status(202).json({success: true, message: "Transaction Successful", token: generateAccessToken(userid, undefined, true) })

        // const order = await Order.findOne({where: {orderid : order_id}})
        // const promise1 = order.update({ paymentid: payment_id, status: 'SUCCESSFUL'})
        // const promise2 = req.user.update({ ispremiumuser: true})

        // Promise.all([promise1, promise2])
        // .then(() => {
        //     return res.status(202).json({success: true, message: "Transaction Successful", token: userController.generateAccessToken(req.user.id, undefined, true) })
        // })
        // .catch((error) => {
        //     throw new Error(error)
        //     // req.user.update({ ispremiumuser: false})
        //     // order.update({ paymentid: payment_id, status: 'FAILED'})
        //     // return res.status(400).json({success: false, message: "Transaction failed"})
        // })
    }
    catch(err) {
        console.log(err);
        res.status(403).json({ message: 'Something went wrong', error: err})
    }
}


module.exports = {
    purchasepremium,
    updateTransactionStatus
}