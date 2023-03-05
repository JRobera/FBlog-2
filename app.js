const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const mongoose = require("mongoose");
const multer = require("multer");
var fs = require("fs");
var path = require("path");
const { stringify } = require("querystring");

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect(
  "mongodb+srv://admin-robera:Test123@cluster0.xnykbu4.mongodb.net/MyBlogDB",
  { useNewUrlParser: true }
);

const AdminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "pleace add username"],
  },
  password: {
    type: String,
    required: [true, "pleace add userpassword"],
  },
});
const Admins = mongoose.model("Admin", AdminSchema);

const admin = new Admins({ name: "Robera", password: "123" });

const PostsSchema = new mongoose.Schema({
  postTitle: {
    type: String,
    required: [true, "pleace add post title"],
  },
  postImage: {
    data: Buffer,
    contentType: String,
    // required: true,
  },
  postBody: {
    type: String,
    required: [true, "pleace add post body"],
  },
  postDate: {
    type: String,
  },
});
const Posts = mongoose.model("Post", PostsSchema);

const AboutSchema = new mongoose.Schema({
  avatar: {
    data: Buffer,
    contentType: String,
  },
  name: {
    type: String,
    required: [true, "pleace enter author name"],
  },
  position: {
    type: String,
    required: [true, "pleace enter author position"],
  },
  background: {
    type: String,
    required: [true, "pleace enter author background"],
  },
});

const About = mongoose.model("About", AboutSchema);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, __dirname + "/public/images");
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + "-" + Date.now());
  },
});

const upload = multer({ storage: storage });

const admindata = { name: "", password: "" };

app.get("/", (req, res) => {
  Posts.find((err, posts) => {
    if (err) {
      console.log(err);
    } else {
      res.render("home", { posts: posts });
    }
  });
});
app.post("/", (req, res) => {
  const searchrequest = _.capitalize(req.body.search);
  Posts.findOne({ postTitle: searchrequest }, (err, result) => {
    if (result) {
      res.render("post", {
        title: result.postTitle,
        image: result.postImage,
        content: result.postBody,
      });
    } else {
      res.send(
        "<h1 style='background-color: lavender; margin: 0; padding: 100px; text-align: center; position: relative; top: 30%; font-family: Courier, monospace;'>Article not found</h1>"
      );
    }
  });
});

app.get("/about", (req, res) => {
  About.findOne((err, found) => {
    res.render("about", {
      avatar: found?.avatar,
      name: found?.name,
      position: found?.position,
      background: found?.background,
    });
  });
});

app.get("/post/:topics", (req, res) => {
  const topic = _.capitalize(req.params.topics);
  Posts.findOne({ postTitle: topic }, (err, result) => {
    if (err || !result) {
      res.send(
        "<h1 style='background-color: lavender; margin: 0; padding: 100px; text-align: center; position: relative; top: 30%; font-family: Courier, monospace;'>404 page not found!</h1>"
      );
    } else {
      res.render("post", {
        title: result.postTitle,
        image: result.postImage,
        content: result.postBody,
      });
    }
  });
});

app.get("/admin", (req, res) => {
  res.render("admin");
});

app.post("/admin", (req, res) => {
  admindata.name = req.body.adminname;
  admindata.password = req.body.adminpassword;
  res.redirect("/admin/compose");
});

app.post("/admin/adduser", (req, res) => {
  if (req.body.username && req.body.userpassword) {
    Admins.findOne({ name: req.body.username }, (err, found) => {
      if (!found) {
        const newadmin = new Admins({
          name: req.body.username,
          password: req.body.userpassword,
        });
        newadmin.save();
      }
    });
    res.redirect("/admin");
  } else {
    res.send(
      "<h1 style='background-color: lavender; margin: 0; padding: 100px; text-align: center; position: relative; top: 30%; font-family: Courier, monospace;'>All inputs are required</h1>"
    );
  }
});
app.post("/admin/deleteuser", (req, res) => {
  Admins.findOneAndDelete(
    { name: req.body.deleteusername },
    (err, found) => {}
  );
  res.redirect("/admin");
});
app.post("/admin/changepassword", (req, res) => {
  Admins.findOne({ password: req.body.oldpassword }, (err, found) => {
    if (found) {
      Admins.findOneAndUpdate(
        { name: req.body.changeusername },
        { password: req.body.newpassword },
        () => {}
      );
    }
  });
  res.redirect("/admin");
});
app.post("/admin/deletepost", (req, res) => {
  Posts.findOneAndDelete(
    { postTitle: req.body.deleteposttitle },
    (found) => {}
  );
  res.redirect("/admin");
});
app.post("/admin/about", upload.single("authoravatar"), (req, res) => {
  if (
    req.body.authorname &&
    req.body.authorposition &&
    req.body.authorbackground
  ) {
        About.findOneAndUpdate(
          { name: req.body.authorname },{
          $set:{
            avatar: { data: fs.readFileSync(path.join(__dirname + "/public/images/" + req.file.filename)), 
            contentType: "images/*" },
            name: req.body.authorname,
            position: req.body.authorposition,
            background: req.body.authorbackground,
          }},
          (err,found) => {
            if(!found){
              About.deleteMany({}, () => {});
        const Author = new About({
          avatar: { data: fs.readFileSync(path.join(__dirname + "/public/images/" + req.file.filename)), 
          contentType: "images/*" },
          name: req.body.authorname,
          position: req.body.authorposition,
          background: req.body.authorbackground,
        });
        Author.save();
            }
          }
        );
      
    res.redirect("/admin");
  } else {
    res.send(
      "<h1 style='background-color: lavender; margin: 0; padding: 100px; text-align: center; position: relative; top: 30%; font-family: Courier, monospace;'>All inputs are required</h1>"
    );
  }
});

app.get("/admin/compose", (req, res) => {
  Admins.findOne(
    { name: admindata.name, password: admindata.password },
    (err, found) => {
      if (found) {
        res.render("compose");
      } else {
        res.redirect("/admin");
      }
    }
  );
});

app.post("/admin/compose", upload.single("postImage"), (req, res, next) => {
  if (req.body.postTitle && req.file.filename && req.body.postBody) {
    Posts.findOne({ postTitle: req.body.postTitle }, (err, posttitle) => {
      if (!posttitle) {
        const post = new Posts({
          postTitle: _.capitalize(req.body.postTitle),
          postImage: {
            data: fs.readFileSync(
              path.join(__dirname + "/public/images/" + req.file.filename)
            ),
            contentType: "image/*",
          },
          postBody: req.body.postBody,
          postDate: new Date().toLocaleDateString(undefined, {
            month: "long",
            day: "numeric",
            year: "numeric",
          }),
        });
        post.save();
        res.redirect("/");
      } else {
        console.log("Already exists");
      }
    });
  } else {
    res.send(
      "<h1 style='background-color: lavender; margin: 0; padding: 100px; text-align: center; position: relative; top: 30%; font-family: Courier, monospace;'>All inputs are required</h1>"
    );
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("server running on port 3000");
});
