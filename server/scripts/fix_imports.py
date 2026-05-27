import os
import glob
import re

MONGO_URI = os.getenv("MONGO_URL")

def replace_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Simple regex to replace app.schemas -> app.schemas, app.models -> app.models, app.crud -> app.crud
    new_content = re.sub(r'\bapp\.dtos\b', 'app.schemas', content)
    new_content = re.sub(r'\bapp\.entities\b', 'app.models', new_content)
    new_content = re.sub(r'\bapp\.repositories\b', 'app.crud', new_content)
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for root, _, files in os.walk(MONGO_URI):
    for file in files:
        if file.endswith('.py'):
            replace_in_file(os.path.join(root, file))
