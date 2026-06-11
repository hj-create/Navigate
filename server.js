const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;
const ROOT_DIR = __dirname;

app.use(express.static(ROOT_DIR));

app.get('/', (req, res) => {
  res.sendFile(path.join(ROOT_DIR+"/src/", 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Navigate is running at http://localhost:${PORT}`);
});
