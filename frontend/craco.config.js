module.exports = {
  babel: {
    plugins: [
      [
        'babel-plugin-react-compiler',
        {
          // Optionally compile only certain files
          sources: (filename) => filename.includes('src/'),
        },
      ],
    ],
  },
};