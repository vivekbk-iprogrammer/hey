const jwt = require('jsonwebtoken');


const authMiddleware = async (req, res, next)=>{
    // console.log('her in middle')
    const Authorization = req.headers.Authorization || req.headers.authorization;
   
    if(Authorization && Authorization.startsWith("Bearer")){
        const token = Authorization.split(' ')[1];
        jwt.verify(token, process.env.JWTKEY, (err, info) =>{
            if(err){
                return res.status(403).json({error: "Unauthorized. Invalid token"});
            }

            req.user = info;
            next();
        });
    }else{
        return res.status(402).json({error: "Unauthorized. No token"});
    }
}

module.exports = {authMiddleware}