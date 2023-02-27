global.crypto = require('crypto')

const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');

const fs = require('fs');
const { uuid } = require('./utils/general');
const { getImageFromMap } = require('./utils/images');

app.use(cors());
app.use(bodyParser.json());

app.get('/levels', (req, res) => {
  fs.readdir('./server/levels/', (err, files) => {
    res.send(files.filter(x => x.indexOf('.json') !== -1));
  });
});

app.get('/levels/:levelId', (req, res) => {

  const stage = req.query.stage;

  fs.readFile(`./server/levels/${req.params.levelId}`, (err, file) => {
    if (err) {
      res.status(404);
    }
    res.send(file);
  });
});

app.post('/levels', (req, res) => {
  const level = req.body;

  const previews = level.levelMap.map((map, i) =>
    getImageFromMap(
      level.boardWidth,
      level.boardHeight,
      map,
      `${level.name}-${i}`
    )
  );

  Promise.all(previews).then(paths => {
    const parsedLevel = {
      ...level,
      levelMap: level.levelMap.map((map, i) => ({
        map,
        preview: paths[i]
      }))
    };

    fs.writeFile(`./server/levels/${level.name}.json`, JSON.stringify(parsedLevel), () => {
      res.status(200);
      res.send(parsedLevel);
    });
  });
});

// Promise.all([item1, item2]).then(val => console.log(val))
app.listen(5500);
