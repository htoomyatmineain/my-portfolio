from html.parser import HTMLParser
from pathlib import Path

class Check(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = []
        self.anchors = []
        self.files = []
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if 'id' in a:
            self.ids.append(a['id'])
        if tag == 'a' and a.get('href', '').startswith('#'):
            self.anchors.append(a['href'][1:])
        if tag == 'script':
            self.files.append(a['src'])
        if tag == 'img':
            if not a['src'].startswith('https://'):
                self.files.append(a['src'])
            assert 'alt' in a, 'Images need alternative text (empty for decorative logos)'
        if tag == 'link' and a.get('rel') == 'stylesheet' and not a.get('href', '').startswith('https://'):
            self.files.append(a['href'])

p = Check()
p.feed(Path('index.html').read_text(encoding='utf-8'))
assert len(p.ids) == len(set(p.ids))
assert all(not a or a in p.ids for a in p.anchors)
assert all(Path(f).is_file() for f in p.files)
print('PASS: HTML parsed, unique IDs, anchor targets, and local assets.')
