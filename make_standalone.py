from pathlib import Path
import json
import re

EXPORT_DIR = Path("export_web")
INDEX = EXPORT_DIR / "index.html"
OUT = EXPORT_DIR / "standalone.html"
NEWSLETTER_JSON = EXPORT_DIR / "newsletter.json"

def read_text(p: Path) -> str:
    return p.read_text(encoding="utf-8")

def inline_css(html: str) -> str:
    def repl(m):
        href = m.group(1)
        css_path = (EXPORT_DIR / href).resolve()
        if not css_path.exists():
            return m.group(0)
        css = read_text(css_path)
        return f"<style>\n{css}\n</style>"
    return re.sub(
        r'<link[^>]+rel=["\']stylesheet["\'][^>]+href=["\']([^"\']+)["\'][^>]*>',
        repl,
        html,
        flags=re.I,
    )

def inline_module_js(html: str) -> str:
    def repl(m):
        src = m.group(1)
        js_path = (EXPORT_DIR / src).resolve()
        if not js_path.exists():
            return m.group(0)
        js = read_text(js_path).replace("</script>", "<\\/script>")
        return f'<script type="module">\n{js}\n</script>'
    return re.sub(
        r'<script[^>]+type=["\']module["\'][^>]+src=["\']([^"\']+)["\'][^>]*>\s*</script>',
        repl,
        html,
        flags=re.I,
    )

def strip_preloads(html: str) -> str:
    # optional: remove preload/modulepreload links that would reference now-inlined assets
    html = re.sub(r'<link[^>]+rel=["\']modulepreload["\'][^>]*>\s*', "", html, flags=re.I)
    html = re.sub(r'<link[^>]+rel=["\']preload["\'][^>]*>\s*', "", html, flags=re.I)
    return html

def embed_newsletter_json(html: str) -> str:
    if not NEWSLETTER_JSON.exists():
        return html
    data = json.loads(read_text(NEWSLETTER_JSON))
    payload = json.dumps(data, ensure_ascii=False).replace("</script>", "<\\/script>")
    inject = f"<script>window.__NEWSLETTER__ = {payload};</script>\n"
    return re.sub(r"(<head[^>]*>)", r"\1\n" + inject, html, flags=re.I, count=1)

def main():
    html = read_text(INDEX)
    html = strip_preloads(html)
    html = inline_css(html)
    html = inline_module_js(html)
    html = embed_newsletter_json(html)

    OUT.write_text(html, encoding="utf-8")
    print(f"✅ Wrote: {OUT.resolve()}")

if __name__ == "__main__":
    main() 
