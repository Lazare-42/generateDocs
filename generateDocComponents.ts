import { CONFIG, DocComponent, writeFileContent } from './generateApiReference'
const path = require('path')

export function generateDocComponents(components: DocComponent[]) {
    console.log('GENERATE COMPONENTS WITH', components)
    components.forEach((component: DocComponent) => {
        if (component.name.startsWith('.')) {
            console.log(
                `Skipping ${component.name} because it is a hidden file`
            )
            return
        }

        console.log(
            'CONFIG',
            CONFIG.referenceDir,
            'fileName',
            component.name,
            'path',
            component.path
        )

        // Import path should go from the component directory to the markdown file directly
        const importRelativePath = path.relative(
            CONFIG.pagePath,
            component.path
        )

        // Derive component name from the file name
        const componentName = component.name
        const componentPath = `${CONFIG.pagePath}/${componentName}.tsx`

        const componentContent = `
import React from 'react';
import { DocumentationPageCode } from '~/Baas/components/MDRenderer/MDRendererBaas';
import markdownContent from './${CONFIG.relativeMarkdownPosition}/${component.path}.md';


const ${componentName} = () => {
    return <DocumentationPageCode fileContent={markdownContent} />;
};

export default ${componentName};
        `.trim()

        writeFileContent(componentPath, componentContent)
        console.log(
            `DocComponent generated: ${componentName} at ${componentPath}`
        )
    })
}
