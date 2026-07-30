import requests
from bs4 import BeautifulSoup

CHANNEL_NAME = "emokore4"
RSS_URL = f"https://t.me/s/{CHANNEL_NAME}"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

def fetch_posts():
    response = requests.get(RSS_URL, headers=HEADERS)
    if response.status_code != 200:
        return []

    soup = BeautifulSoup(response.text, 'html.parser')
    
    # Telegram хранит тексты постов в блоках с этим классом
    posts_data = soup.find_all('div', class_='tgme_widget_message_text')
    dates_data = soup.find_all('time', class_='tgme_widget_message_date')
    
    posts = []
    for i in range(len(posts_data)):
        text = posts_data[i].decode_contents()
        date = dates_data[i].get_text() if i < len(dates_data) else ""
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
        html += '<div class="news-card"><div class="news-text">Постов пока нет</div></div>'
    
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
