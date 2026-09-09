import os
import re

os.makedirs('figma_dump/formatted', exist_ok=True)

for fname in os.listdir('figma_dump/clean'):
    if not fname.endswith('.js'): continue
    with open(f'figma_dump/clean/{fname}') as fp:
        content = fp.read()
    
    # Format jsxDEV calls into readable lines
    formatted = content
    formatted = formatted.replace('(0,S.jsxDEV)(', '\n  jsxDEV(')
    formatted = formatted.replace('void 0,!1,{fileName', '\n  // {fileName')
    formatted = formatted.replace('void 0,!0,{fileName', '\n  // {fileName')
    formatted = formatted.replace('function ', '\n\nfunction ')
    formatted = formatted.replace('var ', '\nvar ')
    formatted = formatted.replace('let ', '\nlet ')
    formatted = formatted.replace('const ', '\nconst ')
    
    outname = fname.replace('.js', '.formatted.js')
    with open(f'figma_dump/formatted/{outname}', 'w') as fp:
        fp.write(formatted)
    print(f"Wrote formatted {outname}")
