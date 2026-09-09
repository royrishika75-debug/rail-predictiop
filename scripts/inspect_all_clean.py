import os

files = [
    'PassengerDashboard',
    'NetworkIntelligence',
    'WhatIfSimulator',
    'OperationsDashboard',
    'PlatformForecast',
    'ConnectionRisk',
    'HistoricalReplay',
    'ModelPerformance',
    'ModelMonitoring',
    'DataPipeline',
    'AlertCenter',
    'Settings',
]

for f in files:
    with open(f'figma_dump/clean/{f}.js') as fp:
        content = fp.read()
    print(f"=== {f} ({len(content)} chars) ===")
    lines = [line.strip() for line in content.split(';') if line.strip()]
    print(f"  Total statements: {len(lines)}")
    # print first 5 lines
    for l in lines[:5]:
        print("   ", l[:100])
