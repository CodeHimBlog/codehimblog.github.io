# Legal and information page checklist

> **Not legal advice.** The pages in `content/pages/` are general templates written in plain English. Have them reviewed by a qualified professional for your country and situation.

Placeholders are written as `{{PLACEHOLDER: …}}` in `content/pages/*.html`. They appear highlighted in yellow on the live page, and **any page containing a placeholder is automatically `noindex` and left out of the sitemap** until you remove them and rebuild.

Find them all with:

```bash
grep -rn "PLACEHOLDER" content/pages
```

## Required before launch

| Page | What to provide |
|---|---|
| `/contact/` | A contact email address you monitor. Optionally a second channel (for example the GitHub repository's issue tracker). |
| `/privacy-policy/` | Operator name (person or organisation). Email retention period and email provider. Any jurisdiction-specific details (e.g. GDPR supervisory authority, if applicable). |
| `/terms-and-conditions/` | Operator name. Governing law and jurisdiction. |
| `/dmca/` | Contact for copyright notices. Whether a US DMCA designated-agent registration applies to you. |

Do **not** invent a company name, registration number or postal address. Only publish identity details that are true and that you are comfortable making public.

## Check that the policies still match reality

The privacy policy, about page, disclaimer and editorial policy currently state that the site:

- is hosted on GitHub Pages;
- sets no cookies of its own and uses no browser local storage;
- uses no analytics, advertising, affiliate links or tracking scripts;
- has no forms, accounts or comments;
- runs search entirely in the browser.

If you add **any** of the following, update these pages first (and add a consent banner where the law requires one):

- [ ] Analytics (Google Analytics, Plausible, Cloudflare Web Analytics, etc.)
- [ ] Advertising (AdSense or other networks)
- [ ] Affiliate links
- [ ] Embedded third-party content (YouTube videos, comment widgets, fonts loaded from a CDN)
- [ ] A contact form or newsletter provider
- [ ] A custom domain or a CDN/proxy in front of GitHub Pages

## Other checks

- [ ] The GitHub privacy statement link in the privacy policy still works.
- [ ] The footer trademark notice and disclaimer still describe how the site works.
- [ ] Update the `updated` date in each page's front matter when you change it.
- [ ] Re-run `node tools/build.mjs` and confirm the pages switch to `index, follow` once placeholders are gone.
