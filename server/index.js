import express from 'express';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import cors from 'cors';
import pool from './db.js';

dotenv.config();

const app = express();

app.use(cors());

app.use(express.json());

app.post('/store', async(req,res)=> {
    try {
        const {key, code} = req.body;
        const existing = await pool.query(
            'SELECT * FROM codes WHERE code_key = $1',
            [key]
        );
        const query = existing.rows.length===0 ? 'INSERT INTO codes(code_key, code) VALUES($1, $2) RETURNING *' :
        'UPDATE codes SET code = $2 WHERE code_key = $1 RETURNING *';

        const result = await pool.query(
            query,
            [key, code]
        );
        res.json({success: true});
    } catch(err) {
        res.status(500).json({success: false, message: err.message});
    }
});

app.post('/fetch', async(req,res)=> {
    try {
        const { key, password } = req.body;

        const result = await pool.query(
            'SELECT * FROM codes WHERE code_key=$1',
            [key]
        );

        if(result.rows.length===0) {
            return res.status(404).json({success: false, message: 'Code not found'});
        }

        const codeEntry = result.rows[0];
        if(codeEntry.is_locked) {
            if(!password) {
                return res.json({
                    success: false,
                    message: "Code Locked!\nPlease enter your Password to access code!"
                })
            }
            const compare =  await bcrypt.compare(password,codeEntry.password);
            if(!compare) {
                return res.json({
                    success: false,
                    message: "Wrong Password!"
                })
            }
        }

        res.json({success: true, code: codeEntry.code, is_locked: codeEntry.is_locked});

    } catch(err) {
        res.status(500).json({success: false, message: err.message});
    }
});

app.post('/lock', async(req,res)=> {
    try {
        const {key, password} = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'UPDATE codes SET password = $1, is_locked = true WHERE code_key = $2 RETURNING *',
            [hashedPassword, key]
        );
        res.json({success: true});
    } catch(err) {
        res.status(500).json({success: false, message: err.message});
    }
});

app.get('/', (req,res)=> {res.send("api working")});

const PORT = process.env.port || 5000;
app.listen(PORT, ()=>{
    console.log(`server connected at port ${PORT}`)
})