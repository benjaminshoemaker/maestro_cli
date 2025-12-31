import express from "express";
import { createSaveHandler, type SavedDocument } from "./handlers/save";

export function createRoutes(params: {
  projectDir: string;
  sessionToken: string;
  onSaved?: (doc: SavedDocument) => void;
}): express.Router {
  const router = express.Router();
  router.post("/save", createSaveHandler(params));
  return router;
}
