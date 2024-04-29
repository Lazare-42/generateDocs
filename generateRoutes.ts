import {
    CONFIG,
    DocComponent,
    getDocComponentNameFromPath,
    writeFileContent,
} from './generateApiReference'

const path = require('path')

export function generateRoutesFunction(components: DocComponent[]) {
    const routeElements: string[] = []
    const imports: string[] = []

    components.forEach((component) => {
        if (component.name.startsWith('.')) {
            console.log(`Skipping ${component.name}`)
            return
        }

        // Get the relative path of the file from the reference directory and normalize it for URLs
        const fileRelativePath = path.relative(
            CONFIG.referenceDir,
            component.name
        )
        const normalizedPath = fileRelativePath
            .split(path.sep)
            .join('/')
            .replace(/\.md$/, '')

        const componentName = getDocComponentNameFromPath(
            component.name
        ).replace(/\.md$/, '')
        // Use the normalized path as the route path
        const routePath = `/${normalizedPath.toLowerCase()}`
        const importPath = `~/Baas/Page/Reference/${componentName}`

        routeElements.push(
            `<Route path="${component.path.toLowerCase()}" element={<${componentName} />} />`
        )
        imports.push(`import ${componentName} from '${importPath}';`)
    })

    const routesContent = `
import React from 'react';
import { Routes, Route } from 'react-router-dom';
${imports.join('\n')}

const ReferenceRoutes = () => (
    <Routes>
        <Route path="/" element={<README />} />
        ${routeElements.join('\n        ')}
    </Routes>
);

export default ReferenceRoutes;
    `.trim()

    writeFileContent(CONFIG.routesFilePath, routesContent)
    console.log(`Routes file created successfully: ${CONFIG.routesFilePath}`)
}
