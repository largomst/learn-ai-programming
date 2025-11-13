// 环境变量配置
interface Config {
  API_BASE_URL: string;
  API_KEY: string;
  MODEL: string;
}

class ConfigService {
  private static instance: ConfigService;
  private config: Config;

  private constructor() {
    this.config = {
      API_BASE_URL: process.env.API_BASE_URL || '',
      API_KEY: process.env.API_KEY || '',
      MODEL: process.env.MODEL || '',
    };
  }

  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  public getConfig(): Config {
    return this.config;
  }

  public validateConfig(): boolean {
    return !!(this.config.API_BASE_URL && this.config.API_KEY && this.config.MODEL);
  }
}

export default ConfigService;
