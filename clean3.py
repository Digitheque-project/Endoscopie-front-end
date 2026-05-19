with open('app/prescriptions/page.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

output = []
i = 0

while i < len(lines):
    line = lines[i]
    
    # Skip the Workflow section by looking for distinctive markers
    if 'Prescription active' in line and 'rounded-full bg-blue-50' in lines[i-2]:
        # Start of Workflow section - backtrack to find section opening
        j = len(output) - 1
        while j >= 0 and '<section className="grid gap-6 lg:grid-cols="[1.7fr_1fr]' not in output[j]:
            j -= 1
        
        if j >= 0:
            # Remove from that section tag
            output = output[:j]
            
            # Skip until we find the closing </section>
            depth = 0
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
    
    # Skip the Table de prescriptions section
    if 'Table de prescriptions' in line:
        # Backtrack to find the opening section
        j = len(output) - 1
        while j >= 0 and '<section className="rounded-3xl border' not in output[j]:
            j -= 1
        
        if j >= 0:
            # Remove from that section
            output = output[:j]
            
            # Skip until closing </section>
            depth = 0
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

print('Cleaned!')
