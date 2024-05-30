import express from 'express';
import identifyRouter from './routes/identify';

const app = express();
const port = 3000;

app.use(express.json());
app.use('/api', identifyRouter);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
