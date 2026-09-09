import re

with open('figma_dump/PassengerDashboard_raw.js') as f:
    text = f.read()

# Let's extract the data arrays at the beginning
p_mb = text.find('function MB(')
print("--- PREAMBLE & DATA ---")
print(text[:p_mb])
