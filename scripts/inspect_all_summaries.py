import re

def show_page_summary(name):
    with open(f'figma_dump/formatted/{name}.formatted.js') as f:
        text = f.read()
    print(f"==================== {name} ====================")
    lines = text.split('\n')
    print(f"Total lines: {len(lines)}")
    # Print function declarations and constants
    for l in lines:
        if l.startswith('function ') or l.startswith('var ') or l.startswith('const ') or 'useState' in l:
            print("  ", l[:120])

for p in ['NetworkIntelligence', 'WhatIfSimulator', 'OperationsDashboard', 'PlatformForecast', 'ConnectionRisk', 'HistoricalReplay', 'ModelPerformance', 'ModelMonitoring', 'DataPipeline', 'AlertCenter', 'Settings']:
    show_page_summary(p)
