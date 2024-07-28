const express=require('express');
const crypto=require('crypto');
const {userModel}=require('../models/userModels');
const {sendResetLink}=require('../utils/mail');
const {forgotAuth}=require('../auth/createAuth');
const {hashPassword}=require('../utils/securePassword')
const forgotRouter=express.Router();

function generateToken(){
    const token =crypto.randomBytes(32).toString('hex')
    console.log(token);
    return token;
}

forgotRouter.post('/forgot-password',async(req,res)=>{
    console.log('entered forgot password');
    const {email}=req.body;
    const userData=await userModel.findOne({email:email});
    if(userData===null) return res.send({status:404,msg:'No such user exist'});
    const token=generateToken();
    // sending reset link in email
    const resetInfo= await sendResetLink({fname:userData.fname,token:token,to:email})
    if(resetInfo==='Success'){
        req.session.resetData={token:token,email:email};
        return res.send({status:200,msg:'success'})        
    }else{
        console.log('some error occured');
        console.log(resetInfo);
        return res.send({status:300,msg:'some error occured in sending reset link'})
    }
})

forgotRouter.post('/reset-password/:token',forgotAuth,async(req,res,next)=>{
    console.log('entered reset-passw');
    const passwd=req.body.passwd;
    const resetData=req.session.resetData;
    const token=req.params.token;
    console.log(req.url);
    console.log(passwd);
    console.log(resetData);
    console.log('token in params is ')
    console.log(token);
    const tokenVal=token.slice(1)
    let a=((token.slice(1))!=resetData.token)?'not equal ':'equal'
    console.log(a);
    if((tokenVal)!==resetData.token) return res.send({status:300,msg:'invalid url'});
    //if valid token
    const hashpasswd=  hashPassword(passwd)
    const updatedUser= await userModel.findOneAndUpdate({email:resetData.email},{$set: {passwd:hashpasswd}});
    delete req.session.resetData;//deleting session data which has reset details
    if(updatedUser!==null){
        return res.send({status:200,msg:'success updated password'})
    }else{
        return res.send({status:500,msg:'some issues in server, please try again later'})
    }
})

module.exports=forgotRouter;