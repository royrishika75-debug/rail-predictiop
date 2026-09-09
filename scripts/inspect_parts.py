import re

with open('/tmp/figma_app.js', 'r') as f:
    text = f.read()

def find_slice(start_str, end_str):
    p1 = text.find(start_str)
    if p1 == -1:
        print("Start not found:", start_str)
        return ""
    p2 = text.find(end_str, p1)
    if p2 == -1:
        print("End not found:", end_str)
        return ""
    return text[p1:p2]

print("=== TOPBAR ===")
content = find_slice('/workspaces/default/.publishing/src/components/TopBar.tsx', '/workspaces/default/.publishing/src/pages/Landing.tsx')
print(content[:3000])
