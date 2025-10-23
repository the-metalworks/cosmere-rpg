/* --- Starter rule styling --- */

import { COMPENDIUMS } from '@system/constants';

Hooks.on('renderJournalEntrySheet', (app, html) => {
    const entry = app.document;

    if (
        entry.pack === COMPENDIUMS.STARTER_RULES ||
        ('compendiumSource' in entry._stats &&
            entry._stats.compendiumSource?.startsWith(
                `Compendium.${COMPENDIUMS.STARTER_RULES}`,
            ))
    ) {
        html.classList.add('sljsr');

        const header_node = html.getElementsByClassName('journal-header')[0];

        header_node.removeChild(header_node.children[0]);
        header_node.insertAdjacentHTML(
            'beforeend',
            '<div class="sl-chapter-header"><div><p></p><p>' +
                entry.name.toUpperCase() +
                '</p><p></p></div><div><p></p></div></div>',
        );
    }
});

/* --- @Link blocks --- */

Hooks.on('renderJournalEntryPageSheet', (app, html) => {
    const page = app.document;

    $(html)
        .find('section[data-link].content-link-anchor')
        .each(function (this: HTMLElement) {
            const section = $(this);

            // Find matching closing section
            const closingSection = section
                .nextAll('section.content-link-anchor')
                .first();

            // Ensure a matching closing section exists
            if (!closingSection.length) return;

            // Remove empty p elements before and after the section
            section.prev('p:empty').remove();
            section.next('p:empty').remove();

            // Remove empty p elements before and after the closing section
            closingSection.prev('p:empty').remove();
            closingSection.next('p:empty').remove();

            // Get all the content between the sections
            const content = section.nextUntil(closingSection);

            // Remove the content from the main HTML
            content.remove();

            // If the first element of the content is a header, add the link
            const header = content.first().filter('h1, h2, h3, h4, h5, h6');
            if (header.length) {
                // Get all data attributes from the section
                const dataAttributes = section.data();
                const dataStr = Object.entries(dataAttributes)
                    .map(([key, value]) => `data-${key}="${value}"`)
                    .join(' ');

                // Grab the text of the header
                const headerText = header.text().trim();
                if (headerText && header.children().length === 0) {
                    // Clear the header text
                    header.text('');

                    // Append the header text as span
                    header.append(`<span>${headerText}</span>`);
                }

                // Append the link to the header
                header.append(
                    ` <a ${dataStr}><i class="fa-solid fa-up-right-from-square"></i></a>`,
                );
            }

            // Move all the content into the section
            section.append(content);

            // Remove the closing section
            closingSection.remove();

            // Replace the content-link-anchor class with pseudo-embed
            section.removeClass('content-link-anchor').addClass('pseudo-embed');
        });
});
