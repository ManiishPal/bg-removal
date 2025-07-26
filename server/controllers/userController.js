import { Webhook } from "svix";
import userModel from "../models/userModel.js";
import razorpay from 'razorpay';
import transcationModel from "../models/transcationModel.js";

//api controller function to manage clerk user with database
//hhtp:localhost:4000/api/user/webhooks

export const clerkWebHooks = async (req, res) => {
    try {
        //create a svix instance with clerk webhook secret.
        const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET)

        await whook.verify(JSON.stringify(req.body), {
            "svix-id": req.headers["svix-id"],
            "svix-timestamp": req.headers["svix-timestamp"],
            'svix-signature': req.headers["svix-signature"]
        })

        const {data, type} = req.body;

        switch (type) {
            case "user.created":{
                const userData = {
                    clerkId: data.id,
                    email: data.email_addresses[0].email_address,
                    firstName: data.first_name,
                    lastName: data.last_name,
                    photo: data.image_url
                }

                await userModel.create(userData)
                res.json({})

                break;
            }
                
            case "user.updated":{
                    const userData = {
                    email: data.email_addresses[0].email_address,
                    firstName: data.first_name,
                    lastName: data.last_name,
                    photo: data.image_url
                    }

                    await userModel.findOneAndUpdate({clerkId: data.id}, userData)
                    res.json({})
                break;
            } 
        
            case "user.deleted":{
                await userModel.findOneAndDelete({clerkId: data.id})
                res.json({})
                break;
            }
        
            default:
                break;
        }

    } catch (error) {
        console.log(error);
        res.send({success: false, message: error.message})
    }
} 


//api controller function to get user available credits
export const userCredits = async (req, res) => {
    try {
        
        const {clerkId} = req.body
        const userData = await userModel.findOne({clerkId})

        res.json({success: true, credits: userData.creditBalance})

    } catch (error) {
        console.log(error);
        res.send({success: false, message: error.message})
    }
}

//gateway initialized
export const razorpayInstance = new razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

//api to make payment for credits
export const paymentRazorpay = async (req, res) => {
    try {
        
        const {clerkId, planId} = req.body
        const userData = await userModel.findOne({clerkId})

        if(!clerkId || !planId) {
            return res.json({success: false, message: "Invalid credentials"})
        }

        let credits, plan, amount, date;

        switch (planId) {
            case 'Basic':
                plan = 'Basic'
                credits = 100
                amount = 10
                break;

            case 'Advanced':
                plan = 'Advanced'
                credits = 500
                amount = 50
                break;
                
            case 'Business':
                plan = 'Business'
                credits = 5000
                amount = 250
                break;    
        
            default:
                return res.json({success: false, message: "Plan not found"});
        } 
        date = Date.now()

        //creating transcation
        const transcationData = {
            clerkId,
            plan,
            amount,
            credits,
            date
        }
        const newTranscation = await transcationModel.create(transcationData)

        const options = {
            amount: amount * 100,
            currency: process.env.CURRENCY,
            receipt: newTranscation._id
        }

        await razorpayInstance.orders.create(options, (error, order) => {
            if(error) {
                console.log(error);
                return res.json({success: false, message: error})
            }
            res.json({success: true, order})
        })

    } catch (error) {
        console.log(error);
        res.send({success: false, message: error.message})
    }
}


//api controller function to verfiy razorpay payment
export const verifyRazorpay = async (req, res) => {
    try {
        const  {razorpay_order_id} = req.body;
        
        const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id)

        if(orderInfo.status === 'paid') {
            const transcationData = await transcationModel.findById(orderInfo.receipt)
            if(transcationData.payment) {
                return res.json({success: false, message: "Payment Failed"})
            }
            //adding credits in user data
            const userData = await userModel.findOne({clerkId: transcationData.clerkId})
            const creditBalance = userData.creditBalance + transcationData.credits
            await userModel.findByIdAndUpdate(userData._id, {creditBalance})

            //making the payment true
            await transcationModel.findByIdAndUpdate(transcationData._id, {payment: true})

            res.json({success: true, message: "Credits Added"})
        } else {
            return res.json({success: false, message: "Payment Failed"})
        }

    } catch (error) {
        console.log(error)
        res.json({success: false, message: error.message})
    }
}