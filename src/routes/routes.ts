import { Router } from "express";
import { routesList } from "./list";

const router = Router();

routesList.forEach((route) => {
  (router as any)[route.method.toLowerCase()](route.path, [
    ...(route?.middleware || []),
    route.handler,
  ]);
});

export default router;
