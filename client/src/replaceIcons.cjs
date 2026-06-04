const fs = require('fs');
const path = require('path');

const srcDir = 'c:/Users/Giang/DrinkMap/client/src';

const mapping = {
  Star: 'StarIcon',
  X: 'XMarkIcon',
  Bot: 'SparklesIcon',
  Mail: 'EnvelopeIcon',
  Lock: 'LockClosedIcon',
  User: 'UserIcon',
  ArrowRight: 'ArrowRightIcon',
  Loader2: 'ArrowPathIcon',
  ShieldCheck: 'ShieldCheckIcon',
  Coffee: 'BuildingStorefrontIcon',
  MoreVertical: 'EllipsisVerticalIcon',
  ThumbsUp: 'HandThumbUpIcon',
  MessageSquare: 'ChatBubbleLeftIcon',
  Image: 'PhotoIcon',
  ImageIcon: 'PhotoIcon',
  SlidersHorizontal: 'AdjustmentsHorizontalIcon',
  Edit3: 'PencilSquareIcon',
  MessageSquareOff: 'ChatBubbleBottomCenterTextIcon',
  Send: 'PaperAirplaneIcon',
  Loader: 'ArrowPathIcon',
  Sparkles: 'SparklesIcon',
  Search: 'MagnifyingGlassIcon',
  MapPin: 'MapPinIcon',
  Clock: 'ClockIcon',
  Phone: 'PhoneIcon',
  Navigation2: 'PaperAirplaneIcon',
  Bookmark: 'BookmarkIcon',
  Share2: 'ShareIcon',
  CheckCircle2: 'CheckCircleIcon',
  ChevronLeft: 'ChevronLeftIcon',
  ChevronRight: 'ChevronRightIcon',
  Globe: 'GlobeAltIcon',
  Info: 'InformationCircleIcon',
  Heart: 'HeartIcon',
  Compass: 'MapIcon',
  Navigation: 'MapIcon',
  DollarSign: 'CurrencyDollarIcon',
  Locate: 'ViewfinderCircleIcon',
  Home: 'HomeIcon',
  ArrowLeft: 'ArrowLeftIcon',
  Settings: 'Cog6ToothIcon',
  LogOut: 'ArrowRightOnRectangleIcon',
  Award: 'TrophyIcon',
  Shield: 'ShieldExclamationIcon',
  Bell: 'BellIcon',
  Trash2: 'TrashIcon'
};

function processFile(filePath) {
    let code = fs.readFileSync(filePath, 'utf8');
    
    const importRegex = /import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"];?/g;
    let match = importRegex.exec(code);
    
    if (!match) return; 

    const importsStr = match[1];
    const importedItems = importsStr.split(',').map(s => s.trim()).filter(Boolean);
    
    const heroImportsOutline = new Set();
    const replacements = [];

    importedItems.forEach(item => {
        let lucideName = item;
        let alias = null;
        
        if (item.includes(' as ')) {
            const parts = item.split(' as ').map(s => s.trim());
            lucideName = parts[0];
            alias = parts[1];
        }

        const heroName = mapping[lucideName];
        if (!heroName) {
            console.warn(`WARNING: No mapping for ${lucideName} in ${filePath}`);
            return;
        }

        heroImportsOutline.add(heroName);
        
        const tagToReplace = alias || lucideName;
        replacements.push({ from: new RegExp(`<${tagToReplace}\\b`, 'g'), to: `<${heroName}` });
        replacements.push({ from: new RegExp(`</${tagToReplace}>`, 'g'), to: `</${heroName}>` });
    });

    if (heroImportsOutline.size > 0) {
        replacements.forEach(r => {
            code = code.replace(r.from, r.to);
        });

        // Add both solid and outline for Star just in case, or just outline
        const newImportStr = `import { ${Array.from(heroImportsOutline).join(', ')} } from '@heroicons/react/24/outline';`;
        
        code = code.replace(importRegex, newImportStr);

        // Special handling for Star to use solid if it has fill-amber
        // but replacing everything to outline first is safe enough.

        fs.writeFileSync(filePath, code, 'utf8');
        console.log(`Updated ${filePath}`);
    }
}

function walk(dir) {
    for (const f of fs.readdirSync(dir)) {
        const fp = path.join(dir, f);
        if (fs.statSync(fp).isDirectory()) {
            walk(fp);
        } else if (fp.match(/\.jsx?$/)) {
            processFile(fp);
        }
    }
}

walk(srcDir);
