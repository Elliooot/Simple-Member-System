const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://mongo:mongo123@myserver.ilhxoot.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
let db = null;
async function initDB(){
    try{
        await client.connect();
        console.log("Successfully connected to server");
        db = client.db("website");
    }catch(e){
        console.log("Connection failed", e);
    }
}
initDB();

const express=require("express");
const parser=require("body-parser");
const session=require("express-session");
const app=express();
app.use(session({
    secret:"Random",
    resave:false,
    saveUninitialized:true
}));
app.use(parser.urlencoded({extended:true}));
app.set("view engine", "ejs");
app.use(express.static("public"));

app.post("/signup", async function(req, res){
    let name = req.body.name;
    let email = req.body.email;
    let password = req.body.password;
    let collection = db.collection("user");
    let result = await collection.findOne({
        email:email
    });
    if(result == null){
        await collection.insertOne({
            name: name, email:email,
            password: password, level:0
        });
        res.redirect("/");
    }else{
        res.redirect("/error?message=Repeated_Email");
    }
});
app.get("/error", function(req, res){
    let message = req.query.message;
    res.render("error.ejs", {message:message});
});

app.post("/signin",  async function(req, res){
    let email = req.body.email;
    let password = req.body.password;
    let collection = db.collection("user");
    let result = await collection.findOne({
        $and:[
            {email:email},
            {password:password}
        ]
    });
    if(result == null){
        req.session.user = null;
        res.redirect("/error?message=Account_or_password_input_error");
    }else{
        req.session.user = {
            email:result.email, name:result.name
        };
        res.redirect("/member");
    }
});
app.get("/member", async function(req, res){
    if(req.session.user == null){
        res.redirect("/");
    }else{
        let collection = db.collection("message");
        let results = await collection.find({}, {
            sort:{
                time:-1
            }
        });
        let messages = [];
        await results.forEach((data)=>{
            messages.push(data);
        });
        res.render("member.ejs", {name:req.session.user.name, messages:messages});
    }
});
app.get("/signout", function(req, res){
    req.session.user=null;
    res.redirect("/");
});

app.post("/postMessage", async function(req, res){
    if(req.session.user == null){
        res.redirect("/");
        return;
    }
    let content = req.body.content;
    let name = req.session.user.name;
    let collection = db.collection("message");
    await collection.insertOne({
        name:name, content:content,
        time:Date.now()
    });
    res.redirect("/member");
});

app.listen(3000, function(){
    console.log("Server Started");
});
