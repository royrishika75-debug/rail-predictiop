import re

with open('/tmp/figma_app.js', 'r') as f:
    text = f.read()

pages = [
    ('PassengerDashboard', '/workspaces/default/.publishing/src/pages/PassengerDashboard.tsx', '/workspaces/default/.publishing/src/pages/NetworkIntelligence.tsx'),
    ('NetworkIntelligence', '/workspaces/default/.publishing/src/pages/NetworkIntelligence.tsx', '/workspaces/default/.publishing/src/pages/WhatIfSimulator.tsx'),
    ('WhatIfSimulator', '/workspaces/default/.publishing/src/pages/WhatIfSimulator.tsx', '/workspaces/default/.publishing/src/pages/OperationsDashboard.tsx'),
    ('OperationsDashboard', '/workspaces/default/.publishing/src/pages/OperationsDashboard.tsx', '/workspaces/default/.publishing/src/pages/PlatformForecast.tsx'),
    ('PlatformForecast', '/workspaces/default/.publishing/src/pages/PlatformForecast.tsx', '/workspaces/default/.publishing/src/pages/ConnectionRisk.tsx'),
    ('ConnectionRisk', '/workspaces/default/.publishing/src/pages/ConnectionRisk.tsx', '/workspaces/default/.publishing/src/pages/HistoricalReplay.tsx'),
    ('HistoricalReplay', '/workspaces/default/.publishing/src/pages/HistoricalReplay.tsx', '/workspaces/default/.publishing/src/pages/ModelPerformance.tsx'),
    ('ModelPerformance', '/workspaces/default/.publishing/src/pages/ModelPerformance.tsx', '/workspaces/default/.publishing/src/pages/ModelMonitoring.tsx'),
    ('ModelMonitoring', '/workspaces/default/.publishing/src/pages/ModelMonitoring.tsx', '/workspaces/default/.publishing/src/pages/DataPipeline.tsx'),
    ('DataPipeline', '/workspaces/default/.publishing/src/pages/DataPipeline.tsx', '/workspaces/default/.publishing/src/pages/AlertCenter.tsx'),
    ('AlertCenter', '/workspaces/default/.publishing/src/pages/AlertCenter.tsx', '/workspaces/default/.publishing/src/pages/Settings.tsx'),
    ('Settings', '/workspaces/default/.publishing/src/pages/Settings.tsx', '/workspaces/default/.publishing/src/App.tsx'),
]

for name, start_mark, end_mark in pages:
    p1 = text.find(start_mark)
    p2 = text.find(end_mark)
    segment = text[p1:p2]
    
    # find functions, useState, inputs, buttons
    states = re.findall(r'useState\(([^)]*)\)', segment)
    buttons = re.findall(r'<button[^>]*>([^<]*)<', segment)
    inputs = re.findall(r'<input[^>]*>', segment)
    
    print(f"=== {name} ({len(segment)} chars) ===")
    # Extract titles, text strings
    text_strings = re.findall(r'children:(`[^`]{3,40}`|\"[^\"]{3,40}\")', segment)
    clean_strings = [s.strip('`"') for s in text_strings[:15]]
    print("  Sample texts:", clean_strings[:10])
