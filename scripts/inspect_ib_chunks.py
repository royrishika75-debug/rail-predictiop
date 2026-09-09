import re

with open('figma_dump/PassengerDashboard_IB.js') as f:
    text = f.read()

# Let's inspect the sections inside IB:
# Top header, cards, charts, SHAP explanation modal/expandable, etc.
# Let's find all className and text combinations
chunks = re.findall(r'className:`([^`]+)`[^}]*?children:(\[[^\]]+\]|`[^`]+`)', text)
for cn, ch in chunks[:15]:
    print(f"[{cn[:30]}] -> {ch[:60]}")
