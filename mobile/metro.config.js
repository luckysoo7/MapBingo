const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// .geojson 파일을 JSON 소스 모듈로 처리
config.resolver.sourceExts.push('geojson');

module.exports = config;
