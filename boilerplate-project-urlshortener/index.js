require('dotenv').config();
const bodyParser = require('body-parser');
const express = require('express');
const cors = require('cors');
const dns = require('dns');
const urlParser = require('url');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({extended: false}));
app.use('/public', express.static(`${process.cwd()}/public`));

const urlDatabase = new Map();
let urlCounter = 0;

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

/* /api/shorturl and get a JSON response with original_url and short_url properties. 
Here's an example: { original_url : 'https://freeCodeCamp.org', short_url : 1}*/

app.get('/api/shorturl/:short_url', (req, res) => {
  const shortUrl = Number(req.params.short_url);
  const url = urlDatabase.get(shortUrl);

  if (!url) {
    return res.json({error: 'no short url found for the given input'});
  }
  res.redirect(url);
})

app.post('/api/shorturl', (req, res) => {
  const { url } = req.body;
  const parsedUrl = urlParser.parse(url);
  if (!parsedUrl.protocol || !parsedUrl.hostname) {
    return res.json({error: 'invalid url'});
  }
  dns.lookup(parsedUrl.hostname, (err) => {
    if (err) {
      return res.json({error: 'invalid url'});
    }
    urlCounter++;
    urlDatabase.set(urlCounter, url);
    res.json({ original_url: url, short_url: urlCounter });
  })
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
