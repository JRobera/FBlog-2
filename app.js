const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-robera:Test123@cluster0.xnykbu4.mongodb.net/MyBlogDB", {useNewUrlParser: true});

const AdminSchema = new mongoose.Schema({
    name: {
        type: String, 
        required: [true, "pleace add username"]
    },
    password: {
        type: String, 
        required: [true, "pleace add userpassword"]
    }
});
const Admins = mongoose.model("Admin", AdminSchema);

const admin = new Admins({name: "Robera", password: "123"});

const PostsSchema = new mongoose.Schema({
    postTitle: {
        type: String, 
        required: [true, "pleace add post title"]
    },
    postImage: {
        type: String, 
        // required: [true, "pleace add post image"]
    },
    postBody: {
        type: String, 
        required: [true, "pleace add post body"]
    }
});
const Posts = mongoose.model("Post", PostsSchema);

const AboutSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "pleace enter author name"]
    },
    position: {
        type: String,
        required: [true, "pleace enter author position"]
    },
    background: {
        type: String,
        required: [true, "pleace enter author background"]
    }
});

const About = mongoose.model("About", AboutSchema);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, __dirname+"/public/images");
    },
    filename: (req, file, cb) =>{
        cb(null, Date.now() + path.extname(file.originalname))
    }
})

const upload = multer({storage: storage});

const admindata = {name: "", password: ""};

app.get("/", (req, res)=> {

    Posts.find((err, posts)=>{
        if(err) {
            console.log(err);
        }else {
            res.render("home",{posts: posts});
        }
    });
});
app.post("/", (req, res)=> {

    const searchrequest = _.capitalize(req.body.search);
    Posts.findOne({postTitle: searchrequest}, (err, result)=>{
        if(result) {
            res.render("post", {title: result.postTitle, content: result.postBody});
        }else {
            res.send("<h1>Article not found</h1>");
        }
    });

});

app.get("/about", (req, res)=> {
    About.findOne((err, found)=>{
        res.render("about",{name: found.name, position: found.position, background: found.background});
    });
    
});

app.get("/post/:topics", (req, res) =>{
    const topic = _.capitalize(req.params.topics);
    Posts.findOne({postTitle: topic}, (err, result)=>{
        if(err || !result) {
            res.send("<h1>404 page not found!</h1>")
        }else {
            res.render("post", {title: result.postTitle, content: result.postBody});
        }
    });
    
});

app.get("/admin", (req, res)=> {
    res.render('admin');
});

app.post("/admin", (req, res)=> {
    admindata.name = req.body.adminname;
    admindata.password = req.body.adminpassword;
    console.log(req.adminname);
    res.redirect("/admin/compose");
});

app.post("/admin/adduser", (req, res)=>{
    Admins.findOne({name: req.body.username}, (err, found)=>{
        if(!found){
            const newadmin = new Admins({name: req.body.username, password: req.body.userpassword});
            newadmin.save();
        }
    });
    res.redirect("/admin");
});
app.post("/admin/deleteuser", (req, res)=>{
    Admins.findOneAndDelete({name: req.body.deleteusername}, (err, found)=>{});
    res.redirect("/admin");
});
app.post("/admin/changepassword", (req, res)=> {
    Admins.findOne({password: req.body.oldpassword}, (err, found)=>{
        if(found){
            Admins.findOneAndUpdate({name: req.body.changeusername}, {password: req.body.newpassword}, ()=>{});
        }
    });
    res.redirect("/admin");
});
app.post("/admin/deletepost", (req, res)=>{
    Posts.findOneAndDelete({postTitle: req.body.deleteposttitle}, (found)={});
    res.redirect("/admin");
});
app.post("/admin/about", (req, res)=>{
    About.findOne({name: req.body.authorname}, (err, found)=>{
        if(found) {
            About.findOneAndUpdate({name: req.body.authorname}, {name: req.body.authorname ,position: req.body.authorposition , background: req.body.authorbackground}, (found)=>{});
            
        } else {
            const Author = new About({
                name: req.body.authorname ,
                position: req.body.authorposition ,
                background: req.body.authorbackground
            });
            Author.save();
        }
    });
    res.redirect("/admin");
});

app.get("/admin/compose", (req, res)=> {
    Admins.find({name: admindata.name, password: admindata.password},(err, found)=>{
        if(found){
            res.render("compose");
        }else {
            res.redirect("/admin");
        }
    });
    
});

app.post("/admin/compose", upload.single("postImage"), (req,res) => {
    Posts.findOne({postTitle: req.body.postTitle }, (err, posttitle)=>{
        if(!posttitle){
            const post = new Posts({
                postTitle: req.body.postTitle,
                postImage: req.body.postImage,
                postBody: req.body.postBody
            });
            post.save();
            console.log(req.body.postImage);
            res.redirect("/");
        }else {
            console.log("Already exists");
        }
    });
});


app.listen(3000 ,()=>{
    console.log("server running on port 3000");
})

