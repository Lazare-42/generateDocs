// Specific Task Functions

import {
    CONFIG,
    DocComponent,
    readFileContent,
    writeFileContent,
} from './generateApiReference'

export function generateLinks(components: DocComponent[]): void {
    components.forEach((file) => {
        let fileContent = readFileContent(
            CONFIG.referenceDir.concat(file.path.concat('.md'))
        )

        // Update links to lowercase and handle markdown links with or without anchors
        fileContent = fileContent.replace(/\(([^)]+)\)/gi, (match, p1) => {
            // Check if the path needs the "/baas/reference/" prefix
            if (!p1.startsWith('/baas/reference/')) {
                // Add prefix and convert to lowercase
                return `(/baas/reference/${p1.toLowerCase()})`
            } else {
                // Only convert to lowercase without adding prefix
                return `(${p1.toLowerCase()})`
            }
        })

        writeFileContent(file.name, fileContent)
        console.log(`Links updated successfully in ${file}`)
    })
}
