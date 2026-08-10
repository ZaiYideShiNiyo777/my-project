// Polyfill Object.fromEntries for Node 10 compatibility
if (!Object.fromEntries) {
  Object.fromEntries = function (entries) {
    var obj = {};
    for (var i = 0; i < entries.length; i++) {
      obj[entries[i][0]] = entries[i][1];
    }
    return obj;
  };
}

module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
