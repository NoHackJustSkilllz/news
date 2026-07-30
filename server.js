const express = require('express');
const fs = require('fs');
const path = require('path');
const cookieSession = require('cookie-session');

const app = express();

// --- НАСТРОЙКИ ---
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "vds2026"; // Пароль для входа в админку
const DATA_FILE = path.join(__dirname, 'news.json');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieSession({
    name: 'vds_session',
    keys: ['vds_secret_key_98765'],
    maxAge: 24 * 60 * 60 * 1000 // Сессия на 24 часа
}));

// --- РАБОТА С ФАЙЛОМ (ХРАНЕНИЕ) ---
let news = [];

function loadNews() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            news = JSON.parse(data);
        } else {
            news = [
                {
                    id: Date.now().toString(),
                    title: "Добро пожаловать!",
                    date: "30 ИЮЛЯ 2026",
                    text: "Добро пожаловать в лаунчер VDS Client!",
                    imageUrl: "",
                    tag: "ИНФО",
                    tagColor: "#818CF8",
                    isPinned: true,
                    actionText: "Наш Discord",
                    actionUrl: "https://discord.gg"
                }
            ];
            saveNews();
        }
    } catch (e) {
        console.error("Ошибка при чтении файла новостей:", e);
        news = [];
    }
}

function saveNews() {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(news, null, 2), 'utf8');
    } catch (e) {
        console.error("Ошибка при сохранении новостей:", e);
    }
}

loadNews();

// --- МИДДЛВАР ПРОВЕРКИ АВТОРИЗАЦИИ ---
function requireAuth(req, res, next) {
    if (req.session && req.session.isAdmin) {
        return next();
    }
    res.redirect('/admin/login');
}

// --- API ДЛЯ ЛАУНЧЕРА ---
app.get('/api/news', (req, res) => {
    // Сортировка: сначала закрепленные, затем свежие по id
    const sortedNews = [...news].sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return b.id - a.id;
    });
    res.json(sortedNews);
});

// --- ЛОГИН В АДМИНКУ ---
app.get('/admin/login', (req, res) => {
    res.send(`
        <html>
        <head><title>VDS Admin - Вход</title><meta name="viewport" content="width=device-width, initial-scale=1"></head>
        <body style="background:#0b0b10; color:#fff; font-family:sans-serif; display:flex; align-items:center; justify-content:center; height:100vh; margin:0;">
            <form action="/admin/login" method="POST" style="background:#181824; padding:24px; border-radius:12px; border:1px solid #2a2a38; width:100%; max-width:320px;">
                <h3 style="margin-top:0; color:#818CF8; text-align:center;">VDS Admin Login</h3>
                <input type="password" name="password" placeholder="Введите пароль..." style="width:100%; padding:10px; background:#0b0b10; color:#fff; border:1px solid #333; border-radius:6px; margin-bottom:12px; box-sizing:border-box;" required />
                <button type="submit" style="width:100%; padding:10px; background:#6366F1; color:#fff; border:none; border-radius:6px; font-weight:bold; cursor:pointer;">Войти</button>
            </form>
        </body>
        </html>
    `);
});

app.post('/admin/login', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
        req.session.isAdmin = true;
        res.redirect('/admin');
    } else {
        res.send("<script>alert('Неверный пароль!'); window.location='/admin/login';</script>");
    }
});

app.get('/admin/logout', (req, res) => {
    req.session = null;
    res.redirect('/admin/login');
});

