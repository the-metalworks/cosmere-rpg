import { defineConfig, Plugin } from 'vite';
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

export default defineConfig({
    build: {
        outDir: 'build',
        emptyOutDir: false, // We handle this manually to preserve packs
        sourcemap: true,
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
    css: {
        preprocessorOptions: {
            scss: {
                api: 'modern-compiler',
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
