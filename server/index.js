import Config from "config";
import Routes from "./routes";
import Server from "./common/server";
// const dbUrl = `mongodb://${Config.get('databaseHost')}:${Config.get("databasePort")}/${Config.get("databaseName")}`;
const dbUrl =`mongodb+srv://kamalwebdev13:${Config.get("databasePass")}@cluster0.5il0wke.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
const server = new Server()
  .router(Routes)
  .configureSwagger(Config.get("swaggerDefinition"))
  .handleError()
  .configureDb(dbUrl)
  .then((_server) => _server.listen(Config.get("port")));

export default server;