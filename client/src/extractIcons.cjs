const fs = require('fs');
const path = require('path');
const srcDir = 'c:/Users/Giang/DrinkMap/client/src';
const importedIcons = new Set();
function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const fp = path.join(dir, f);
    if (fs.statSync(fp).isDirectory()) walk(fp);
    else if (fp.match(/\.jsx?$/)) {
      const code = fs.readFileSync(fp, 'utf8');
      const m = code.match(/import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"]/g);
      if (m) {
        m.forEach(match => {
          const inner = match.match(/import\s+\{([^}]+)\}/)[1];
          inner.split(',').forEach(i => importedIcons.add(i.trim().split(' ')[0]));
        });
      }
    }
  }
}
walk(srcDir);
console.log(Array.from(importedIcons).filter(Boolean).join(', '));
