#!/usr/bin/env python3
# Simple cleanup script - read file, identify sections, rewrite without them

with open('app/prescriptions/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find and remove the Workflow section 
workflow_start = content.find('<section className="grid gap-6 lg:grid-cols=')
if workflow_start != -1:
    # Find the corresponding closing tag
    section_count = 1
    pos = workflow_start + len('<section')
    while section_count > 0 and pos < len(content):
        next_open = content.find('<section', pos)
        next_close = content.find('</section>', pos)
        
        if next_close == -1:
            break
        if next_open != -1 and next_open < next_close:
            section_count += 1
            pos = next_open + len('<section')
        else:
            section_count -= 1
            pos = next_close + len('</section>')
    
    if section_count == 0:
        # Remove from workflow_start to pos
        content = content[:workflow_start] + content[pos:]

# Find and remove the Table de prescriptions section
table_start = content.find('<section className="rounded-3xl border border-slate-200/70 bg-white p-6')
if table_start != -1:
    # Search for "Table de prescriptions" within this section
    table_text_pos = content.find('Table de prescriptions', table_start)
    if table_text_pos != -1:
        # Go back to find the section opening
        section_open = content.rfind('<section', 0, table_start)
        if section_open == -1:
            section_open = table_start
        
        # Find the closing section
        section_count = 1
        pos = section_open + len('<section')
        while section_count > 0 and pos < len(content):
            next_open = content.find('<section', pos)
            next_close = content.find('</section>', pos)
            
            if next_close == -1:
                break
            if next_open != -1 and next_open < next_close:
                section_count += 1
                pos = next_open + len('<section')
            else:
                section_count -= 1
                pos = next_close + len('</section>')
        
        if section_count == 0:
            content = content[:section_open] + content[pos:]

with open('app/prescriptions/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('File cleaned successfully!')
