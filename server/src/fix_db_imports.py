import os
import glob
import re

DIR = r"C:\Users\Giang\Documents\DrinkMap\server\src"

def replace_db_import(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = re.sub(r'\bapp\.core\.database\b', 'app.db.database', content)
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for root, _, files in os.walk(DIR):
    for file in files:
        if file.endswith('.py'):
            replace_db_import(os.path.join(root, file))
