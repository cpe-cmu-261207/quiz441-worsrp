import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import fs from 'fs'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { body, query, validationResult } from 'express-validator'
import e from 'express'

const app = express()
app.use(bodyParser.json())
app.use(cors())

const PORT = process.env.PORT || 3000
const SECRET = "SIMPLE_SECRET"

interface JWTPayload {
  username: string;
  password: string;
}

interface DbSchema {
  users: User[]
}

interface User {
  id: number
  username: string
  password: string
  firstname: string
  lastname: string
  balance: number
}

interface schema {
  users: User[]
}

type LoginArgs = Pick<User, 'username' | 'password'>
app.post<any, any, LoginArgs>('/login', async (req, res) => {
    const { username, password } = req.body
    // Use username and password to create token.
    const raw = fs.readFileSync('db.json', 'utf8')
    const db: DbSchema = JSON.parse(raw)
    const user = await db.users.find(user => user.username === req.body.username) 
    if (!user) { // if input username does not has in the data base
      res.status(400).json({ message: 'Invalid username or password' })
      return
    }
    if (!bcrypt.compareSync(req.body.password, user.password)) { // if input password does not has in the data base
      res.status(400).json({ message: 'Invalid username or password' })
      return
    }
    const token = jwt.sign({ username: user.username, password: user.password }, SECRET) // token declaration
    console.log(token)
    return res.status(200).json({
      message: 'Login succesfully',
      token: token
    })
  })

  type RegisterArgs = Omit<User, 'id'>
app.post<any, any, RegisterArgs>('/register', (req, res) => {
    const { username, password, firstname, lastname, balance } = req.body
    const raw = fs.readFileSync('db.json', 'utf8')
    const db: DbSchema = JSON.parse(raw)
    const hashPassword = bcrypt.hashSync(req.body.password, 10)
    const usrname = db.users.find(user => user.username === req.body.username);
    if(usrname){
      res.status(400).json({ message: 'Username is already in used' })
      return
    }
    db.users.push({
      ...{ username, password, firstname, lastname, balance },
      id: Date.now(),             // use current date as id  
      password: hashPassword,
    })
    fs.writeFileSync('db.json', JSON.stringify(db))
    res.status(200).json({ message: 'Register complete' })
  })

app.get('/balance', (req, res) => {
  const token = req.query.token as string || req.headers.authorization?.split(' ')[1] as string
  const raw = fs.readFileSync('db.json', 'utf8')
  const db: DbSchema = JSON.parse(raw)
  console.log(token)
  try {
    const { username } = jwt.verify(token, SECRET) as JWTPayload
    const data = db.users.find(user => user.username === { username }.username) 
    res.status(200).json({ data: data })
  }
  catch (e) {
    //response in case of invalid token
    res.status(401).json({ message: 'Invalid token' , emess: e.message})
  }
  })

app.post('/deposit',
  body('amount').isInt({ min: 1 }),
  (req, res) => {

    //Is amount <= 0 ?
    if (!validationResult(req).isEmpty())
      return res.status(400).json({ message: "Invalid data"})
  })

app.post('/withdraw',
  (req, res) => {
  })

app.delete('/reset', (req, res) => {

  //code your database reset here
  const raw = fs.readFileSync('db.json', 'utf8')
  const db: DbSchema = JSON.parse(raw)
  db.users.splice(0,db.users.length)
  fs.writeFileSync('db.json', JSON.stringify(db))
  return res.status(200).json({
    message: 'Reset database successfully'
  })
})

app.get('/me', (req, res) => {
  res.status(200).json({ firstname: 'Sirapop' , lastname: 'Para', code: 620610815, gpa: 3.57})
})

app.get('/demo', (req, res) => {
  return res.status(200).json({
    message: 'This message is returned from demo route.'
  })
})

app.listen(PORT, () => console.log(`Server is running at ${PORT}`))