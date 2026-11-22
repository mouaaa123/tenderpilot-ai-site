"""Checks that the publication bundle is a coherent static site, no external packages."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote

DOCS = Path(__file__).parent / "docs"
EXPECTED = [DOCS/'index.html', DOCS/'profil-client.html', DOCS/'rapport-demo.html', DOCS/'rapports_reels'/'rapport_reel_22_11_2026.html']

class Links(HTMLParser):
    def __init__(self):
        super().__init__(); self.links=[]
    def handle_starttag(self, tag, attrs):
        attrs=dict(attrs)
        if tag == 'a' and attrs.get('href'): self.links.append(attrs['href'])

for path in EXPECTED:
    assert path.exists(), f"Missing {path}"
    content=path.read_text(encoding='utf-8')
    assert '<!doctype html>' in content.lower(), f"Invalid HTML {path}"
    parser=Links();parser.feed(content)
    for href in parser.links:
        parsed=urlsplit(href)
        if parsed.scheme in ('https','http','mailto','tel') or href.startswith('#'):continue
        assert parsed.scheme == '' and parsed.netloc == '', f"Unsupported scheme in {href}"
        target=(path.parent / unquote(parsed.path or path.name)).resolve()
        assert target.is_relative_to(DOCS.resolve()), f"Link escapes /docs: {href}"
        assert target.is_file(), f"Broken relative link in {path}: {href}"
    if path.name=='rapport-demo.html':
        assert 'FICTIV' in content.upper(), 'Demo not disclosed as fictional'
assert not (DOCS/'prospection').exists()
print('Site OK — HTML, liens relatifs, mentions démo, aucun CRM public')
