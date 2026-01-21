# Entra ID SSO Application Onboarding Form

A professional web-based form for collecting information needed to set up Single Sign-On (SSO) in Microsoft Entra ID (Azure AD). This form helps streamline the SSO onboarding process by gathering all necessary details from application owners and vendors.

## Features

- ✅ **Comprehensive SSO Configuration** - Supports both SAML 2.0 and OIDC/OAuth protocols
- 💾 **Auto-Save** - Progress is automatically saved to browser localStorage
- 📁 **Export/Import** - Save progress to JSON files for backup or sharing
- 📄 **HTML Export** - Generate formatted, printable documentation
- 📊 **Progress Tracking** - Visual progress bar shows completion status
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile devices
- 🎨 **Professional UI** - Clean, modern interface with Microsoft Entra ID branding

## Usage

Simply open `index.html` in any modern web browser. No server or installation required!

### For End Users

1. **Fill out the form** - Provide as much information as you can about your application
2. **Auto-save** - Your progress is automatically saved as you type
3. **Export Progress** - Click "Export Progress to File" to save a JSON backup
4. **Export to HTML** - Click "Export to HTML" to generate a readable document
5. **Resume Later** - Your progress persists in the browser even after closing

### Form Sections

1. **General Application Information** - Basic app details and contacts
2. **SSO Protocol Information** - Protocol selection (SAML/OIDC/OAuth) and vendor documentation
3. **SAML Configuration** - Entity ID, ACS URL, signing options, attributes (if SAML selected)
4. **OIDC/OAuth Configuration** - Redirect URIs, grant types, scopes (if OIDC/OAuth selected)
5. **User Assignment & Access Control** - Group assignments, roles, and permissions
6. **Additional Configuration** - Branding, provisioning, and support information

## Deployment Options

### GitHub Pages (Recommended)

1. Create a new GitHub repository
2. Push these files to the repository
3. Go to Settings → Pages
4. Select your branch (e.g., `main`) and root folder
5. Your form will be live at `https://yourusername.github.io/reponame`

### Other Static Hosting

This is a static website and can be hosted on:
- **Netlify** - Drag and drop deployment
- **Vercel** - Git-based deployment
- **Azure Static Web Apps** - Great integration with Azure services
- **Cloudflare Pages** - Fast global CDN
- **Any web server** - Simply upload the three files

## Files

- `index.html` - Main form structure
- `styles.css` - Professional styling and responsive design
- `script.js` - Form functionality, auto-save, export/import logic
- `README.md` - This documentation

## Data Storage

**Important:** All form data is stored locally in your browser's localStorage. 

- ✅ Data persists after closing the browser
- ✅ Data survives browser restarts
- ⚠️ Data is device/browser-specific (not synchronized)
- ⚠️ Clearing browser data will delete saved forms
- 💡 Use "Export Progress to File" to create backups

## Browser Compatibility

Works in all modern browsers:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

## Customization

Feel free to customize the form for your organization:
- Modify `styles.css` to match your branding
- Edit form fields in `index.html`
- Adjust validation rules in `script.js`

## Security Considerations

- No sensitive data is transmitted over the network during normal use
- All data stays in the browser until explicitly exported
- Exported HTML/JSON files contain the information entered in the form
- Use secure channels (encrypted email, secure file sharing) when sharing exports

## Support

For issues or questions about SSO configuration, consult your IT/Identity team.

## License

This project is open source and available for use and modification.

---

**Version:** 1.0.0  
**Last Updated:** January 2026
