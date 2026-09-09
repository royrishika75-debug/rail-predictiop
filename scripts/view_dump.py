import sys

file_name = sys.argv[1] if len(sys.argv) > 1 else 'NetworkIntelligence'
with open(f'figma_dump/formatted/{file_name}.formatted.js') as f:
    lines = f.readlines()

start = int(sys.argv[2]) if len(sys.argv) > 2 else 0
end = int(sys.argv[3]) if len(sys.argv) > 3 else len(lines)

for i in range(start, min(end, len(lines))):
    sys.stdout.write(f"{i}: {lines[i]}")
