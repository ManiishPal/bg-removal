import mongoose from "mongoose";

const transcationSchema = new mongoose.Schema({
    clerkId: {type: String, required: true},
    plan: {type: String, required: true},
    amount: {type: Number, required: true},
    credits: {type: Number, required: true},
    payment: {type: Boolean, default: false},
    date: {type: Number},
})

const transcationModel = mongoose.models.transcation || mongoose.model("transcation", transcationSchema)

export default transcationModel;