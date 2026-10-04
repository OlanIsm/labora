import { authConfiguration } from "@backend/modules/identity";
import { apiHandler } from "@backend/shared/http";
export const GET = apiHandler(async () => authConfiguration());
export {
  unsupportedMethod as POST,
  unsupportedMethod as PATCH,
  unsupportedMethod as PUT,
  unsupportedMethod as DELETE,
} from "@backend/shared/http";
