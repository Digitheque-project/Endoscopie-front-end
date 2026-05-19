import re

with open('app/prescriptions/page.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find lines to skip
output = []
skip = False
depth = 0

i = 0
while i < len(lines):
    line = lines[i]
    
    # Check if we're starting the Workflow section
    if 'className="grid gap-6 lg:grid-cols=' in line and '1.7fr_1fr' in line:
        skip = True
        depth = 1
        i += 1
        continue
    
    if skip:
        # Count opening and closing tags
        if '<section' in line:
            depth += 1
        if '</section>' in line:
            depth -= 1
            if depth == 0:
                skip = False
                i += 1
                continue
        i += 1
        continue
    
    # Check if we're starting the Table de prescriptions section
    if 'Table de prescriptions' in line:
        # Go back to find the opening <section>
        j = len(output) - 1
        while j >= 0 and '<section' not in output[j]:
            j -= 1
        # Remove from that point
        output = output[:j]
        # Skip until we find the closing </section>
        depth = 1
        i += 1
        while i < len(lines):
            if '<section' in lines[i]:
                depth += 1
            if '</section>' in lines[i]:
                depth -= 1
                if depth == 0:
                    i += 1
                    break
            i += 1
        continue
    
    output.append(line)
    i += 1

with open('app/prescriptions/page.tsx', 'w', encoding='utf-8') as f:
    f.writelines(output)

print('Done!')
