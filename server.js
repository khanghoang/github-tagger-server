import Express from 'express';

const app = new Express();
app.get('/', (req, res) => {
  res.send('hi there');
});

const port = process.env.PORT || 3333;

app.listen(port, () => {
  console.log(`🐶  server runs on port ${port}`);
});
