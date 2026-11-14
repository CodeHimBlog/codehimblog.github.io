/** Optional: rebuild assets/css/site.css with the official Tailwind CSS v3 CLI.
 *  npx tailwindcss@3 -c tailwind.config.cjs -i tools/src/tailwind-input.css -o assets/css/site.css --minify
 *  The default build (node tools/build.mjs) does not need this file. */
module.exports = {
  content: ['./*.html', './!(tools|content|docs|node_modules)/**/*.html', './assets/js/site.js'],
  corePlugins: { preflight: false }, // tools/src/base.css already contains a minimal preflight
  theme: {
    extend: {
      colors: { primary: { DEFAULT: '#2563EB', hover: '#1D4ED8' } },
    },
  },
};
