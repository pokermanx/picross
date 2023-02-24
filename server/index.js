const express = require("express");
const app = express();
const cors = require('cors');

const fs = require("fs");

app.use(cors());

app.get("/levels", function (req, res) {
  fs.readdir("./server/levels/", (err, files) => {
    res.send(files);
  });
});

app.get("/levels/:levelId", function (req, res) {
  fs.readFile(`./server/levels/${req.params.levelId}`, (err, file) => {
    if (err) {
        res.status(404);
    }
    res.send(file);
  });
});

app.listen(5500);
