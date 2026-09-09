import re
import os

with open('/tmp/figma_app.js', 'r') as f:
    text = f.read()

# Let's inspect the exact lines of each page to see their components and JSX
file_boundaries = [
    ('Sidebar', 'components/Sidebar.tsx', 'components/TopBar.tsx'),
    ('TopBar', 'components/TopBar.tsx', 'pages/Landing.tsx'),
    ('Landing', 'pages/Landing.tsx', 'pages/PassengerDashboard.tsx'),
    ('PassengerDashboard', 'pages/PassengerDashboard.tsx', 'pages/NetworkIntelligence.tsx'),
    ('NetworkIntelligence', 'pages/NetworkIntelligence.tsx', 'pages/WhatIfSimulator.tsx'),
    ('WhatIfSimulator', 'pages/WhatIfSimulator.tsx', 'pages/OperationsDashboard.tsx'),
    ('OperationsDashboard', 'pages/OperationsDashboard.tsx', 'pages/PlatformForecast.tsx'),
    ('PlatformForecast', 'pages/PlatformForecast.tsx', 'pages/ConnectionRisk.tsx'),
    ('ConnectionRisk', 'pages/ConnectionRisk.tsx', 'pages/HistoricalReplay.tsx'),
    ('HistoricalReplay', 'pages/HistoricalReplay.tsx', 'pages/ModelPerformance.tsx'),
    ('ModelPerformance', 'pages/ModelPerformance.tsx', 'pages/ModelMonitoring.tsx'),
    ('ModelMonitoring', 'pages/ModelMonitoring.tsx', 'pages/DataPipeline.tsx'),
    ('DataPipeline', 'pages/DataPipeline.tsx', 'pages/AlertCenter.tsx'),
    ('AlertCenter', 'pages/AlertCenter.tsx', 'pages/Settings.tsx'),
    ('Settings', 'pages/Settings.tsx', 'App.tsx'),
    ('App', 'App.tsx', 'main.tsx'),
    ('main', 'main.tsx', None),
]

os.makedirs('figma_dump/clean', exist_ok=True)

for name, start_f, end_f in file_boundaries:
    p_start = text.find(start_f)
    p_end = text.find(end_f) if end_f else len(text)
    raw = text[p_start:p_end]
    
    # Save the chunk
    with open(f'figma_dump/clean/{name}.js', 'w') as out:
        out.write(raw)
    print(f"Saved {name}: {len(raw)} bytes")
