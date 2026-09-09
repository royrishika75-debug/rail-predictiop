import re

with open('/tmp/figma_app.js', 'r') as f:
    text = f.read()

def get_file_content(path, next_path):
    p1 = text.find(path)
    p2 = text.find(next_path)
    return text[p1:p2]

# Let's check PassengerDashboard
raw = get_file_content('/workspaces/default/.publishing/src/pages/PassengerDashboard.tsx', '/workspaces/default/.publishing/src/pages/NetworkIntelligence.tsx')
with open('figma_dump/PassengerDashboard_raw.js', 'w') as f:
    f.write(raw)
print("PassengerDashboard chunk length:", len(raw))

# Let's check NetworkIntelligence
raw_ni = get_file_content('/workspaces/default/.publishing/src/pages/NetworkIntelligence.tsx', '/workspaces/default/.publishing/src/pages/WhatIfSimulator.tsx')
with open('figma_dump/NetworkIntelligence_raw.js', 'w') as f:
    f.write(raw_ni)
print("NetworkIntelligence chunk length:", len(raw_ni))

# Let's check OperationsDashboard
raw_op = get_file_content('/workspaces/default/.publishing/src/pages/OperationsDashboard.tsx', '/workspaces/default/.publishing/src/pages/PlatformForecast.tsx')
with open('figma_dump/OperationsDashboard_raw.js', 'w') as f:
    f.write(raw_op)
print("OperationsDashboard chunk length:", len(raw_op))
