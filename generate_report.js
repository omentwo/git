// generate_report.js
const fs = require('node:fs'); // 使用 'node:fs' 推荐的 Node.js 核心模块导入方式
const path = require('node:path');

// --- 配置路径 ---
const WEATHER_DATA_DIR = 'weather-data';
const TEMPLATE_FILE_PATH = path.join('templates', 'weather_template.html');
const OUTPUT_REPORT_FILE_PATH = 'weather-report.html'; // 最终生成的报告文件名
const WEATHER_DATA_PLACEHOLDER = '/* WEATHER_DATA_PLACEHOLDER */';

// --- 辅助函数：获取当天日期的 YYYY-MM-DD 格式字符串 ---
function getTodayDateString() {
    const today = new Date();
    // 根据 GitHub Actions runner 的时区 (env.TZ: Asia/Shanghai) 来获取本地日期
    // 如果脚本在本地运行，确保本地时区与期望的一致，或者调整 Date 对象创建方式
    // 为了与 GitHub Actions 中的 TZ 环境变量行为一致，这里我们假设 new Date() 能反映正确的本地时间
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // 月份从0开始，所以+1
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// --- 主逻辑 ---
function generateReport() {
    console.log('🚀 Starting weather report generation...');

    const todayDateString = getTodayDateString();
    const weatherJsonFileName = `${todayDateString}.json`;
    const weatherJsonPath = path.join(WEATHER_DATA_DIR, weatherJsonFileName);

    console.log(`INFO: Today's date (for data file): ${todayDateString}`);
    console.log(`INFO: Expecting weather data file at: ${weatherJsonPath}`);
    console.log(`INFO: Using HTML template from: ${TEMPLATE_FILE_PATH}`);

    // 1. 检查并读取天气数据 JSON 文件
    let weatherJsonString;
    try {
        if (!fs.existsSync(weatherJsonPath)) {
            console.error(`❌ ERROR: Weather data file not found: ${weatherJsonPath}`);
            // 生成一个包含错误信息的简单 HTML 报告
            const errorHtmlContent = `
                <!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><title>天气报告 - 错误</title></head>
                <body><h1>天气数据缺失</h1>
                <p>未能找到 ${todayDateString} 的天气数据文件 (${weatherJsonPath})。</p>
                <p>请检查前序步骤是否成功获取并保存了天气数据。</p>
                </body></html>`;
            fs.writeFileSync(OUTPUT_REPORT_FILE_PATH, errorHtmlContent, 'utf-8');
            console.log(`📝 Fallback error report generated: ${OUTPUT_REPORT_FILE_PATH}`);
            process.exitCode = 0; // 允许工作流继续提交这个错误报告，但不标记为失败
            return;
        }
        weatherJsonString = fs.readFileSync(weatherJsonPath, 'utf-8');
        // 可选：尝试解析JSON以验证其有效性，但对于模板注入，原始字符串即可
        // JSON.parse(weatherJsonString); // 如果解析失败会抛出错误
        console.log('✅ Successfully read weather data JSON file.');
    } catch (error) {
        console.error(`❌ ERROR: Failed to read or parse weather data file (${weatherJsonPath}):`, error.message);
        const errorHtmlContent = `
            <!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><title>天气报告 - 错误</title></head>
            <body><h1>读取天气数据时出错</h1>
            <p>在处理文件 ${weatherJsonPath} 时发生错误: ${error.message}</p>
            </body></html>`;
        fs.writeFileSync(OUTPUT_REPORT_FILE_PATH, errorHtmlContent, 'utf-8');
        console.log(`📝 Fallback error report generated: ${OUTPUT_REPORT_FILE_PATH}`);
        process.exitCode = 1; // 标记为失败
        return;
    }

    // 2. 读取 HTML 模板文件
    let templateHtml;
    try {
        if (!fs.existsSync(TEMPLATE_FILE_PATH)) {
            console.error(`❌ ERROR: HTML template file not found: ${TEMPLATE_FILE_PATH}`);
            // 这种情况比较严重，因为没有模板就无法生成报告
             const errorHtmlContent = `
                <!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><title>天气报告 - 错误</title></head>
                <body><h1>HTML 模板文件缺失</h1>
                <p>未能找到 HTML 模板文件 (${TEMPLATE_FILE_PATH})。</p>
                <p>请确保模板文件已正确放置在仓库中。</p>
                </body></html>`;
            fs.writeFileSync(OUTPUT_REPORT_FILE_PATH, errorHtmlContent, 'utf-8');
            console.log(`📝 Fallback error report generated due to missing template: ${OUTPUT_REPORT_FILE_PATH}`);
            process.exitCode = 1;
            return;
        }
        templateHtml = fs.readFileSync(TEMPLATE_FILE_PATH, 'utf-8');
        console.log('✅ Successfully read HTML template file.');
    } catch (error) {
        console.error(`❌ ERROR: Failed to read HTML template file (${TEMPLATE_FILE_PATH}):`, error.message);
        // 无法读取模板也生成错误报告
        const errorHtmlContent = `
            <!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><title>天气报告 - 错误</title></head>
            <body><h1>读取HTML模板时出错</h1>
            <p>在处理文件 ${TEMPLATE_FILE_PATH} 时发生错误: ${error.message}</p>
            </body></html>`;
        fs.writeFileSync(OUTPUT_REPORT_FILE_PATH, errorHtmlContent, 'utf-8');
        console.log(`📝 Fallback error report generated: ${OUTPUT_REPORT_FILE_PATH}`);
        process.exitCode = 1;
        return;
    }

    // 3. 将天气数据注入到 HTML 模板中
    if (templateHtml.includes(WEATHER_DATA_PLACEHOLDER)) {
        const finalHtml = templateHtml.replace(WEATHER_DATA_PLACEHOLDER, weatherJsonString);
        console.log('🔄 Injected weather data into HTML template.');

        // 4. 将最终的 HTML 内容写入输出文件
        try {
            fs.writeFileSync(OUTPUT_REPORT_FILE_PATH, finalHtml, 'utf-8');
            console.log(`🎉 Successfully generated weather report: ${OUTPUT_REPORT_FILE_PATH}`);
        } catch (error) {
            console.error(`❌ ERROR: Failed to write final HTML report to ${OUTPUT_REPORT_FILE_PATH}:`, error.message);
            process.exitCode = 1;
        }
    } else {
        console.error(`❌ ERROR: Placeholder "${WEATHER_DATA_PLACEHOLDER}" not found in HTML template (${TEMPLATE_FILE_PATH}).`);
        console.log('INFO: Please ensure the placeholder exists in your template file.');
        // 即使占位符未找到，也尝试写入一个包含此信息的报告
        const errorHtmlContent = `
            <!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><title>天气报告 - 错误</title></head>
            <body><h1>模板占位符缺失</h1>
            <p>在 HTML 模板文件 (${TEMPLATE_FILE_PATH}) 中未能找到占位符: <code>${WEATHER_DATA_PLACEHOLDER}</code>。</p>
            <p>请检查模板文件确保占位符正确无误。</p>
            <p>原始模板内容（部分）：</p>
            <pre>${templateHtml.substring(0, 500)}...</pre>
            </body></html>`;
        fs.writeFileSync(OUTPUT_REPORT_FILE_PATH, errorHtmlContent, 'utf-8');
        console.log(`📝 Fallback error report generated due to missing placeholder: ${OUTPUT_REPORT_FILE_PATH}`);
        process.exitCode = 1;
    }
}

// 执行主函数
generateReport();

// 如果在过程中设置了 process.exitCode，脚本将以该代码退出
// 如果一切顺利，默认退出码为 0