// --- АДМИН-ПАНЕЛЬ ---
app.get('/admin', requireAuth, (req, res) => {
    const editId = req.query.edit;
    const itemToEdit = editId ? news.find(n => n.id === editId) : null;

    res.send(`
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>VDS Admin Panel</title>
        </head>
        <body style="background:#0b0b10; color:#fff; font-family:sans-serif; padding:20px; max-width:700px; margin:0 auto;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h2 style="color:#34D399; margin:0;">Панель управления VDS</h2>
                <a href="/admin/logout" style="color:#f43f5e; text-decoration:none; font-size:14px; border:1px solid #f43f5e; padding:6px 12px; border-radius:6px;">Выйти</a>
            </div>

            <!-- Форма Добавления / Редактирования -->
            <form action="${itemToEdit ? '/admin/edit/' + itemToEdit.id : '/admin/add'}" method="POST" style="background:#181824; padding:16px; border-radius:12px; border:1px solid #2a2a38; margin-bottom:24px;">
                <h4 style="margin-top:0; color:#818CF8;">${itemToEdit ? 'Редактирование новости' : 'Новая публикация'}</h4>
                
                <input type="text" name="title" value="${itemToEdit ? itemToEdit.title : ''}" placeholder="Заголовок новости..." style="width:100%; padding:10px; background:#0b0b10; color:#fff; border-radius:6px; border:1px solid #333; margin-bottom:10px; box-sizing:border-box;" required />
                
                <div style="display:flex; gap:10px; margin-bottom:10px;">
                    <input type="text" name="tag" value="${itemToEdit ? itemToEdit.tag || '' : 'ОБНОВЛЕНИЕ'}" placeholder="Тег (например: ВАЖНО)" style="flex:2; padding:10px; background:#0b0b10; color:#fff; border-radius:6px; border:1px solid #333; box-sizing:border-box;" />
                    <input type="color" name="tagColor" value="${itemToEdit ? itemToEdit.tagColor || '#818CF8' : '#818CF8'}" style="flex:1; height:38px; background:#0b0b10; border:1px solid #333; border-radius:6px; cursor:pointer;" />
                </div>

                <input type="url" name="imageUrl" value="${itemToEdit ? itemToEdit.imageUrl : ''}" placeholder="Ссылка на картинку (http/https)..." style="width:100%; padding:10px; background:#0b0b10; color:#fff; border-radius:6px; border:1px solid #333; margin-bottom:10px; box-sizing:border-box;" />
                
                <div style="display:flex; gap:10px; margin-bottom:10px;">
                    <input type="text" name="actionText" value="${itemToEdit ? itemToEdit.actionText || '' : ''}" placeholder="Текст кнопки (например: Читать далее)" style="flex:1; padding:10px; background:#0b0b10; color:#fff; border-radius:6px; border:1px solid #333; box-sizing:border-box;" />
                    <input type="url" name="actionUrl" value="${itemToEdit ? itemToEdit.actionUrl || '' : ''}" placeholder="Ссылка кнопки (http/https)..." style="flex:1; padding:10px; background:#0b0b10; color:#fff; border-radius:6px; border:1px solid #333; box-sizing:border-box;" />
                </div>

                <textarea name="text" placeholder="Текст новости..." style="width:100%; height:100px; background:#0b0b10; color:#fff; padding:10px; border-radius:6px; border:1px solid #333; margin-bottom:10px; box-sizing:border-box;" required>${itemToEdit ? itemToEdit.text : ''}</textarea>

                <label style="display:flex; align-items:center; gap:8px; margin-bottom:12px; cursor:pointer; font-size:14px;">
                    <input type="checkbox" name="isPinned" ${itemToEdit && itemToEdit.isPinned ? 'checked' : ''} /> 📌 Закрепить новость вверху
                </label>

                <div style="display:flex; gap:10px;">
                    <button type="submit" style="background:#34D399; color:#121216; border:none; padding:10px 20px; border-radius:6px; font-weight:bold; cursor:pointer; flex:1;">${itemToEdit ? 'Сохранить изменения' : 'Опубликовать'}</button>
                    ${itemToEdit ? `<a href="/admin" style="background:#4b5563; color:#fff; text-decoration:none; padding:10px 20px; border-radius:6px; font-weight:bold; text-align:center;">Отмена</a>` : ''}
                </div>
            </form>

            <h4>Список всех новостей (${news.length}):</h4>
            <div style="display:flex; flex-direction:column; gap:12px;">
                ${news.map((item) => `
                    <div style="background:#181824; padding:14px; border-radius:8px; border:1px solid ${item.isPinned ? '#F59E0B' : '#2a2a38'};">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <div>
                                ${item.isPinned ? '📌 ' : ''}
                                <span style="background:${item.tagColor || '#818CF8'}; color:#fff; font-size:10px; padding:2px 6px; border-radius:4px; font-weight:bold; margin-right:6px;">${item.tag || 'ИНФО'}</span>
                                <b style="color:#fff; font-size:16px;">${item.title}</b>
                            </div>
                            <span style="color:#a1a1aa; font-size:11px;">${item.date}</span>
                        </div>
                        ${item.imageUrl ? `<img src="${item.imageUrl}" style="width:100%; max-height:160px; object-fit:cover; border-radius:6px; margin-top:8px;" />` : ''}
                        <div style="margin-top:8px; color:#d1d5db; font-size:14px;">${item.text}</div>
                        ${item.actionUrl ? `<div style="margin-top:6px;"><a href="${item.actionUrl}" target="_blank" style="color:#818CF8; font-size:12px;">🔗 ${item.actionText || 'Ссылка'}</a></div>` : ''}
                        
                        <div style="display:flex; gap:10px; margin-top:10px; border-top:1px solid #2a2a38; padding-top:8px;">
                            <a href="/admin?edit=${item.id}" style="background:#3b82f6; color:#fff; text-decoration:none; padding:4px 10px; border-radius:4px; font-size:12px;">Редактировать</a>
                            <form action="/admin/delete/${item.id}" method="POST" style="margin:0;">
                                <button type="submit" style="background:#f43f5e; color:#fff; border:none; padding:4px 10px; border-radius:4px; font-size:12px; cursor:pointer;" onclick="return confirm('Удалить эту новость?')">Удалить</button>
                            </form>
                        </div>
                    </div>
                `).join('')}
            </div>
        </body>
        </html>
    `);
});

