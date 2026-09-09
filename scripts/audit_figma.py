import re
import os

with open('/tmp/figma_app.js', 'r') as f:
    text = f.read()

# All source file marks
markers = [
    ('Sidebar', '/workspaces/default/.publishing/src/components/Sidebar.tsx'),
    ('TopBar', '/workspaces/default/.publishing/src/components/TopBar.tsx'),
    ('Landing', '/workspaces/default/.publishing/src/pages/Landing.tsx'),
    ('PassengerDashboard', '/workspaces/default/.publishing/src/pages/PassengerDashboard.tsx'),
    ('NetworkIntelligence', '/workspaces/default/.publishing/src/pages/NetworkIntelligence.tsx'),
    ('WhatIfSimulator', '/workspaces/default/.publishing/src/pages/WhatIfSimulator.tsx'),
    ('OperationsDashboard', '/workspaces/default/.publishing/src/pages/OperationsDashboard.tsx'),
    ('PlatformForecast', '/workspaces/default/.publishing/src/pages/PlatformForecast.tsx'),
    ('ConnectionRisk', '/workspaces/default/.publishing/src/pages/ConnectionRisk.tsx'),
    ('HistoricalReplay', '/workspaces/default/.publishing/src/pages/HistoricalReplay.tsx'),
    ('ModelPerformance', '/workspaces/default/.publishing/src/pages/ModelPerformance.tsx'),
    ('ModelMonitoring', '/workspaces/default/.publishing/src/pages/ModelMonitoring.tsx'),
    ('DataPipeline', '/workspaces/default/.publishing/src/pages/DataPipeline.tsx'),
    ('AlertCenter', '/workspaces/default/.publishing/src/pages/AlertCenter.tsx'),
    ('Settings', '/workspaces/default/.publishing/src/pages/Settings.tsx'),
    ('App', '/workspaces/default/.publishing/src/App.tsx'),
    ('main', '/workspaces/default/.publishing/src/main.tsx'),
]

os.makedirs('figma_dump', exist_ok=True)

# Find positions
positions = []
for name, path in markers:
    p = text.find(path)
    positions.append((p, name, path))

positions.sort()

for i in range(len(positions)):
    pos, name, path = positions[i]
    next_pos = positions[i+1][0] if i + 1 < len(positions) else len(text)
    
    # We want code that belongs to this file. Usually the file starts before the variable assignment or right around it
    # Let's write the raw segment between this marker and the next
    chunk = text[pos:next_pos]
    with open(f'figma_dump/{name}.raw.js', 'w') as out:
        out.write(chunk)
    print(f'Wrote figma_dump/{name}.raw.js ({len(chunk)} bytes)')
