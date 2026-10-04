import { getProfile, updateProfile } from "@backend/modules/identity";
import { apiHandler } from "@backend/shared/http";
export const GET = apiHandler(getProfile);
export const PATCH = apiHandler(updateProfile);
export {
  unsupportedMethod as POST,
  unsupportedMethod as PUT,
  unsupportedMethod as DELETE,
} from "@backend/shared/http";
