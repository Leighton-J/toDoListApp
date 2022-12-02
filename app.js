//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
require("dotenv").config();

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect(process.env.MONGO_DB_URL);

const itemsSchema = {
  name: String
};

const Item = mongoose.model(
  "Item",
  itemsSchema
);

const newItem = new Item ({
  name: "Welcome to your new todolist!"
});

const newItem2 = new Item ({
  name: "Hit the + button to add a new item"
});

const newItem3 = new Item ({
  name: "press the checkbox to remove"
});

const defaultItems = [newItem, newItem2, newItem3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

const workItems = [];

app.get("/", function(req, res) {

  Item.find({},function(err, foundItems){
    if (foundItems.length === 0){
      Item.insertMany(defaultItems, function(err){
        if(err){
          console.log(err)
        } else {
          console.log("data succesfully added")
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });

  

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item ({
    name: itemName
  });

  if (listName === "Today"){
    
    item.save();
    res.redirect("/");

  } else {
    List.findOne({name: listName}, function(err, foundList){
      if(err){
        console.log(err);
      } else{
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
      };
    });
  };
});

app.post("/delete", function(req,res){
  const checkedItemID = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today"){
    Item.findByIdAndRemove(checkedItemID, function(err){
      if(err){
        console.log(err);
      } else{
        console.log("successfully deleted");
        res.redirect("/");
      };
    });
  } else {
    List.findOneAndUpdate(
      {name: listName}, 
      // pull from our items array, the item with the id of checkedItemID
      {$pull: {items: {_id: checkedItemID}}}, function(err, foundList){
        if (!err){
          res.redirect("/" + listName);
        }
        else{
          console.log(err);
        }
      }
    )};
  
});

app.get("/:customListName", function(req,res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, foundList){
    if(err){
      console.log(err)
    }else if(!foundList){
      const list = new List ({
        name: customListName,
        items: defaultItems
      });
    
      list.save();
      res.redirect("/" + customListName);
    }else {
      res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
    }
  }); 

});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
