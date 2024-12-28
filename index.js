const express=require("express");
const app=express();

const mongoose=require("mongoose");

const path=require("path");

const Chat=require("./models/chat.js");

const methodOverride=require("method-override");
const { nextTick } = require("process");

const ExpressError=require("./ExpressError");


app.set("views",path.join(__dirname,"views"));
app.set("view engine","ejs");
app.use(express.static(path.join(__dirname,"public")))
app.use(methodOverride("_method"));


//to parse the data
app.use(express.urlencoded({extended:true}));

//Connection Formation 
main().then(()=>{
    console.log("connection successful");
}).catch((err)=>console.log(err));

async function main(){
    await mongoose.connect("mongodb://127.0.0.1:27017/whatsapp");
};

/*
let chat1=new Chat(
{
    from:"neha",
    to:"preeti",
    msg:"send me notes for the exam",
    created_at:new Date()
});

chat1.save().then((res)=>console.log(res));
*/

//Index Route -which contains total info of chats
app.get("/chats",async (req,res)=>
{
  try{
    let chats= await Chat.find();
    res.render("index.ejs",{chats});
  }
  catch(err){
    next(err);
}
   
});

//New Route
app.get("/chats/new",(req,res)=>{
    //throw new ExpressError(404,"Page not found");
    res.render("new.ejs");
});

//Create Route
app.post("/chats", asyncWrap(async (req,res,next)=>{
        let {from,to,msg}= req.body;
        let newChat=new Chat({
            from:from,
            to:to,
            msg:msg,
            created_at:new Date()
        });
        await newChat
        .save();
        res.redirect("/chats");
    
}));

function asyncWrap(fn){
    return function(req,res,next){
        fn(req,res,next).catch((err)=>next(err));
    }
}


//NEW - Show Route
app.get("/chats/:id", asyncWrap(async (req,res,next)=>{
        let {id}=req.params;
        let chat=await Chat.findById(id);
        if(!chat){
          next(new ExpressError(404,"chat not Found"));
        }
        res.render("edit.ejs",{chat});
   
}));

//Edit Route
app.get("/chats/:id/edit", asyncWrap(async (req,res)=>{
        let {id}=req.params;
        let chat=await Chat.findById(id);
        res.render("edit.ejs",{chat});
}));

//Update Route
app.put("/chats/:id", asyncWrap(async (req,res)=>{
        let {id}=req.params;
        let {msg:newMsg}=req.body;
        console.log(newMsg);
        let updatedChat = await Chat.findByIdAndUpdate(
            id,{msg:newMsg},{runValidate:true,new:true}
        );
        console.log(updatedChat);
        res.redirect("/chats");
})); 

//Delete Route
app.delete("/chats/:id",asyncWrap( async (req,res)=>{
        let {id}=req.params;
        let deletedChat= await Chat.findByIdAndDelete(id);
        console.log(`deleted: ${deletedChat}`);
        res.redirect("/chats");
  
}));

app.get("/",(req,res)=>{
    res.send("root is working"); 
})

const handleValidationErr = (err)=>{
    console.log("This was a Validation Error.Please follow rules");
    console.dir(err.message);
    return err;
}
app.use((err,req,res,next)=>{
    console.log(err.name);
    if(err.name==="ValidationError"){
        err=handleValidationErr(err);
    }
    next(err);
})

//Error Handler Middleware
app.use((err,req,res,next)=>{
    let {status=500,message="Some Error Occured"}=err;
    res.status(status).send(message);
});

app.listen(3000,()=>{
    console.log("app is listening at port 8080");
})