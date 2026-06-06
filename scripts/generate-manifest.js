const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..');
const MAPS_DIR = path.join(REPO_ROOT, 'maps');
const OUTPUT = path.join(REPO_ROOT, 'docs', 'manifest.json');

const IMAGE_EXTS = ['.png', '.jpg', '.jpeg', '.webp'];

function toRepoRel(absolutePath) {
  return path.relative(REPO_ROOT, absolutePath).replace(/\\/g, '/');
}

function findImage(basePath) {
  for (const ext of IMAGE_EXTS) {
    const p = basePath + ext;
    if (fs.existsSync(p)) {
      return toRepoRel(p);
    }
  }
  return null;
}

function getPreviewImage(dirPath) {
  for (const ext of IMAGE_EXTS) {
    const p = path.join(dirPath, 'preview' + ext);
    if (fs.existsSync(p)) {
      return toRepoRel(p);
    }
  }
  return null;
}

function countBricks(mapData) {
  const counts = {};
  let total = 0;
  if (!Array.isArray(mapData.levels)) return { counts, total };
  for (const level of mapData.levels) {
    if (!Array.isArray(level.tiles)) continue;
    for (const tile of level.tiles) {
      const element = tile.element;
      if (element) {
        counts[element] = (counts[element] || 0) + 1;
        total++;
      }
    }
  }
  return { counts, total };
}

function scanMaps(dir, relativePath) {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  const jsonFiles = items.filter(i => i.isFile() && i.name.endsWith('.json'));
  const subDirs = items.filter(i => i.isDirectory());

  const maps = [];
  for (const file of jsonFiles) {
    const filePath = path.join(dir, file.name);
    const relPath = path.join(relativePath, file.name).replace(/\\/g, '/');
    const base = filePath.replace(/\.json$/, '');
    const image = findImage(base);

    let mapData = null;
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      mapData = JSON.parse(raw);
    } catch (e) {
      console.warn(`Skipping invalid JSON: ${relPath}`);
      continue;
    }

    const { counts, total } = countBricks(mapData);
    maps.push({
      title: mapData.title || file.name.replace(/\.json$/, ''),
      description: mapData.description || '',
      id: mapData.id || null,
      path: relPath,
      image: image,
      creationDate: mapData.creationDate || null,
      modificationDate: mapData.modificationDate || null,
      totalBricks: total,
      brickCount: counts,
    });
  }

  const subCollections = [];
  for (const subDir of subDirs) {
    const subPath = path.join(dir, subDir.name);
    const relSubPath = path.join(relativePath, subDir.name).replace(/\\/g, '/');
    const child = scanMaps(subPath, relSubPath);
    if (child.maps.length > 0 || child.subCollections.length > 0) {
      subCollections.push(child);
    }
  }

  let preview = getPreviewImage(dir);
  // Fallback to first map's image if no preview file exists
  if (!preview && maps.length > 0) {
    preview = maps[0].image;
  }

  return {
    name: path.basename(dir),
    path: relativePath.replace(/\\/g, '/'),
    preview: preview,
    maps,
    subCollections,
  };
}

function buildManifest() {
  const collections = [];
  if (!fs.existsSync(MAPS_DIR)) {
    console.error('maps/ directory not found');
    process.exit(1);
  }

  const users = fs.readdirSync(MAPS_DIR, { withFileTypes: true }).filter(i => i.isDirectory());
  for (const user of users) {
    const userDir = path.join(MAPS_DIR, user.name);
    const relPath = path.join('maps', user.name).replace(/\\/g, '/');
    const userData = scanMaps(userDir, relPath);

    // Top-level entries are either direct maps or first-level subfolders
    for (const sub of userData.subCollections) {
      collections.push(sub);
    }
    for (const map of userData.maps) {
      // Direct map in user folder becomes its own collection of 1
      collections.push({
        name: map.title,
        path: map.path.replace(/\.json$/, ''),
        preview: map.image,
        maps: [map],
        subCollections: [],
      });
    }
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    collections,
  };

  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, JSON.stringify(manifest, null, 2));
  console.log(`Generated ${OUTPUT} with ${collections.length} collections`);
}

buildManifest();
