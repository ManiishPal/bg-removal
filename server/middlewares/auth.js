import jwt from 'jsonwebtoken'

//middleware function to decode jwt token to get clerkid
const authUser = async (req, res, next) => {
    try {
        
        const {token} = req.headers;

        if(!token) {
            return res.json({success:false, message:"Not authorized, Login again"})
        }

        const token_decode = jwt.decode(token)
        req.body = req.body || {};
        req.body.clerkId = token_decode.clerkId
        next();

    } catch (error) {
        console.log(error);
        res.send({success: false, message: error.message})
    }
}

export default authUser;