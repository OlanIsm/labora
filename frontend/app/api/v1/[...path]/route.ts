import { AppError } from "@backend/shared/errors";
import { apiHandler } from "@backend/shared/http";
const missing = apiHandler(async () => {
  throw new AppError("NOT_FOUND");
});
export {
  missing as GET,
  missing as POST,
  missing as PATCH,
  missing as PUT,
  missing as DELETE,
  missing as OPTIONS,
};
