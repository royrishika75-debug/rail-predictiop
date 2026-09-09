import re
import os

with open('/tmp/figma_app.js', 'r') as f:
    bundle_text = f.read()

pages_map = {
    'PassengerDashboard': ('/workspaces/default/.publishing/src/pages/PassengerDashboard.tsx', '/workspaces/default/.publishing/src/pages/NetworkIntelligence.tsx', 'src/pages/PassengerDashboard.tsx'),
    'NetworkIntelligence': ('/workspaces/default/.publishing/src/pages/NetworkIntelligence.tsx', '/workspaces/default/.publishing/src/pages/WhatIfSimulator.tsx', 'src/pages/NetworkIntelligence.tsx'),
    'WhatIfSimulator': ('/workspaces/default/.publishing/src/pages/WhatIfSimulator.tsx', '/workspaces/default/.publishing/src/pages/OperationsDashboard.tsx', 'src/pages/WhatIfSimulator.tsx'),
    'OperationsDashboard': ('/workspaces/default/.publishing/src/pages/OperationsDashboard.tsx', '/workspaces/default/.publishing/src/pages/PlatformForecast.tsx', 'src/pages/OperationsDashboard.tsx'),
    'PlatformForecast': ('/workspaces/default/.publishing/src/pages/PlatformForecast.tsx', '/workspaces/default/.publishing/src/pages/ConnectionRisk.tsx', 'src/pages/PlatformForecast.tsx'),
    'ConnectionRisk': ('/workspaces/default/.publishing/src/pages/ConnectionRisk.tsx', '/workspaces/default/.publishing/src/pages/HistoricalReplay.tsx', 'src/pages/ConnectionRisk.tsx'),
    'HistoricalReplay': ('/workspaces/default/.publishing/src/pages/HistoricalReplay.tsx', '/workspaces/default/.publishing/src/pages/ModelPerformance.tsx', 'src/pages/HistoricalReplay.tsx'),
    'ModelPerformance': ('/workspaces/default/.publishing/src/pages/ModelPerformance.tsx', '/workspaces/default/.publishing/src/pages/ModelMonitoring.tsx', 'src/pages/ModelPerformance.tsx'),
    'ModelMonitoring': ('/workspaces/default/.publishing/src/pages/ModelMonitoring.tsx', '/workspaces/default/.publishing/src/pages/DataPipeline.tsx', 'src/pages/ModelMonitoring.tsx'),
    'DataPipeline': ('/workspaces/default/.publishing/src/pages/DataPipeline.tsx', '/workspaces/default/.publishing/src/pages/AlertCenter.tsx', 'src/pages/DataPipeline.tsx'),
    'AlertCenter': ('/workspaces/default/.publishing/src/pages/AlertCenter.tsx', '/workspaces/default/.publishing/src/pages/Settings.tsx', 'src/pages/AlertCenter.tsx'),
    'Settings': ('/workspaces/default/.publishing/src/pages/Settings.tsx', '/workspaces/default/.publishing/src/App.tsx', 'src/pages/Settings.tsx'),
    'Landing': ('/workspaces/default/.publishing/src/pages/Landing.tsx', '/workspaces/default/.publishing/src/pages/PassengerDashboard.tsx', 'src/pages/Landing.tsx'),
    'TopBar': ('/workspaces/default/.publishing/src/components/TopBar.tsx', '/workspaces/default/.publishing/src/pages/Landing.tsx', 'src/components/TopBar.tsx'),
    'Sidebar': ('/workspaces/default/.publishing/src/components/Sidebar.tsx', '/workspaces/default/.publishing/src/components/TopBar.tsx', 'src/components/Sidebar.tsx'),
    'App': ('/workspaces/default/.publishing/src/App.tsx', '/workspaces/default/.publishing/src/main.tsx', 'src/App.tsx'),
}

for name, (start_m, end_m, local_path) in pages_map.items():
    p1 = bundle_text.find(start_m)
    p2 = bundle_text.find(end_m)
    orig_chunk = bundle_text[p1:p2]
    
    with open(local_path, 'r') as f:
        local_content = f.read()
        
    # Extract string literals from orig_chunk and check if they exist in local_content
    # Find all backtick strings and quoted strings > 4 chars
    orig_strings = set(re.findall(r'`([^`$\\{}\n]{4,60})`', orig_chunk) + re.findall(r'\"([^\"$\\{}\n]{4,60})\"', orig_chunk))
    # filter out classnames, filenames, standard css
    def is_ui_text(s):
        s_low = s.lower()
        if any(c in s for c in ['flex', 'grid', 'bg-', 'text-', 'border-', 'rounded', 'px-', 'py-', 'w-', 'h-', 'col-', 'row-']):
            return False
        if any(c in s for c in ['.tsx', '.ts', 'recharts', 'xmlns', 'http', 'M21', 'M12', 'M19', 'rgba', '#']):
            return False
        if len(s.strip()) < 3:
            return False
        return True
        
    ui_strings = [s.strip() for s in orig_strings if is_ui_text(s)]
    missing = [s for s in ui_strings if s not in local_content]
    
    print(f"=== {name} ===")
    print(f"  Total UI strings identified: {len(ui_strings)}")
    if missing:
        print(f"  MISSING strings in {local_path} ({len(missing)}):")
        for m in missing[:15]:
            print(f"    - {m}")
    else:
        print(f"  All identified UI strings present!")
