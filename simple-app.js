const express = require('express');
const app = express();
const PORT = 4000;

app.get('/', (req, res) => {
    res.send('<h1> EHB-Agent Platform</h1><p>Successfully running on Port 4000!</p><p><a href="/health">Health Check</a></p>');
});

app.get('/health', (req, res) => {
    res.json({ status: 'OK', port: 4000, message: 'EHB-Agent Platform is working!' });
});

app.listen(PORT, () => {
    console.log(' EHB-Agent Platform running on port 4000');
    console.log(' Open: http://localhost:4000');
});
