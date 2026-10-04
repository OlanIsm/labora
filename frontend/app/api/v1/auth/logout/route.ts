import { logout } from "@backend/modules/identity";
import { apiHandler } from "@backend/shared/http";
export const POST = apiHandler(logout);
export {
  unsupportedMethod as GET,
  unsupportedMethod as PATCH,
  unsupportedMethod as PUT,
  unsupportedMethod as DELETE,
} from "@backend/shared/http";
