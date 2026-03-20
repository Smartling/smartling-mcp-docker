import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger, SmartlingApiClientBuilder } from 'smartling-api-sdk-nodejs';

const consoleLogger: Logger = {
  debug: (...args: unknown[]) =>
    process.stderr.write(`[smartling:debug] ${args.join(' ')}\n`),
  warn: (...args: unknown[]) =>
    process.stderr.write(`[smartling:warn] ${args.join(' ')}\n`),
  error: (...args: unknown[]) =>
    process.stderr.write(`[smartling:error] ${args.join(' ')}\n`),
};

@Injectable()
export class SmartlingApiPrebuilder {
  constructor(private readonly configService: ConfigService) {}

  public preBuild(): SmartlingApiClientBuilder {
    return new SmartlingApiClientBuilder()
      .setLogger(consoleLogger)
      .setBaseSmartlingApiUrl(
        this.configService.getOrThrow<string>('smartlingApiBaseUrl'),
      )
      .setClientLibMetadata(
        this.configService.getOrThrow<string>('appName'),
        this.configService.getOrThrow<string>('appVersion'),
      )
      .authWithUserIdAndUserSecret(
        this.configService.getOrThrow<string>('smartlingUserIdentifier'),
        this.configService.getOrThrow<string>('smartlingUserSecret'),
      );
  }
}
