import express from "express";
import { createSaveHandler } from "./handlers/save";

export function createRoutes(params: {
  projectDir: string;
  sessionToken: string;
}): express.Router {
  const router = express.Router();
  router.post("/save", createSaveHandler(params));
  return router;
}
