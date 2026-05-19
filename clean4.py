with open('app/prescriptions/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Simple replacement: find the exact section and replace it with nothing
# This section starts with <section className="grid gap-6 lg:grid-cols=
# and ends with </section> after "Statut de prescription"

start_marker = '<section className="grid gap-6 lg:grid-cols='
end_marker = '</section>'

# Find first occurrence after header
start_pos = content.find(start_marker)

if start_pos != -1:
    # Find the matching closing section
    pos = start_pos + len(start_marker)
    
    # Skip to find "1.7fr_1fr" to confirm it's the right one
    bracket_pos = content.find('[1.7fr_1fr]', start_pos)
    
    if bracket_pos != -1 and bracket_pos < start_pos + 200:
        # Count section tags from start_pos
        section_depth = 1
        search_pos = start_pos + len(start_marker)
        
        while section_depth > 0:
            next_open = content.find('<section', search_pos)
            next_close = content.find('</section>', search_pos)
            
            if next_close == -1:
                break
                
            if next_open != -1 and next_open < next_close:
                section_depth += 1
                search_pos = next_open + len('<section')
            else:
                section_depth -= 1
                search_pos = next_close + len('</section>')
                if section_depth == 0:
                    # Found the matching closing tag
                    content = content[:start_pos] + content[search_pos:]
                    break

with open('app/prescriptions/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Workflow section removed!')
