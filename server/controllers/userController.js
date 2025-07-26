

//api controller function to manage clerk user with database
//hhtp:localhost:4000/api/user/webhooks

export const clerkWebHooks = async (req, res) => {
    try {
        
        

    } catch (error) {
        console.log(error);
        res.send({success: false, message: error.message})
    }
} 