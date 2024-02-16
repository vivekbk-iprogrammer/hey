const { userModel } = require("../models/userModel");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const fs = require('fs');
const path = require('path');
const {v4: uuid} = require('uuid');

const register = async (req, res) => {
    try {
        console.log(req.body)
        const { name, email, password, password2 } = req.body;
        if (!name || !email || !password) {
            return res.status(422).json({ error: "All Fields are Mandatory" });
        }

        const newEmail = email.toLowerCase();
        const isEmailExists = await userModel.findOne({ email: newEmail })
        if(isEmailExists){
            return res.status(422).json({error: "Email Already Exists"});
        };

        if(password != password2){
            return res.status(422).json({error: "Password do not match"})
        }

        const hashPassword = bcrypt.hashSync(password, 10);
        const newUser = await userModel.create({name, email:newEmail, password: hashPassword});
        res.status(201).json(newUser);

    } catch (error) {
        console.log(error);
        return res.status(422).json({ error: "User Registration Failed." })
    }
}

const login = async (req, res) => {
    try {
        const { email, password} = req.body;
        if (!email || !password) {
            return res.status(422).json({ error: "All Fields are Required" });
        }

        const newEmail = email.toLowerCase();
        const isuser = await userModel.findOne({ email: newEmail })
        if(!isuser){
            return res.status(422).json({error: "Invalid credentials"});
        };
        const isPasswordCorrect =  bcrypt.compareSync(password, isuser.password);
        
        if(!isPasswordCorrect){
            return res.status(422).json({error: "Invalid credentials"})
        }
        const jwtKey = process.env.JWTKEY;
        const token = jwt.sign({id:isuser._id, name:isuser.name}, jwtKey, {expiresIn: '1d'});
        return res.status(200).json({token, id:isuser._id, name:isuser.name});

    } catch (error) {
        console.log(error);
        return res.status(422).json({ error: "User Login Failed." })
    }
}

const getUser = async (req, res) => {
    console.log('here in get user')
    try {
        const {id} = req.params;
        const user = await userModel.findById(id);
        if(!user){
            return res.status(404).json({error: "User not found"});
        }
        return res.status(200).json(user)
    } catch (error) {
        console.log(error);
        return res.status(422).json(error)
    }
}

const changeAvtar = async(req, res) => {
    //step to change avtar
    /*

    1. install express-fileupload libarary
    2. import in index.js and use it as a middelware

    */
    try {
        // console.log(req.files);
        // return res.json(req.files);
        if(!req.files || !req.files.avatar ){
        return res.status(422).json({error:"Please choose an image."}); 
        };

        //find user from db
        const user = await userModel.findById(req.user.id);
        //delete avatar if already exists
        if(user.avatar) {
            fs.unlink(path.join(__dirname,'..', 'uploads', user.avatar ), (err)=>{
                if(err){
                    return res.status(422).json(err);
                }
            })
        };

        const {avatar} = req.files;
        //check file size
        if(avatar.size > 500000){
            return res.status(422).json({error: "Profile picture too big. Should be less than 500kb"});
        };
        //change avatar name 
        let fileName;
        fileName = avatar.name;
        let splittedFileName = fileName.split('.')
        let newFileName =  splittedFileName[0] + uuid() + '.' + splittedFileName[splittedFileName.length -1];
        avatar.mv(path.join(__dirname, '..', 'uploads', newFileName), async (err)=>{
            if(err){
                return res.status(422).json(err);
            }
            const updatedAvatar = await userModel.findByIdAndUpdate(req.user.id, {avatar : newFileName}, {new: true} );
            if(!updatedAvatar){
                return res.status(422).json({error:"Avatar couldn't be changed."});   
            }
            return res.status(200).json(updatedAvatar);
        })
    } catch (error) {
        console.log(error)
        return res.status(422).json({error:"Internal Server Error"}); 
        
    }
}

const editUser = async(req, res) => {
    try {
        const {name, email, currentPassword, newPassword, confirmNewPassword} = req.body;
        if(!name || !email || !currentPassword || !newPassword || !confirmNewPassword){
            return res.status(422).json({error: "Fill in all fields"})
        }

        const user = await userModel.findById(req.user.id);
        if(!user){
            return res.status(404).json({error: "User not found"})
        }
        //make sure new email doesn't already exist
        const emailExists = await userModel.findOne({email});

        if(emailExists && (emailExists._id != req.user.id)){
            return res.status(422).json({error:"Email already exist"});
        }

        const validateUserPassword = bcrypt.compareSync(currentPassword, user.password);

        if(!validateUserPassword){
            return res.status(422).json({error:"Invalid current Password"});
        }

        if(newPassword !== confirmNewPassword){
            return res.status(422).json({error:"New password do not match"});
        }
        const hash = bcrypt.hashSync(newPassword, 10);
        const newInfo = await userModel.findByIdAndUpdate(req.user.id, {name, email, password:hash}, {new:true});
    return res.status(200).json(newInfo);
    } catch (error) {
        console.log(error)
        return res.status(422).json({error:"Internal Server Error"}); 
        
    }
}

const getAuthors = async (req, res) => {
    try {
        const authors = await userModel.find().select('-password'); //get authors details without thier password
         return res.status(200).json(authors)
    } catch (error) {
        console.log(error)
        return res.status(422).json(error); 
    }
}

module.exports = { register, login, getUser, changeAvtar, editUser, getAuthors }