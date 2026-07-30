const express = require('express');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let news = [
    { 
        title: "Добро пожаловать!", 
        date: "30 ИЮЛЯ 2026", 
        text: "Добро пожаловать в лаунчер VDS Client!",
        imageUrl: "" // Ссылка на картинку (если есть)
    }
];

// Чтение новостей лаунчером (возвращает JSON)
app.get('/api/news', (req, res) => {
    res.json(news);
});

// Админ-панель
app.get('/admin', (req, res) => {
    res.send(`
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>VDS Admin</title>
        </head>
        <body style="background:#0b0b10; color:#fff; font-family:sans-serif; padding:20px; max-width:600px; margin:0 auto;">
            <h3 style="color:#34D399;">Управление новостями VDS</h3>
            <form action="/admin/add" method="POST">
                <input type="text" name="title" placeholder="Заголовок новости..." style="width:100%; padding:12px; background:#181824; color:#fff; border-radius:8px; border:1px solid #333; font-size:16px; margin-bottom:12px; box-sizing: border-box;" />
                <input type="url" name="imageUrl" placeholder="Ссылка на картинку (http/https)..." style="width:100%; padding:12px; background:#181824; color:#fff; border-radius:8px; border:1px solid #333; font-size:16px; margin-bottom:12px; box-sizing: border-box;" />
                <textarea name="text" placeholder="Текст новости..." style="width:100%; height:120px; background:#181824; color:#fff; padding:12px; border-radius:8px; border:1px solid #333; font-size:16px; box-sizing: border-box; margin-bottom:12px;"></textarea>
                <button type="submit" style="background:#34D399; color:#121216; border:none; padding:12px 24px; border-radius:8px; font-weight:bold; font-size:16px; width:100%; cursor:pointer;">Опубликовать</button>
            </form>
            <br>
            <h4>Текущие посты:</h4>
            <div style="background:#181824; padding:12px; border-radius:8px; font-size:14px; line-height:1.5;">
                ${news.map((item, index) => `
                    <div style="margin-bottom:12px; border-bottom:1px solid #2a2a38; padding-bottom:10px;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <b style="color:#818CF8; font-size:16px;">${item.title}</b>
                            <span style="color:#a1a1aa; font-size:11px;">${item.date}</span>
                        </div>
                        ${item.imageUrl ? `<img src="${item.imageUrl}" style="width:100%; max-height:180px; object-fit:cover; border-radius:6px; margin-top:8px;" />` : ''}
                        <div style="margin-top:6px; color:#e4e4e7;">${item.text}</div>
                        <form action="/admin/delete/${index}" method="POST" style="margin-top:8px; margin-bottom:0;">
                            <button type="submit" style="background:#f43f5e; color:#fff; border:none; padding:4px 10px; border-radius:4px; font-size:12px; cursor:pointer;">Удалить</button>
                        </form>
                    </div>
                `).join('')}
            </div>
        </body>
        </html>
    `);
});

// Добавление новости из админки
app.post('/admin/add', (req, res) => {
    const { title, text, imageUrl } = req.body;
    if (text && text.trim() !== '') {
        const date = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
        
        news.unshift({ 
            title: title && title.trim() !== '' ? title.trim() : "Новость", 
            date, 
            text: text.trim(),
            imageUrl: imageUrl ? imageUrl.trim() : ""
        });
    }
    res.redirect('/admin');
});

// Удаление новости
app.post('/admin/delete/:id', (req, res) => {
    const id = parseInt(req.params.id);
    if (!isNaN(id) && id >= 0 && id < news.length) {
        news.splice(id, 1);
    }
    res.redirect('/admin');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
