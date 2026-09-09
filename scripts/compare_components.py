import re

def analyze_file(name, raw_path, current_path):
    with open(raw_path) as f:
        raw = f.read()
    with open(current_path) as f:
        current = f.read()

    # Extract all text strings
    raw_texts = re.findall(r'`([^`$\\{}\n]{3,60})`', raw)
    current_texts = set(re.findall(r'[\'"`]([^\'"`$\\{}\n]{3,60})[\'"`]', current))
    
    # Filter for meaningful text
    meaningful = []
    for t in raw_texts:
        t_clean = t.strip()
        if not t_clean: continue
        if any(c in t_clean for c in ['flex', 'border', 'bg-', 'rounded', 'px-', 'py-', 'text-', 'col-', 'w-', 'h-', 'opacity']):
            continue
        if any(c in t_clean for c in ['.tsx', 'recharts', 'xmlns', 'rgba', '#', 'function', 'return', 'translate']):
            continue
        meaningful.append(t_clean)
        
    missing = [t for t in set(meaningful) if t not in current_texts]
    print(f"=== {name} ===")
    print(f"  Total distinct text elements: {len(set(meaningful))}")
    if missing:
        print(f"  Missing in current ({len(missing)}):")
        for m in missing[:10]:
            print(f"    - {m}")
    else:
        print("  All text elements present!")

analyze_file('TopBar', 'figma_dump/clean/TopBar.js', 'src/components/TopBar.tsx')
analyze_file('Sidebar', 'figma_dump/clean/Sidebar.js', 'src/components/Sidebar.tsx')
analyze_file('PassengerDashboard', 'figma_dump/clean/PassengerDashboard.js', 'src/pages/PassengerDashboard.tsx')
analyze_file('NetworkIntelligence', 'figma_dump/clean/NetworkIntelligence.js', 'src/pages/NetworkIntelligence.tsx')
analyze_file('WhatIfSimulator', 'figma_dump/clean/WhatIfSimulator.js', 'src/pages/WhatIfSimulator.tsx')
analyze_file('OperationsDashboard', 'figma_dump/clean/OperationsDashboard.js', 'src/pages/OperationsDashboard.tsx')
analyze_file('PlatformForecast', 'figma_dump/clean/PlatformForecast.js', 'src/pages/PlatformForecast.tsx')
analyze_file('ConnectionRisk', 'figma_dump/clean/ConnectionRisk.js', 'src/pages/ConnectionRisk.tsx')
analyze_file('HistoricalReplay', 'figma_dump/clean/HistoricalReplay.js', 'src/pages/HistoricalReplay.tsx')
analyze_file('ModelPerformance', 'figma_dump/clean/ModelPerformance.js', 'src/pages/ModelPerformance.tsx')
analyze_file('ModelMonitoring', 'figma_dump/clean/ModelMonitoring.js', 'src/pages/ModelMonitoring.tsx')
analyze_file('DataPipeline', 'figma_dump/clean/DataPipeline.js', 'src/pages/DataPipeline.tsx')
analyze_file('AlertCenter', 'figma_dump/clean/AlertCenter.js', 'src/pages/AlertCenter.tsx')
analyze_file('Settings', 'figma_dump/clean/Settings.js', 'src/pages/Settings.tsx')
