import { readFileSync } from 'fs';

const appName = process.env.APP_NAME || 'smartling-docker-mcp';

let appVersion = '1.0.0';

try {
  appVersion = JSON.parse(
    readFileSync(`${__dirname}/../../package.json`).toString(),
  ).version;
} catch (e) {}

export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  appName,
  appVersion,
  smartlingApiBaseUrl:
    process.env.SMARTLING_API_BASE_URL || 'https://api.smartling.com',
  smartlingUserIdentifier: process.env.SMARTLING_USER_IDENTIFIER || '',
  smartlingUserSecret: process.env.SMARTLING_USER_SECRET || '',
  smartlingProjectId: process.env.SMARTLING_PROJECT_ID || '',
  inputDir: process.env.INPUT_DIR || '/workspace/input',
  outputDir: process.env.OUTPUT_DIR || '/workspace/output',
});
