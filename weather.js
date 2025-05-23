const fs = require('fs');
const axios = require('axios');

// 从环境变量获取高德密钥和城市信息
const AMAP_KEY = process.env.AMAP_KEY;
const CITY_ADDRESS = process.env.CITY_ADDRESS;

async function getCity() {
  const params = {
    key: AMAP_KEY,
    address: CITY_ADDRESS,
  };
  let res = await axios.get('https://restapi.amap.com/v3/geocode/geo', { params });
  return res.data.geocodes[0].adcode;
}

async function getWeather() {
  try {
    const adcode = await getCity();
    const params = {
      key: AMAP_KEY,
      city: adcode,
      extensions: 'all',
    };
    const res = await axios.get('https://restapi.amap.com/v3/weather/weatherInfo', { params });
    
    // 生成带日期的文件名
    const date = new Date().toISOString().split('T')[0];
    const filename = `weather-data/${date}.json`;
    
    // 保存为JSON文件
    fs.mkdirSync('weather-data', { recursive: true });
    fs.writeFileSync(filename, JSON.stringify(res.data, null, 2));
    console.log(`✅ 天气数据已保存到 ${filename}`);
  } catch (error) {
    console.error('❌ 获取天气数据失败:', error.message);
    process.exit(1);
  }
}

getWeather();
