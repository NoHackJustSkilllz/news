const express = require('express');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let news = [
    { date: "30 ИЮЛЯ 2026", text: "Добро пожаловать в лаунчер VDS Client!" }
];

// Чтение новостей лаунчером (возвращает JSON)
app.get('/api/news', (req, res) => {
    res.json(news);
});

// Простая админ-панель для управления с телефона
app.get('/admin', (req, res) => {
    res.send(`
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>VDS Admin</title>
        </head>
        <body style="background:#0b0b10; color:#fff; font-family:sans-serif; padding:20px;">
            <h3 style="color:#34D399;">Управление новостями VDS</h3>
            <form action="/admin/add" method="POST">
                <textarea name="text" placeholder="Текст новости..." style="width:100%; height:140px; background:#181824; color:#fff; padding:12px; border-radius:8px; border:1px solid #333; font-size:16px; box-sizing: border-box;"></textarea><br><br>
                <button type="submit" style="background:#34D399; color:#121216; border:none; padding:12px 24px; border-radius:8px; font-weight:bold; font-size:16px; width:100%; cursor:pointer;">Опубликовать</button>
            </form>
            <br>
            <h4 style="margin-top:20px;">Текущие посты:</h4>
            <div style="background:#181824; padding:12px; border-radius:8px; font-size:13px; line-height:1.5;">
                ${news.map((item, index) => `<div style="margin-bottom:10px; border-bottom:1px solid #2a2a38; padding-bottom:8px;"><b>[${item.date}]</b><br>${item.text}</div>`).join('')}
            </div>
        </body>
        </html>
    `);
});

// Добавление новости из админки
app.post('/admin/add', (req, res) => {
    const text = req.body.text;
    if (text && text.trim() !== '') {
        const date = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
        news.unshift({ date, text: text.trim() });
    }
    res.redirect('/admin');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
