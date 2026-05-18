"""Add vip-level-master to all 4 language blocks in i18n.js"""
from pathlib import Path

js = Path('i18n.js').read_text()

blocks = [
    (30753, 42744, 'vi'),
    (20518, 30753, 'es'),
    (10178, 20518, 'pt'),
    (27,   10178, 'en'),
]
translations = {'en': 'MASTER', 'pt': 'MESTRE', 'es': 'MASTER', 'vi': 'MASTER'}

# Find insertion points
insertion_points = []
for block_start, block_end, lang in blocks:
    block = js[block_start:block_end]
    idx = block.find('"vip-level-6":')
    line_end = block.find('\n', idx)
    abs_pos = block_start + line_end + 1
    insertion_points.append((abs_pos, translations[lang], lang))

# Sort by position descending (insert from highest to lowest so shifts don't affect earlier positions)
insertion_points.sort(key=lambda x: x[0], reverse=True)

for abs_pos, val, lang in insertion_points:
    new_entry = f'        "vip-level-master": "{val}",\n'
    js = js[:abs_pos] + new_entry + js[abs_pos:]
    print(f"{lang}: inserted at {abs_pos}, value='{val}'")

Path('i18n.js').write_text(js)

# Verify
js2 = Path('i18n.js').read_text()
for lang in ['en', 'pt', 'es', 'vi']:
    pos = js2.find('"vip-level-master":')
    end = js2.find('\n', pos)
    print(f"  {lang}: {repr(js2[pos:end])}")
