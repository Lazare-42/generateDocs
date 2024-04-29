import { generateDocComponents } from './generateDocComponents'
import { generateLinks } from './generateLinks'
import { generateRoutesFunction } from './generateRoutes'

const fs = require('fs')
const path = require('path')
const anthropic = require('@anthropic-ai/sdk')

export type DocComponent = {
    name: string
    path: string
}

// CONFIG Parameters
export const CONFIG = {
    referenceDir: './../../baas_content/reference/',
    routesFilePath: './../../src/routes/ReferenceRoutes.tsx',
    pagePath: './../../src/Baas/Page/Reference',
    outputPath: './../../src/Baas/components/LayoutAtoms/SubMenuReference.tsx',
    relativeMarkdownPosition: './../../../../baas_content/reference',
}

// Utility Functions
export function readFileContent(filePath: string): string {
    return fs.readFileSync(filePath, 'utf8')
}

export function writeFileContent(filePath: string, content: string): void {
    fs.writeFileSync(filePath, content)
    console.log(`File written successfully: ${filePath}`)
}

export function getDocComponentNameFromPath(filePath: string): string {
    return path
        .basename(filePath, '.tsx')
        .replace(/^./, (match: string) => match.toUpperCase())
}

export function processMarkdownFiles(
    taskFunction: (components: DocComponent[]) => void
): void {
    const mdFiles = findMdFiles(CONFIG.referenceDir)
    if (mdFiles.length === 0) {
        console.error('No .md files found in the specified directory.')
        process.exit(1)
    }
    taskFunction(mdFiles) // Pass only the paths to the task function.
}

function findMdFiles(dir: string): { name: string; path: string }[] {
    let filesList: { name: string; path: string }[] = []
    const files = fs.readdirSync(dir)

    files.forEach((file: string) => {
        if (file.startsWith('.')) {
            return // Skip hidden files and directories
        }
        const filePath = path.join(dir, file)
        const stat = fs.statSync(filePath)

        if (stat.isDirectory()) {
            // Recursively find files in subdirectories
            filesList = filesList.concat(findMdFiles(filePath))
        } else if (path.extname(file).toLowerCase() === '.md') {
            // Push file name and cleaned path into the list

            //name = path.relative(CONFIG.referenceDir, filePath).replace(/\\/g, '/').replace(/\.md$/, '')
            filesList.push({
                name: path.basename(file, '.md'),
                path: path
                    .relative(CONFIG.referenceDir, filePath)
                    .replace(/\\/g, '/')
                    .replace('.md', ''),
            })
        }
    })

    return filesList
}

async function generateMissingReadmeFilesForFolders(
    components: DocComponent[]
): Promise<void> {
    const folderPaths = new Set<string>()

    // Collect unique folder paths from the components
    components.forEach((component) => {
        const folderPath = path.dirname(
            path.join(CONFIG.referenceDir, component.path)
        )
        folderPaths.add(folderPath)
    })

    for (const folderPath of folderPaths) {
        const readmePath = path.join(folderPath, 'README.md')

        // Check if the README.md file already exists in the folder
        if (!fs.existsSync(readmePath)) {
            // Get the list of files in the folder
            const files = fs.readdirSync(folderPath)

            // Filter out the README.md file from the list
            const filteredFiles = files.filter(
                (file: string) => file !== 'README.md'
            )

            // Generate the content for the API request
            const apiContent = filteredFiles
                .map((file: string) => {
                    const filePath = path.join(folderPath, file)
                    const fileContent = fs.readFileSync(filePath, 'utf8')
                    return fileContent
                })
                .join('\n\n')

            // Make the API request to generate the README.md content
            const msg = await anthropic.messages.create({
                model: 'claude-3-opus-20240229',
                max_tokens: 1000,
                temperature: 0,
                system: "You are an expert developer.\nYou hate explaining, you write code and that's it.\nThe code you write is strongly typed TypeScript, always purely functional.\nYou don't write interface, and always write functions, not even catching and adding values using $.\nYou also are very well versed in Bash, Git, MD files, and of course, Rust.\nYou use the latest MacBook Pro with VSCode plugged in to magit ; and vim.\nYou know regex like an expert.\n\nYour goal is to share knowledge with other developers, by being clear and concise.",
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: `create a README.md for the ${path.basename(
                                    folderPath
                                )} folder based on the files inside:\n\n${apiContent}\n\nDo not assume any other information, which is probably written elsewhere in the docs. Create tables whenever possible. Do not output everything about the pages inside; this is an overview, which is dry and technical but also complete.\n\nDo not add "for detailed information", or sentences such as "Please refer to the individual API documentation for more details on the request and response formats, as well as any required parameters." The user will find out by themselves.`,
                            },
                        ],
                    },
                ],
            })

            // Write the generated content to the README.md file
            fs.writeFileSync(readmePath, msg.data.content)
            console.log(`Generated README.md for folder: ${folderPath}`)
        }
    }
}

// CLI Flag Handling
const generateRoutes = process.argv.includes('-generateRoutes')
const generateDocComponentsFlag = process.argv.includes(
    '-generateDocComponents'
)
const updateLinksFlag = process.argv.includes('-updateLinks')
const generateMenus = process.argv.includes('-generateMenus')

if (updateLinksFlag) {
    processMarkdownFiles(generateLinks)
}

if (generateDocComponentsFlag) {
    processMarkdownFiles(generateDocComponents)
}

if (generateRoutes) {
    processMarkdownFiles(generateRoutesFunction)
}

if (generateMenus) {
    processMarkdownFiles(generateMissingReadmeFilesForFolders)
}

if (
    !generateDocComponentsFlag &&
    !generateRoutes &&
    !updateLinksFlag &&
    !generateMenus
) {
    console.log(
        'No valid flag provided. Available flags: -generateRoutes, -generateDocComponents, -updateLinks,  -generateMenus'
    )
}
