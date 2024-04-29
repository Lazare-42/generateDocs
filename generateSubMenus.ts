import { CONFIG, DocComponent, writeFileContent } from './generateApiReference'

export function generateReferenceDocComponent(
    components: DocComponent[]
): void {
    // Categorize components based on the first part of their path (e.g., 'Apis', 'Models')
    const categories = components.reduce<{
        [category: string]: DocComponent[]
    }>((acc, component) => {
        const category = component.path.split('/')[0] // Get the category from the path
        if (!acc[category]) {
            acc[category] = []
        }
        acc[category].push(component)
        return acc
    }, {})

    // Prepare subMenus array for the dropdown
    const subMenus = Object.keys(categories).map((category) => ({
        name: category.charAt(0).toUpperCase() + category.slice(1), // Capitalize the category name
        paths: categories[category].map((comp) => '/' + comp.path), // Map component paths for menu items
    }))

    // Generate the component JSX content
    const componentContent = `
import React from 'react';
import { IntegrationIcon } from '~/assets/icons';
import { BaasMenuDropdownButton } from '~/Baas/components/Atoms/Buttons/BaasMenuDropDownButton';

export const Reference = () => {
    return (
        <BaasMenuDropdownButton
            leftIcon={<IntegrationIcon />}
            name="API Reference"
            subMenus={${JSON.stringify(subMenus, null, 2)}}
            path="/baas/reference"
        />
    );
};

export default Reference;
    `.trim()

    writeFileContent(CONFIG.outputPath, componentContent)
    console.log('Reference.tsx generated successfully.', CONFIG.outputPath)
}
