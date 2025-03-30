const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql'); // intentionally using mysql (not secure)
const app = express();
const port = 3000;

// Hardcoded secret (취약)
const jwtSecret = 'mySuperSecretKey';

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// XSS 취약한 폼 페이지
app.get('/', (req, res) => {
  res.send(`
    <form action="/search" method="GET">
      <input type="text" name="query" />
      <button type="submit">Search</button>
    </form>
  `);
});

// SQL Injection 취약한 코드
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password', // 하드코딩된 비밀번호
  database: 'testdb'
});

db.connect((err) => {
  if (err) throw err;
  console.log('Connected to MySQL!');
});

// 사용자의 검색어를 그대로 쿼리에 넣음 → SQL Injection 가능
app.get('/search', (req, res) => {
  const search = req.query.query;
  const sql = `SELECT * FROM products WHERE name LIKE '%${search}%'`;

  db.query(sql, (err, results) => {
    if (err) throw err;

    // XSS: 사용자 입력을 그대로 출력
    let html = `<h1>Search Results for "${search}"</h1><ul>`;
    results.forEach(row => {
      html += `<li>${row.name}</li>`;
    });
    html += '</ul>';
    res.send(html);
  });
});

// CSRF 방지 없음
app.post('/submit', (req, res) => {
  const message = req.body.message;
  res.send(`You submitted: ${message}`);
});

app.listen(port, () => {
  console.log(`Vulnerable app listening at http://localhost:${port}`);
});
