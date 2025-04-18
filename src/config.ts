import fs from 'fs';
import zod from 'zod';

const json = fs.readFileSync('config.json', 'utf-8');
const config = JSON.parse(json);

const configSchema = zod.object({
  appId: zod.string(),
  apiKey: zod.string(),
  email: zod.object({
    username: zod.string(),
    password: zod.string(),
    host: zod.string(),
    port: zod.number(),
    secure: zod.boolean(),
    recipients: zod.array(zod.string()),
  }),
  salariedHours: zod.array(
    zod.object({
      name: zod.string(),
      hours: zod.number(),
    }),
  ),
});

const parsedConfig = configSchema.safeParse(config);
if (!parsedConfig.success) {
  const firstError = parsedConfig.error.errors[0];
  const errorMessage = `Invalid config file: "${firstError?.path.join('.')}" - ${firstError?.message}`;
  console.error(errorMessage);
  process.exit(1);
}

export default parsedConfig.data;
