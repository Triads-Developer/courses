module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Add a rule for CSV files with ?raw query
      webpackConfig.module.rules.push({
        test: /\.csv$/,
        resourceQuery: /raw/,
        type: 'asset/source'
      })
      
      // Add a rule for regular CSV files
      webpackConfig.module.rules.push({
        test: /\.csv$/,
        resourceQuery: { not: /raw/ },
        use: 'raw-loader'
      })

      return webpackConfig
    }
  }
} 