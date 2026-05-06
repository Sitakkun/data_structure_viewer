import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/data_structure_viewer/",
  plugins: [react()],
});
