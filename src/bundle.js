const fs = require('fs');
const moment = require('moment');
const cachePath = './cache';
const bundlesPath = './bundles';

(async () => {
  if (!fs.existsSync(cachePath)) {
    console.error('No cache found. Please run the scraper first.')
    return;
  }

  if (!fs.existsSync(bundlesPath)) {
    fs.mkdirSync(bundlesPath);
  }

  console.info('generating content bundle');

  const timestamp = moment().format();

  const bundle = {
    timestamp,
    bundleVersion: '1',
    scenes: fs.readdirSync(cachePath)
      .map(path => fs.readFileSync(`${cachePath}/${path}`))
      .map(JSON.parse)
      .map(scene => ({
        '_id': `vrhush-${scene.sceneId}`,
        'scene_id': scene.sceneId,
        'scene_type': 'VR',
        'title': scene.title,
        'studio': 'VRHush',
        'site': 'VRHush',
        'covers': [scene.cover],
        'gallery': scene.images,
        'tags': scene.tags,
        'cast': scene.models,
        'filename': scene.filenames,
        'duration': 0,
        'synopsis': scene.description,
        'released': moment(scene.date, 'MMM DD, YYYY').format('YYYY-MM-DD'),
        'homepage_url': scene.url,
      }))
  };

  console.info('writing bundle');
  fs.writeFileSync(`${bundlesPath}/vrhush-bundle-${timestamp}.json`, JSON.stringify(bundle, null, 2));
})();