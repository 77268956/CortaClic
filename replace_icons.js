const fs = require('fs');
const path = require('path');

const dir = 'src/public';

const map = {
  'bi-calendar-check': 'fa-calendar-check-o',
  'bi-calendar3': 'fa-calendar',
  'bi-calendar': 'fa-calendar',
  'bi-scissors': 'fa-scissors',
  'bi-list': 'fa-bars',
  'bi-box-arrow-right': 'fa-sign-out',
  'bi-person-circle': 'fa-user-circle',
  'bi-person': 'fa-user',
  'bi-envelope': 'fa-envelope',
  'bi-telephone': 'fa-phone',
  'bi-shop': 'fa-shopping-bag',
  'bi-bag-plus': 'fa-cart-plus',
  'bi-bag-x': 'fa-times-circle',
  'bi-bag': 'fa-shopping-bag',
  'bi-clock': 'fa-clock-o',
  'bi-search': 'fa-search',
  'bi-x-lg': 'fa-times',
  'bi-plus-lg': 'fa-plus',
  'bi-trash': 'fa-trash',
  'bi-receipt': 'fa-file-text-o',
  'bi-credit-card': 'fa-credit-card',
  'bi-house': 'fa-home',
  'bi-check-circle': 'fa-check-circle',
  'bi-pencil': 'fa-pencil',
  'bi-people': 'fa-users',
  'bi-journal-text': 'fa-book',
  'bi-box-seam': 'fa-archive',
  'bi-geo-alt': 'fa-map-marker',
  'bi-google': 'fa-google',
  'bi-arrow-clockwise': 'fa-refresh',
  'bi-star-fill': 'fa-star',
  'bi-star': 'fa-star-o',
  'bi-chevron-right': 'fa-chevron-right',
  'bi-chevron-left': 'fa-chevron-left'
};

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.html') || fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;

      // Replace CDN
      const oldCDN = /<link rel="stylesheet" href="https:\/\/cdn\.jsdelivr\.net\/npm\/bootstrap-icons[^>]+>/g;
      if (oldCDN.test(content)) {
        content = content.replace(oldCDN, '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">');
        modified = true;
      }

      // Replace icons
      if (content.includes('bi-') || content.includes('bi ')) {
        content = content.replace(/\bbi-([\w\-]+)\b/g, (match, p1) => {
          const fullBi = 'bi-' + p1;
          return map[fullBi] ? map[fullBi] : ('fa-' + p1);
        });
        content = content.replace(/\bbi\b/g, 'fa');
        modified = true;
      }

      if (modified) {
        fs.writeFileSync(fullPath, content);
        console.log('Updated ' + fullPath);
      }
    }
  }
}

walk(dir);
