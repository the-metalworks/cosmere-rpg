import { defineConfig, Plugin } from 'vite';
import { createHash } from 'crypto';
import path from 'path';
import fs from 'fs';
import { marked } from 'marked';

/**
 * Plugin to clear the output directory before building, preserving the packs folder.
 */
function clearOutputDir(): Plugin {
    return {
        name: 'clear-output-dir',
        buildStart() {
            const outputDir = 'build';

            if (fs.existsSync(outputDir)) {
                const files = fs
                    .readdirSync(outputDir)
                    .filter((file) => file !== 'packs')
                    .map((file) => path.join(outputDir, file));

                files.forEach((file) => {
                    fs.rmSync(file, { recursive: true, force: true });
                });
            } else {
                fs.mkdirSync(outputDir);
            }
        },
    };
}

/**
 * Plugin to parse markdown files and output as HTML.
 */
function markdownParser(config: {
    targets: { src: string; dest: string }[];
}): Plugin {
    return {
        name: 'markdown-parser',
        closeBundle() {
            const markdownFiles = config.targets
                .filter((target) => target.src.endsWith('.md'))
                .filter((target) => fs.existsSync(target.src));

            markdownFiles.forEach((target) => {
                const content = fs.readFileSync(target.src, 'utf8');
                const parsed = marked.parse(content, { async: false });
                const fileName = path.basename(target.src, '.md');
                const destPath = path.join(target.dest, `${fileName}.html`);

                if (!fs.existsSync(target.dest)) {
                    fs.mkdirSync(target.dest, { recursive: true });
                }

                fs.writeFileSync(destPath, `<div>${parsed}</div>`);
            });
        },
    };
}

/**
 * Plugin to fix PIXI imports by replacing ES imports with global PIXI references.
 */
function pixiImportFix(): Plugin {
    return {
        name: 'pixi-import-fix',
        renderChunk(code) {
            return code.replace(
                "import { Filter, utils } from '@pixi/core';",
                [
                    'const Filter = PIXI.Filter;',
                    'const utils = PIXI.utils;',
                ].join('\n'),
            );
        },
    };
}

/**
 * Plugin to copy static files to the build directory.
 */
function copyStaticFiles(): Plugin {
    const targets = [
        { src: 'src/system.json', dest: 'build/system.json' },
        { src: 'src/templates', dest: 'build/templates' },
        { src: 'src/lang', dest: 'build/lang' },
        { src: 'src/assets', dest: 'build/assets' },
    ];

    return {
        name: 'copy-static-files',
        closeBundle() {
            targets.forEach(({ src, dest }) => {
                if (!fs.existsSync(src)) return;

                const stat = fs.statSync(src);
                if (stat.isDirectory()) {
                    fs.cpSync(src, dest, { recursive: true });
                } else {
                    const destDir = path.dirname(dest);
                    if (!fs.existsSync(destDir)) {
                        fs.mkdirSync(destDir, { recursive: true });
                    }
                    fs.copyFileSync(src, dest);
                }
            });
        },
    };
}

/**
 * Plugin to rename the CSS output file to match what system.json expects.
 */
function renameCssOutput(): Plugin {
    return {
        name: 'rename-css-output',
        closeBundle() {
            const cssFiles = fs
                .readdirSync('build')
                .filter(
                    (file) => file.endsWith('.css') && file !== 'output.css',
                );

            cssFiles.forEach((file) => {
                fs.renameSync(
                    path.join('build', file),
                    path.join('build', 'output.css'),
                );
            });
        },
    };
}

/**
 *
 * Plugin to defeat vite's penchant for inlining assets, especially base64-encoded image files.
 */
function deInlineCssAssets(outDir = 'build'): Plugin {
    return {
        name: 'de-inline-css-assets',
        closeBundle() {
            const cssPath = path.resolve(outDir, 'cosmere-rpg.css');
            if (!fs.existsSync(cssPath)) return;

            // Build content-hash → relative path map from already-copied assets
            const assetsDir = path.resolve(outDir, 'assets');
            const hashToPath = new Map<string, string>();
            const walkDir = (dir: string, base: string) => {
                for (const entry of fs.readdirSync(dir, {
                    withFileTypes: true,
                })) {
                    const full = path.join(dir, entry.name);
                    const rel = path.join(base, entry.name);
                    if (entry.isDirectory()) walkDir(full, rel);
                    else {
                        const hash = createHash('sha256')
                            .update(fs.readFileSync(full))
                            .digest('hex')
                            .slice(0, 8);
                        hashToPath.set(hash, rel.replace(/\\/g, '/'));
                    }
                }
            };
            if (fs.existsSync(assetsDir)) walkDir(assetsDir, 'assets');

            let css = fs.readFileSync(cssPath, 'utf-8');

            css = css.replace(
                /url\(["']data:([^;]+);base64,([^"']+)["']\)/g,
                (_match, _mime, data) => {
                    const buf = Buffer.from(data, 'base64');
                    const hash = createHash('sha256')
                        .update(buf)
                        .digest('hex')
                        .slice(0, 8);
                    const known = hashToPath.get(hash);
                    if (known) {
                        console.log('[de-inline] restored', known);
                        return `url("${known}")`;
                    }
                    console.warn('[de-inline] no match for hash', hash);
                    return _match; // leave as-is if no match
                },
            );

            fs.writeFileSync(cssPath, css);
        },
    };
}

export default defineConfig({
    build: {
        outDir: 'build',
        emptyOutDir: false, // We handle this manually to preserve packs
        sourcemap: true,
        minify: false,
        assetsInlineLimit: 0, // never inline; always emit as files
        lib: {
            entry: 'src/index.ts',
            formats: ['es'],
            fileName: () => 'index.js',
        },
        rollupOptions: {
            external: ['@pixi/core'],
            output: {
                assetFileNames: '[name][extname]',
            },
        },
    },
    resolve: {
        alias: {
            '@src': path.resolve(__dirname, 'src'),
            '@system': path.resolve(__dirname, 'src/system'),
        },
    },
    plugins: [
        clearOutputDir(),
        copyStaticFiles(),
        deInlineCssAssets(),
        markdownParser({
            targets: [
                { src: 'src/release-notes.md', dest: 'build/' },
                { src: 'src/patch-notes.md', dest: 'build/' },
            ],
        }),
        pixiImportFix(),
        renameCssOutput(),
    ],
});
