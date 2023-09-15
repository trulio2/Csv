import express from 'express';
import multer from 'multer';
import cors from 'cors';
import csv from 'csv-parser';
import fs from 'fs';
import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('database.db');

const app = express();
const port = 3000;

db.serialize(() => {
  db.run('CREATE TABLE IF NOT EXISTS users (id INTEGER, data TEXT)');
});

app.use(cors());

const upload = multer({
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    if (file.originalname.match(/\.(csv)$/)) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  },
});

app.post('/api/files', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Error while uploading file.' });
  }

  const filePath = req.file.path;
  let tempData = [];

  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (row) => {
      tempData.push(row);
    })
    .on('end', () => {
      fs.unlinkSync(filePath);

      const currentTimestamp = Date.now();

      db.serialize(async () => {
        const stmt = db.prepare('INSERT INTO users VALUES (?, ?)');

        const runAsync = (timestamp, row) =>
          new Promise((resolve, reject) => {
            stmt.run(timestamp, JSON.stringify(row), (err) => {
              if (err) reject(err);
              else resolve();
            });
          });

        const finalizeAsync = () =>
          new Promise((resolve, reject) => {
            stmt.finalize((err) => {
              if (err) reject(err);
              else resolve();
            });
          });

        try {
          for (const row of tempData) {
            await runAsync(currentTimestamp, row);
          }
          await finalizeAsync();
          res.status(200).json({ fileId: currentTimestamp });
        } catch (err) {
          console.log(err);
          res.status(500).json({ error: 'Database error' });
        }
      });
    });
});

app.get('/api/users', (req, res) => {
  const query = req.query.q;
  const fileId = req.query.fileId;

  let sql = 'SELECT * FROM users';
  let params = [];

  if (fileId && fileId !== '0') {
    sql += ' WHERE id = ?';
    params.push(fileId);
  }

  db.all(sql, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Database read error' });
    }

    let data = rows.map((row) => JSON.parse(row.data));

    if (query) {
      const queryLower = query.toLowerCase();
      data = data.filter((row) => {
        return Object.values(row).some((val) =>
          val.toLowerCase().includes(queryLower)
        );
      });
    }

    res.status(200).json(data);
  });
});

app.get('/api/ids', (req, res) => {
  db.all('SELECT DISTINCT id FROM users', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Database read error' });
    }

    const ids = rows.map((row) => row.id);
    res.status(200).json(ids);
  });
});

app.use((err, req, res) => {
  console.error(err.stack);
  res.status(500).json({ message: 'An internal error occurred.' });
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
