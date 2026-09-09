import re

with open('figma_dump/PassengerDashboard_raw.js') as f:
    text = f.read()

p_ib = text.find('function IB(')
ib_code = text[p_ib:]

with open('figma_dump/PassengerDashboard_IB.js', 'w') as f:
    f.write(ib_code)

print("Wrote PassengerDashboard_IB.js, length:", len(ib_code))
