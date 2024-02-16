
const express = require('express');
const cors = require('cors');
const { dbConnect } = require('./config/dbConfig');
const { postRouter } = require('./routers/postRouter');
const { userRouter } = require('./routers/userRouter');
require('dotenv').config();
const upload = require('express-fileupload');

const app = express();
app.get('/', (req, res)=>{
  res.send('hey')
})

app.use(upload());
app.use(cors({
  // origin: 'http://localhost:3000', // Replace with your frontend URL
  credentials: true, // Enable credentials (cookies, authorization headers, etc.)
}));

app.use(express.json());

app.use('/uploads', express.static(__dirname + '/uploads')); // location where user avatar is stored

app.use('/api/posts', postRouter);
app.use('/api/users', userRouter);

const port = process.env.PORT || 3000;
// console.log(process.env.PORT)
app.listen(port, () => {
  console.log(`server is listening at port : ${port}`);
  dbConnect();
});
