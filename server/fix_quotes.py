import re

with open('server/seed.py', 'r', encoding='utf-8') as f:
    text = f.read()

# replace all occurrences of \" with "
text = re.sub(r'\\"', '"', text)

with open('server/seed.py', 'w', encoding='utf-8') as f:
    f.write(text)

print('quotes fixed')
