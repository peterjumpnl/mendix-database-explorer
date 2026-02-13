import * as esbuild from 'esbuild'
import {copyToAppPlugin, copyManifestPlugin, commonConfig, bundleCssPlugin} from "./build.helpers.mjs"
import parseArgs from "minimist"

const outDir = `dist/database-explorer`
const appDir = "D:\\Workstation\\low-code\\mendix\\TestMendixDocumenter-main"
const extensionDirectoryName = "extensions"

const entryPoints = [
    {
        in: 'src/main/index.ts',
        out: 'main'
    }   
]

entryPoints.push({
    in: 'src/ui/pane.tsx',
    out: 'pane'
})

const args = parseArgs(process.argv.slice(2))
const buildContext = await esbuild.context({
  ...commonConfig,
  outdir: outDir,
  plugins: [bundleCssPlugin(outDir, "style.css", { inject: true }), copyManifestPlugin(outDir), copyToAppPlugin(appDir, outDir, extensionDirectoryName)],
  entryPoints
})

if('watch' in args) {
    await buildContext.watch();
} 
else {
    await buildContext.rebuild();
    await buildContext.dispose();
}


