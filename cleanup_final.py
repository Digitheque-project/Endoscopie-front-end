#!/usr/bin/env python3

with open('app/prescriptions/page.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find and skip the Workflow section
# It starts at line 104 and ends at line 169 based on our read
output_lines = lines[:104] + lines[169:]

with open('app/prescriptions/page.tsx', 'w', encoding='utf-8') as f:
    f.writelines(output_lines)

print('Done!')
