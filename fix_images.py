import json
import urllib.request
import re
import random
import os

def check_url(url):
    try:
        req = urllib.request.Request(url, method='HEAD')
        req.add_header('User-Agent', 'Mozilla/5.0')
        urllib.request.urlopen(req)
        return True
    except Exception as e:
        return False

print("Scanning seed.py...")
with open('server/connectMongo/seed.py', 'r', encoding='utf-8') as f:
    seed_text = f.read()

seed_urls = list(set(re.findall(r'https://images.unsplash.com/photo-[\w-]+', seed_text)))
valid_seed_urls = []
for u in seed_urls:
    if check_url(u + "?w=800&auto=format&fit=crop&q=80"):
        valid_seed_urls.append(u)

print(f"Valid seed URLs: {len(valid_seed_urls)}")

print("Scanning drinks.json...")
with open('server/connectMongo/drinks.json', 'r', encoding='utf-8') as f:
    drinks_data = json.load(f)

valid_drink_urls = []
for d in drinks_data:
    u = d.get('image_url', '')
    if 'unsplash.com' in u:
        base_url = u.split('?')[0]
        if base_url not in valid_drink_urls:
            if check_url(base_url + "?w=800&auto=format&fit=crop&q=80"):
                valid_drink_urls.append(base_url)

print(f"Valid drink URLs: {len(valid_drink_urls)}")

# FIX DRINKS.JSON
for d in drinks_data:
    u = d.get('image_url', '')
    base_url = u.split('?')[0] if 'unsplash.com' in u else u
    if base_url not in valid_drink_urls:
        d['image_url'] = random.choice(valid_drink_urls) + "?w=800&auto=format&fit=crop&q=80"
    else:
        d['image_url'] = base_url + "?w=800&auto=format&fit=crop&q=80"

with open('server/connectMongo/drinks.json', 'w', encoding='utf-8') as f:
    json.dump(drinks_data, f, ensure_ascii=False, indent=2)

# FIX SEED.PY
# Find COFFEE_IMAGES = [...]
start_idx = seed_text.find("COFFEE_IMAGES = [")
end_idx = seed_text.find("]", start_idx) + 1

new_list = "COFFEE_IMAGES = [\n"
for u in valid_seed_urls:
    new_list += f'    "{u}",\n'
new_list += "]"

new_seed_text = seed_text[:start_idx] + new_list + seed_text[end_idx:]

with open('server/connectMongo/seed.py', 'w', encoding='utf-8') as f:
    f.write(new_seed_text)

print("Fixed both files. Now running seed.py...")
