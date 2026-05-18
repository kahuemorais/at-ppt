"""Merge safe duplicate @media query blocks in styles.css"""
import re

with open('styles.css') as f:
    css = f.read()

def extract_blocks(css_text):
    blocks = []
    for m in re.finditer(r'@media[^{]+\{', css_text):
        start = m.start()
        depth = 0
        for j, c in enumerate(css_text[start:]):
            if c == '{': depth += 1
            elif c == '}':
                depth -= 1
                if depth == 0:
                    end = start + j + 1
                    inner = css_text[start:end]
                    blocks.append({
                        'raw': inner,
                        'start': start,
                        'end': end,
                        'type': css_text[start:css_text.find('{', start)].strip(),
                        'inner': inner[inner.find('{')+1:inner.rfind('}')],
                        'selectors': re.findall(r'([a-zA-Z0-9_.,#:\[\]="\-]+)\s*\{', inner)
                    })
                    break
    return blocks

blocks = extract_blocks(css)

# MERGE 1: @media (max-width: 1024px) × 2
b1024 = [b for b in blocks if b['type'] == '@media (max-width: 1024px)']
if len(b1024) == 2:
    b1, b2 = b1024
    # Merge b2's inner into b1
    merged_inner = b1['inner'].rstrip() + '\n\n' + b2['inner']
    merged_block = b1['type'] + ' {\n' + merged_inner + '\n}'
    css = css[:b1['start']] + merged_block + css[b1['end']:]
    # Remove b2
    # b2 positions shifted by (len(merged_block) - (b1['end'] - b1['start']))
    shift = len(merged_block) - (b1['end'] - b1['start'])
    b2_start_shifted = b2['start'] + shift
    b2_end_shifted = b2['end'] + shift
    css = css[:b2_start_shifted] + css[b2_end_shifted:]
    print("Merged 1024px blocks")

# Re-extract after first merge
blocks = extract_blocks(css)

# MERGE 2: @media (max-width: 480px) × 2
b480 = [b for b in blocks if b['type'] == '@media (max-width: 480px)']
if len(b480) == 2:
    b1, b2 = b480
    merged_inner = b1['inner'].rstrip() + '\n\n' + b2['inner']
    merged_block = b1['type'] + ' {\n' + merged_inner + '\n}'
    css = css[:b1['start']] + merged_block + css[b1['end']:]
    shift = len(merged_block) - (b1['end'] - b1['start'])
    b2_start_shifted = b2['start'] + shift
    b2_end_shifted = b2['end'] + shift
    css = css[:b2_start_shifted] + css[b2_end_shifted:]
    print("Merged 480px blocks")

with open('styles.css', 'w') as f:
    f.write(css)

print(f"\nFinal: {css.count('@media (max-width: 1024px)')} × 1024px")
print(f"Final: {css.count('@media (max-width: 480px)')} × 480px")
print(f"Final: {css.count('@media (max-width: 768px)')} × 768px")
print(f"Final: {css.count('@media (max-width: 900px)')} × 900px")
print(f"Final: {css.count('@media (max-width: 600px)')} × 600px")
print(f"CSS size: {len(css)} chars (was 44212)")
print(f"Brace balance: {css.count('{')} open, {css.count('}')} close")