// --- ДОБАВЛЕНИЕ ---
app.post('/admin/add', requireAuth, (req, res) => {
    const { title, text, imageUrl, tag, tagColor, actionText, actionUrl, isPinned } = req.body;
    
    if (text && text.trim() !== '') {
        const date = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
        
        const newItem = {
            id: Date.now().toString(),
            title: title && title.trim() !== '' ? title.trim() : "Новость",
            date,
            text: text.trim(),
            imageUrl: imageUrl ? imageUrl.trim() : "",
            tag: tag ? tag.trim().toUpperCase() : "ИНФО",
            tagColor: tagColor || "#818CF8",
            actionText: actionText ? actionText.trim() : "",
            actionUrl: actionUrl ? actionUrl.trim() : "",
            isPinned: isPinned === 'on'
        };

        news.unshift(newItem);
        saveNews();
    }
    res.redirect('/admin');
});

// --- РЕДАКТИРОВАНИЕ ---
app.post('/admin/edit/:id', requireAuth, (req, res) => {
    const { id } = req.params;
    const { title, text, imageUrl, tag, tagColor, actionText, actionUrl, isPinned } = req.body;

    const item = news.find(n => n.id === id);
    if (item) {
        item.title = title ? title.trim() : item.title;
        item.text = text ? text.trim() : item.text;
        item.imageUrl = imageUrl ? imageUrl.trim() : "";
        item.tag = tag ? tag.trim().toUpperCase() : "ИНФО";
        item.tagColor = tagColor || "#818CF8";
        item.actionText = actionText ? actionText.trim() : "";
        item.actionUrl = actionUrl ? actionUrl.trim() : "";
        item.isPinned = isPinned === 'on';

        saveNews();
    }
    res.redirect('/admin');
});

// --- УДАЛЕНИЕ ---
app.post('/admin/delete/:id', requireAuth, (req, res) => {
    const { id } = req.params;
    news = news.filter(n => n.id !== id);
    saveNews();
    res.redirect('/admin');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
