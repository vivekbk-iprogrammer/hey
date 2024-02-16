const Joi = require('joi');

const userValidation = (req, res, next)=>{
    const { name, email, password, password2 } = req.body;
    const userInfo = {
        name,
        email,
        password,
        password2
    }
    const userSchema = Joi.object({
        name: Joi.string()
            .min(3)
            .max(30)
            .required(),
    
        password: Joi.string()
            .pattern(new RegExp('^[a-zA-Z0-9!@#$%^&*]{6,16}$')),
    
        password2: Joi.ref('password'),

        posts: Joi.number()
            .integer(),
    
        email: Joi.string()
            .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } })
    })
    
   const {error} = userSchema.validate(userInfo);
   if(error){
    return res.status(400).json({error:error.details[0].message})
   }
   next()
}

module.exports = {userValidation};