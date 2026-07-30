import requests
from bs4 import BeautifulSoup

CHANNEL_NAME = "emokore4"
RSS_URL = f"https://t.me/s/{CHANNEL_NAME}"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7"
}

def fetch_posts():
    print(f"Запрос к {RSS_URL}...")
    response = requests.get(RSS_URL, headers=HEADERS)
    print(f"Статус ответа: {response.status_code}")
    
    if response.status_code != 200:
        return []

    soup = BeautifulSoup(response.text, 'html.parser')
    messages = soup.find_all('div', class_='tgme_widget_message')
    print(f"Найдено сообщений: {len(messages)}")
    
    posts = []
    for msg in messages:
        text_el = msg.find('div', class_='tgme_widget_message_text')
        date_el = msg.find('time', class_='tgme_widget_message_date')
        
        if text_el:
            text = text_el.decode_contents()
            date = date_el.get_text() if date_el else ""
            posts.append({"date": date, "text": text})
        
    return posts[-10:][::-1]

def save_html(posts):
    html = """<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <style>
        body {
            background-color: #121216;
            margin: 0;
            padding: 12px;
            color: #ffffff;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        .news-card {
            background: rgba(25, 25, 35, 0.85);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 10px;
            padding: 14px;
            margin-bottom: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        }
        .news-date {
            font-size: 11px;
            color: #34D399;
            margin-bottom: 6px;
            font-weight: bold;
        }
        .news-text {
            font-size: 13px;
            color: #d1d5db;
            line-height: 1.5;
            word-break: break-word;
        }
        .news-text a {
            color: #60a5fa;
            text-decoration: none;
        }
    </style>
</head>
<body>
"""
    if not posts:
        html += '<div class="news-card"><div class="news-text">Посты не найдены или канал недоступен</div></div>'
    
    for p in posts:
        html += f"""
    <div class="news-card">
        <div class="news-date">{p['date']}</div>
        <div class="news-text">{p['text']}</div>
    </div>"""
    
    html += "\n</body>\n</html>"
    with open("index.html", "w", encoding="utf-8") as f:
        f.write(html)

if __name__ == "__main__":
    posts = fetch_posts()
    save_html(posts)
