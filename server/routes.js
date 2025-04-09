//v7 imports
import admin from "./api/v1/controllers/admin/routes";
import user from "./api/v1/controllers/user/routes";
import statics from "./api/v1/controllers/static/routes";
import category from "./api/v1/controllers/category/routes";
import product from "./api/v1/controllers/product/routes";
import notification from "./api/v1/controllers/notification/routes";

/**
 *
 *
 * @export
 * @param {any} app
 */

export default function routes(app) {
  app.use("/api/v1/user", user);
  app.use("/api/v1/admin", admin);
  app.use("/api/v1/static", statics);
  app.use("/api/v1/category", category);
  app.use("/api/v1/product", product);
  app.use("/api/v1/notification", notification);

  return app;
}
