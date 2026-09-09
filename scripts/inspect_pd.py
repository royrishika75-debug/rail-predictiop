import re

with open('/tmp/figma_app.js', 'r') as f:
    text = f.read()

def extract_section(start_marker, end_marker):
    p1 = text.find(start_marker)
    if p1 == -1: return ""
    p2 = text.find(end_marker, p1)
    if p2 == -1: return ""
    return text[p1:p2]

# Let's inspect PassengerDashboard from the start of its component
raw = extract_section('/workspaces/default/.publishing/src/pages/PassengerDashboard.tsx', '/workspaces/default/.publishing/src/pages/NetworkIntelligence.tsx')

# Let's clean up and prettify jsxDEV
# Replace (0,S.jsxDEV)(`tag`,{...}) or similar
lines = raw.split(';')
print(f"Total statements in PassengerDashboard: {len(lines)}")
for idx, l in enumerate(lines[:30]):
    print(f"{idx}: {l[:120]}")
