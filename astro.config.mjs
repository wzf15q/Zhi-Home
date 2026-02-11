import { defineConfig } from "astro/config";

// 自动检测部署平台：GitHub Pages 或 Vercel
const isGitHubPages = process.env.GITHUB_PAGES === 'true';

export default defineConfig({
  site: isGitHubPages
    ? "https://wzf15q.github.io"
    : "https://zhi-home-hm5iwey4c-jeffws-projects.vercel.app",
  base: isGitHubPages ? "/Zhi-Home/" : "/",
  output: "static"
});
